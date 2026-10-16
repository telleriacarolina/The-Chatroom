const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function authenticateSocket(socket, next) {
  try {
    const authToken = socket.handshake?.auth?.token;
    const headerToken = socket.handshake?.headers?.authorization?.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.slice(7)
      : null;
    const token = authToken || headerToken;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = jwt.verify(token, ACCESS_SECRET);
    if (!payload?.userId) {
      return next(new Error('Invalid or expired token'));
    }

    socket.userId = payload.userId;
    return next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
}

async function getActiveUserForMessaging(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      permanentUsername: true,
      preferredName: true,
      avatarUrl: true,
      accountStatus: true,
      isBanned: true,
      banExpiresAt: true,
      isMuted: true,
      muteExpiresAt: true
    }
  });

  if (!user) {
    return { ok: false, reason: 'User not found' };
  }

  const now = new Date();
  const banActive = user.isBanned && (!user.banExpiresAt || user.banExpiresAt > now);
  if (banActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
    return { ok: false, reason: 'User is banned from chat' };
  }

  const muteExpired = user.isMuted && user.muteExpiresAt && user.muteExpiresAt <= now;
  if (muteExpired) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isMuted: false, muteExpiresAt: null }
    });
    user.isMuted = false;
    user.muteExpiresAt = null;
  }

  return { ok: true, user };
}

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    socket.on('join_room', async ({ loungeId, languageRoomId }) => {
      try {
        if (!loungeId || !languageRoomId) {
          socket.emit('error', { message: 'loungeId and languageRoomId are required' });
          return;
        }

        const room = await prisma.languageRoom.findFirst({
          where: {
            id: languageRoomId,
            loungeId,
            isActive: true
          },
          select: { id: true }
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found for lounge' });
          return;
        }

        socket.join(languageRoomId);
        socket.data.currentRoom = languageRoomId;
        socket.data.currentLounge = loungeId;

        socket.emit('room_joined', { loungeId, languageRoomId });
        socket.to(languageRoomId).emit('user_joined', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leave_room', ({ languageRoomId }) => {
      if (!languageRoomId) {
        return;
      }

      socket.leave(languageRoomId);
      if (socket.data.currentRoom === languageRoomId) {
        socket.data.currentRoom = null;
        socket.data.currentLounge = null;
      }

      socket.to(languageRoomId).emit('user_left', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('chat_message', async ({ loungeId, languageRoomId, messageText, messageType = 'TEXT', attachmentUrl }) => {
      try {
        if (!languageRoomId || !loungeId) {
          socket.emit('error', { message: 'loungeId and languageRoomId are required' });
          return;
        }
        if ((!messageText || !messageText.trim()) && !attachmentUrl) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        const joinedRoom = socket.data.currentRoom;
        if (joinedRoom !== languageRoomId || !socket.rooms.has(languageRoomId)) {
          socket.emit('error', { message: 'Not joined to this room' });
          return;
        }

        const room = await prisma.languageRoom.findFirst({
          where: {
            id: languageRoomId,
            loungeId,
            isActive: true
          },
          select: { id: true }
        });
        if (!room) {
          socket.emit('error', { message: 'Room not found for lounge' });
          return;
        }

        const activeUserResult = await getActiveUserForMessaging(socket.userId);
        if (!activeUserResult.ok) {
          socket.emit('error', { message: activeUserResult.reason });
          return;
        }

        if (activeUserResult.user.isMuted) {
          socket.emit('error', { message: 'User is muted and cannot send messages' });
          return;
        }

        const safeMessageType = ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM'].includes(messageType) ? messageType : 'TEXT';
        const message = await prisma.chatMessage.create({
          data: {
            loungeId,
            languageRoomId,
            userId: socket.userId,
            displayUsername: activeUserResult.user.permanentUsername || activeUserResult.user.preferredName || 'Anonymous',
            messageText: messageText?.trim() || '',
            messageType: safeMessageType,
            attachmentUrl,
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

        io.to(languageRoomId).emit('chat_message', message);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', ({ languageRoomId }) => {
      if (languageRoomId && socket.rooms.has(languageRoomId)) {
        socket.to(languageRoomId).emit('user_typing', {
          userId: socket.userId,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', ({ languageRoomId }) => {
      if (languageRoomId && socket.rooms.has(languageRoomId)) {
        socket.to(languageRoomId).emit('user_typing', {
          userId: socket.userId,
          isTyping: false
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      if (socket.data.currentRoom) {
        socket.to(socket.data.currentRoom).emit('user_left', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  return io;
}

module.exports = { initializeSocketIO };
