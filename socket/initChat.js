"use strict";

const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');
const logger = require('./lib/logger');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';
const MESSAGE_RATE_WINDOW_MS = Number(process.env.MESSAGE_RATE_WINDOW_MS || 10000);
const MESSAGE_RATE_LIMIT_PER_ROOM = Number(process.env.MESSAGE_RATE_LIMIT_PER_ROOM || 8);
const KNOWN_LOUNGE_IDS = new Set(['1', '2', '3']);

/**
 * Socket connection tracking for presence management.
 * userId -> Set<socketId>
 */
const userSockets = new Map();
const messageRateByUserRoom = new Map();

function emitSocketError(socket, code, message, details) {
  socket.emit('chat-error', {
    code,
    message,
    ...(details ? { details } : {})
  });
}

function extractAccessToken(socket) {
  const authToken = socket?.handshake?.auth?.token;
  const authHeader = socket?.handshake?.headers?.authorization;
  const queryToken = socket?.handshake?.query?.token;

  const raw = authToken || authHeader || queryToken;
  if (!raw || typeof raw !== 'string') return null;

  if (raw.startsWith('Bearer ')) {
    return raw.slice(7).trim();
  }

  return raw.trim();
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

function isRateLimited(userId, loungeId) {
  const now = Date.now();
  const key = `${userId}:${loungeId}`;
  const current = messageRateByUserRoom.get(key);

  if (!current || now - current.windowStart >= MESSAGE_RATE_WINDOW_MS) {
    messageRateByUserRoom.set(key, { count: 1, windowStart: now });
    return false;
  }

  current.count += 1;
  if (current.count > MESSAGE_RATE_LIMIT_PER_ROOM) {
    return true;
  }

  return false;
}

function validateMessagePayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  const loungeId = typeof payload.loungeId === 'string' ? payload.loungeId.trim() : '';
  const languageRoomId = typeof payload.languageRoomId === 'string' ? payload.languageRoomId.trim() : null;
  const rawContent = typeof payload.content === 'string' ? payload.content : '';
  const content = rawContent.trim();
  const displayUsername = typeof payload.displayUsername === 'string' ? payload.displayUsername.trim() : '';

  const validMessageTypes = new Set(['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM']);
  const messageType = validMessageTypes.has(payload.messageType) ? payload.messageType : 'TEXT';

  if (!loungeId) errors.push('loungeId is required');
  if (!content) errors.push('content is required');
  if (content.length > 2000) errors.push('content must be 2000 characters or fewer');
  if (displayUsername.length > 64) errors.push('displayUsername must be 64 characters or fewer');

  return {
    valid: errors.length === 0,
    errors,
    value: {
      loungeId,
      languageRoomId,
      content,
      displayUsername,
      messageType
    }
  };
}

async function loungeExists(loungeId) {
  if (KNOWN_LOUNGE_IDS.has(loungeId)) return true;

  if (!prisma.lounge || typeof prisma.lounge.findUnique !== 'function') {
    return false;
  }

  try {
    const lounge = await prisma.lounge.findUnique({
      where: { id: loungeId },
      select: { id: true }
    });
    return Boolean(lounge);
  } catch (error) {
    logger.warn('Unable to check lounge existence via Prisma model', error);
    return false;
  }
}

async function hasSessionAccess(userId, sessionType) {
  if (sessionType === 'guest') {
    return true;
  }

  if (!prisma.session || typeof prisma.session.findFirst !== 'function') {
    return false;
  }

  try {
    const activeSession = await prisma.session.findFirst({
      where: {
        userId,
        isActive: true
      },
      select: { id: true }
    });

    return Boolean(activeSession);
  } catch (error) {
    logger.error('Error validating active session access:', error);
    return false;
  }
}

async function canAccessLounge(socket, loungeId) {
  const userId = socket.data.userId;
  const sessionType = socket.data.sessionType || 'user';
  const allowedLoungeIds = socket.data.allowedLoungeIds;

  if (!loungeId || typeof loungeId !== 'string') return false;
  if (!(await loungeExists(loungeId))) return false;
  if (!(await hasSessionAccess(userId, sessionType))) return false;

  if (Array.isArray(allowedLoungeIds) && allowedLoungeIds.length > 0) {
    return allowedLoungeIds.includes(loungeId);
  }

  return true;
}

const initChat = (io) => {
  io.use((socket, next) => {
    const token = extractAccessToken(socket);
    if (!token) {
      const error = new Error('Authentication required');
      error.data = { code: 'AUTH_REQUIRED' };
      return next(error);
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      const error = new Error('Invalid or expired token');
      error.data = { code: 'AUTH_INVALID' };
      return next(error);
    }

    socket.data.userId = payload.userId;
    socket.data.sessionType = payload.sessionType || 'user';
    socket.data.allowedLoungeIds = Array.isArray(payload.allowedLoungeIds)
      ? payload.allowedLoungeIds.map(String)
      : [];
    socket.data.joinedLounges = new Set();

    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logger.info(`User connected: ${socket.id} (user: ${userId})`);

    socket.on('join-lounge', async ({ loungeId } = {}) => {
      try {
        const normalizedLoungeId = typeof loungeId === 'string' ? loungeId.trim() : '';
        if (!normalizedLoungeId) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'loungeId is required');
          return;
        }

        const authorized = await canAccessLounge(socket, normalizedLoungeId);
        if (!authorized) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Not authorized for this lounge', { loungeId: normalizedLoungeId });
          return;
        }

        socket.join(normalizedLoungeId);
        socket.data.loungeId = normalizedLoungeId;
        socket.data.joinedLounges.add(normalizedLoungeId);

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        if (prisma.user && typeof prisma.user.update === 'function') {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isOnline: true,
              lastSeenAt: new Date()
            }
          }).catch((error) => {
            logger.warn(`Unable to update online status for user ${userId}:`, error.message);
          });
        }

        socket.emit('lounge-joined', { loungeId: normalizedLoungeId, userId });
        socket.to(normalizedLoungeId).emit('user-joined', {
          userId,
          timestamp: new Date()
        });

        logger.info(`User ${userId} joined lounge ${normalizedLoungeId}`);
      } catch (error) {
        logger.error('Error in join-lounge:', error);
        emitSocketError(socket, 'INTERNAL_ERROR', 'Failed to join lounge');
      }
    });

    socket.on('typing', ({ loungeId, isTyping } = {}) => {
      const normalizedLoungeId = typeof loungeId === 'string' ? loungeId.trim() : '';
      if (!normalizedLoungeId || !socket.data.joinedLounges.has(normalizedLoungeId)) {
        emitSocketError(socket, 'AUTHZ_DENIED', 'Cannot send typing for a lounge you have not joined');
        return;
      }

      socket.to(normalizedLoungeId).emit('user-typing', {
        userId,
        isTyping: Boolean(isTyping),
        timestamp: new Date()
      });
    });

    socket.on('message', async (payload = {}) => {
      try {
        const validation = validateMessagePayload(payload);
        if (!validation.valid) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'Invalid message payload', {
            errors: validation.errors
          });
          return;
        }

        const { loungeId, languageRoomId, content, displayUsername, messageType } = validation.value;

        if (!socket.data.joinedLounges.has(loungeId)) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'You must join the lounge before sending messages', { loungeId });
          return;
        }

        const authorized = await canAccessLounge(socket, loungeId);
        if (!authorized) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Not authorized to send messages in this lounge', { loungeId });
          return;
        }

        if (isRateLimited(userId, loungeId)) {
          emitSocketError(socket, 'RATE_LIMITED', 'Too many messages. Please slow down.', {
            windowMs: MESSAGE_RATE_WINDOW_MS,
            maxMessages: MESSAGE_RATE_LIMIT_PER_ROOM
          });
          return;
        }

        const message = await prisma.chatMessage.create({
          data: {
            loungeId,
            languageRoomId,
            userId,
            displayUsername: displayUsername || `user_${String(userId).slice(0, 6)}`,
            messageText: content,
            messageType,
            moderationStatus: 'APPROVED'
          },
          include: {
            user: {
              select: {
                id: true,
                permanentUsername: true,
                preferredName: true,
                avatarUrl: true
              }
            }
          }
        });

        io.to(loungeId).emit('message', {
          id: message.id,
          loungeId: message.loungeId,
          languageRoomId: message.languageRoomId,
          userId: message.userId,
          displayUsername: message.displayUsername,
          content: message.messageText,
          messageType: message.messageType,
          isEdited: message.isEdited,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
          user: message.user
        });

        logger.info(`Message ${message.id} created by user ${userId} in lounge ${loungeId}`);
      } catch (error) {
        logger.error('Error in message creation:', error);
        emitSocketError(socket, 'INTERNAL_ERROR', 'Failed to send message');
      }
    });

    socket.on('edit-message', async ({ messageId, newContent, loungeId } = {}) => {
      try {
        const normalizedMessageId = typeof messageId === 'string' ? messageId.trim() : '';
        const normalizedLoungeId = typeof loungeId === 'string' ? loungeId.trim() : '';
        const normalizedContent = typeof newContent === 'string' ? newContent.trim() : '';

        if (!normalizedMessageId || !normalizedLoungeId || !normalizedContent) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'messageId, loungeId and newContent are required');
          return;
        }

        if (!socket.data.joinedLounges.has(normalizedLoungeId)) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Cannot edit message in a lounge you have not joined');
          return;
        }

        const existingMessage = await prisma.chatMessage.findUnique({ where: { id: normalizedMessageId } });
        if (!existingMessage) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'Message not found');
          return;
        }

        if (existingMessage.userId !== userId) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Not authorized to edit this message');
          return;
        }

        const updatedMessage = await prisma.chatMessage.update({
          where: { id: normalizedMessageId },
          data: {
            messageText: normalizedContent,
            isEdited: true,
            editedAt: new Date()
          }
        });

        io.to(normalizedLoungeId).emit('message-edited', {
          id: updatedMessage.id,
          content: updatedMessage.messageText,
          isEdited: updatedMessage.isEdited,
          editedAt: updatedMessage.editedAt,
          userId: updatedMessage.userId
        });
      } catch (error) {
        logger.error('Error in edit-message:', error);
        emitSocketError(socket, 'INTERNAL_ERROR', 'Failed to edit message');
      }
    });

    socket.on('delete-message', async ({ messageId, loungeId } = {}) => {
      try {
        const normalizedMessageId = typeof messageId === 'string' ? messageId.trim() : '';
        const normalizedLoungeId = typeof loungeId === 'string' ? loungeId.trim() : '';

        if (!normalizedMessageId || !normalizedLoungeId) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'messageId and loungeId are required');
          return;
        }

        if (!socket.data.joinedLounges.has(normalizedLoungeId)) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Cannot delete message in a lounge you have not joined');
          return;
        }

        const existingMessage = await prisma.chatMessage.findUnique({ where: { id: normalizedMessageId } });
        if (!existingMessage) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'Message not found');
          return;
        }

        if (existingMessage.userId !== userId) {
          emitSocketError(socket, 'AUTHZ_DENIED', 'Not authorized to delete this message');
          return;
        }

        const deletedMessage = await prisma.chatMessage.update({
          where: { id: normalizedMessageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: userId
          }
        });

        io.to(normalizedLoungeId).emit('message-deleted', {
          id: deletedMessage.id,
          userId: deletedMessage.userId,
          deletedAt: deletedMessage.deletedAt,
          deletedById: deletedMessage.deletedById
        });
      } catch (error) {
        logger.error('Error in delete-message:', error);
        emitSocketError(socket, 'INTERNAL_ERROR', 'Failed to delete message');
      }
    });

    socket.on('leave-lounge', async ({ loungeId } = {}) => {
      try {
        const normalizedLoungeId = typeof loungeId === 'string' ? loungeId.trim() : '';
        if (!normalizedLoungeId) {
          emitSocketError(socket, 'VALIDATION_ERROR', 'loungeId is required');
          return;
        }

        socket.leave(normalizedLoungeId);
        socket.data.joinedLounges.delete(normalizedLoungeId);

        socket.to(normalizedLoungeId).emit('user-left', {
          userId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error in leave-lounge:', error);
        emitSocketError(socket, 'INTERNAL_ERROR', 'Failed to leave lounge');
      }
    });

    socket.on('disconnect', async () => {
      try {
        const activeSockets = userSockets.get(userId);
        if (activeSockets) {
          activeSockets.delete(socket.id);
          if (activeSockets.size === 0) {
            userSockets.delete(userId);

            if (prisma.user && typeof prisma.user.update === 'function') {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  isOnline: false,
                  lastSeenAt: new Date()
                }
              }).catch((error) => {
                logger.warn(`Unable to update offline status for user ${userId}:`, error.message);
              });
            }
          }
        }

        logger.info(`Socket ${socket.id} disconnected (user: ${userId})`);
      } catch (error) {
        logger.error('Error in disconnect handler:', error);
      }
    });
  });

  setInterval(async () => {
    try {
      if (!prisma.user || typeof prisma.user.findMany !== 'function') return;

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const staleUsers = await prisma.user.findMany({
        where: {
          isOnline: true,
          lastSeenAt: { lt: fiveMinutesAgo }
        },
        select: { id: true }
      });

      if (staleUsers.length === 0) return;

      const usersToMarkOffline = staleUsers.filter((user) => !userSockets.has(user.id));
      if (usersToMarkOffline.length === 0) return;

      await prisma.user.updateMany({
        where: {
          id: { in: usersToMarkOffline.map((u) => u.id) }
        },
        data: {
          isOnline: false
        }
      });

      logger.info(`Marked ${usersToMarkOffline.length} stale users as offline`);
    } catch (error) {
      logger.error('Error in cleanup interval:', error);
    }
  }, 5 * 60 * 1000);

  logger.info('Chat system initialized with authenticated sockets and secure messaging');
};

exports.initChat = initChat;
