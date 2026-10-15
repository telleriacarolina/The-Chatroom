const { Server } = require('socket.io');
const { prisma } = require('../lib/prisma');
const { authenticateSocket } = require('../middleware/auth');
const logger = require('../utils/logger');
const { SOCKET_EVENTS, SOCKET_ERROR_CODES } = require('@chatroom/shared/socket-protocol');

const VALID_MESSAGE_TYPES = new Set(['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM']);

function emitSocketError(socket, code, message) {
  socket.emit(SOCKET_EVENTS.SERVER.ERROR, { code, message });
}

function isRoomMembershipValid(socket, loungeId, languageRoomId) {
  const memberships = socket.data.memberships;
  if (!memberships) return false;
  return memberships.get(languageRoomId) === loungeId;
}

function isUserRestrictedFromMessaging(user, now = new Date()) {
  if (!user) return { restricted: true, reason: 'User not found' };
  if (user.accountStatus !== 'ACTIVE') return { restricted: true, reason: 'Account is not active' };
  if (user.isBanned) return { restricted: true, reason: 'User is banned from chat' };

  if (user.isMuted) {
    if (!user.muteExpiresAt || user.muteExpiresAt > now) {
      return { restricted: true, reason: 'User is muted from chat' };
    }
  }

  return { restricted: false };
}

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    socket.data.memberships = new Map();
    logger.info(`User connected: ${socket.userId}`);

    // Join a language room
    socket.on(SOCKET_EVENTS.CLIENT.JOIN_ROOM, async ({ loungeId, languageRoomId }) => {
      try {
        if (!loungeId || !languageRoomId) {
          emitSocketError(socket, SOCKET_ERROR_CODES.INVALID_ROOM_MEMBERSHIP, 'loungeId and languageRoomId are required');
          return;
        }

        const room = await prisma.languageRoom.findFirst({
          where: {
            id: languageRoomId,
            loungeId,
            isActive: true,
            lounge: {
              isActive: true
            }
          }
        });

        if (!room) {
          emitSocketError(socket, SOCKET_ERROR_CODES.ROOM_NOT_FOUND, 'Room not found');
          return;
        }

        socket.join(languageRoomId);
        socket.data.memberships.set(languageRoomId, loungeId);

        logger.info(`User ${socket.userId} joined room ${languageRoomId}`);
        
        // Notify room members
        socket.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.USER_JOINED, {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error joining room:', error);
        emitSocketError(socket, SOCKET_ERROR_CODES.JOIN_ROOM_FAILED, 'Failed to join room');
      }
    });

    // Leave a room
    socket.on(SOCKET_EVENTS.CLIENT.LEAVE_ROOM, ({ languageRoomId }) => {
      if (!languageRoomId) return;
      socket.leave(languageRoomId);
      socket.data.memberships.delete(languageRoomId);
      socket.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.USER_LEFT, {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
      logger.info(`User ${socket.userId} left room ${languageRoomId}`);
    });

    // Send a chat message
    socket.on(SOCKET_EVENTS.CLIENT.CHAT_MESSAGE, async (data) => {
      try {
        const { loungeId, languageRoomId, messageText, messageType = 'TEXT', attachmentUrl } = data;

        if (!isRoomMembershipValid(socket, loungeId, languageRoomId)) {
          emitSocketError(socket, SOCKET_ERROR_CODES.ROOM_MEMBERSHIP_REQUIRED, 'Not in this room');
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: {
            id: true,
            permanentUsername: true,
            avatarUrl: true,
            accountStatus: true,
            isBanned: true,
            isMuted: true,
            muteExpiresAt: true
          }
        });

        const moderationCheck = isUserRestrictedFromMessaging(user);
        if (moderationCheck.restricted) {
          const code = user ? SOCKET_ERROR_CODES.MODERATION_RESTRICTED : SOCKET_ERROR_CODES.USER_NOT_FOUND;
          emitSocketError(socket, code, moderationCheck.reason);
          return;
        }

        if (!messageText || !String(messageText).trim()) {
          emitSocketError(socket, SOCKET_ERROR_CODES.INVALID_MESSAGE, 'Message text is required');
          return;
        }

        if (!VALID_MESSAGE_TYPES.has(messageType)) {
          emitSocketError(socket, SOCKET_ERROR_CODES.INVALID_MESSAGE, 'Invalid message type');
          return;
        }

        const room = await prisma.languageRoom.findFirst({
          where: { id: languageRoomId, loungeId, isActive: true },
          select: { id: true }
        });
        if (!room) {
          emitSocketError(socket, SOCKET_ERROR_CODES.INVALID_ROOM_MEMBERSHIP, 'Room does not belong to lounge');
          return;
        }

        // Create message in database
        const message = await prisma.chatMessage.create({
          data: {
            loungeId,
            languageRoomId,
            userId: socket.userId,
            displayUsername: user.permanentUsername || 'Anonymous',
            messageText: String(messageText).trim(),
            messageType,
            attachmentUrl,
            moderationStatus: 'APPROVED'
          },
          include: {
            user: {
              select: {
                id: true,
                permanentUsername: true,
                avatarUrl: true
              }
            }
          }
        });

        // Broadcast message to room
        io.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.CHAT_MESSAGE, message);

        logger.info(`Message sent by ${socket.userId} in room ${languageRoomId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        emitSocketError(socket, SOCKET_ERROR_CODES.SEND_MESSAGE_FAILED, 'Failed to send message');
      }
    });

    // Typing indicator
    socket.on(SOCKET_EVENTS.CLIENT.TYPING_START, ({ loungeId, languageRoomId }) => {
      if (!isRoomMembershipValid(socket, loungeId, languageRoomId)) return;
      socket.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.USER_TYPING, {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on(SOCKET_EVENTS.CLIENT.TYPING_STOP, ({ loungeId, languageRoomId }) => {
      if (!isRoomMembershipValid(socket, loungeId, languageRoomId)) return;
      socket.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.USER_TYPING, {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);

      const joinedRooms = socket.data.memberships ? [...socket.data.memberships.keys()] : [];
      joinedRooms.forEach((roomId) => {
        socket.to(roomId).emit(SOCKET_EVENTS.SERVER.USER_LEFT, {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });
    });
  });

  return io;
}

module.exports = {
  initializeSocketIO,
  isRoomMembershipValid,
  isUserRestrictedFromMessaging
};
