require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const logger = require('./lib/logger');

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

const configuredAccessSecret = process.env.ACCESS_TOKEN_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredAccessSecret || configuredAccessSecret === 'dev_access_secret')) {
  throw new Error('ACCESS_TOKEN_SECRET must be set in production');
}
const ACCESS_SECRET = configuredAccessSecret || (process.env.NODE_ENV === 'production' ? undefined : 'dev_access_secret');
const JWT_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

if (!ACCESS_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET must be configured');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, '../../public')));

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake?.auth?.token;
    const headerToken = typeof socket.handshake?.headers?.authorization === 'string' && socket.handshake.headers.authorization.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.slice(7)
      : null;
    const token = authToken || headerToken;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      if (payload?.userId) {
        socket.userId = payload.userId;
        return next();
      }
    } catch (error) {
      // Invalid JWTs are rejected before temp-session fallback checks. Only a valid temp-session token may continue.
    }

    if (JWT_TOKEN_PATTERN.test(token)) {
      return next(new Error('Invalid or expired token'));
    }

    const guestTempSession = await prisma.tempSession.findUnique({
      where: { sessionToken: token },
      select: { id: true, temporaryUsername: true, userId: true, expiresAt: true }
    });

    if (!guestTempSession) {
      return next(new Error('Invalid or expired token'));
    }

    if (guestTempSession.expiresAt && new Date(guestTempSession.expiresAt).getTime() <= Date.now()) {
      return next(new Error('Guest session expired'));
    }

    socket.userId = guestTempSession.userId || guestTempSession.id;
    socket.tempSessionId = guestTempSession.id;
    socket.tempSessionUsername = guestTempSession.temporaryUsername;
    return next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
});

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
      if (!loungeId || !languageRoomId) {
        socket.emit('error', { message: 'loungeId and languageRoomId are required' });
        return;
      }
      const hasText = typeof messageText === 'string' && messageText.trim().length > 0;
      const hasAttachment = typeof attachmentUrl === 'string' && attachmentUrl.trim().length > 0;
      if (!hasText && !hasAttachment) {
        socket.emit('error', { message: 'Message text or an attachment is required' });
        return;
      }
      if (socket.data.currentRoom !== languageRoomId || !socket.rooms.has(languageRoomId)) {
        socket.emit('error', { message: 'Not joined to this room' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: socket.userId },
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
        socket.emit('error', { message: 'User not found' });
        return;
      }

      const now = new Date();
      const banActive = user.isBanned && (!user.banExpiresAt || user.banExpiresAt > now);
      if (banActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
        socket.emit('error', { message: 'User is banned from chat' });
        return;
      }
      if (user.isMuted && (!user.muteExpiresAt || user.muteExpiresAt > now)) {
        socket.emit('error', { message: 'User is muted and cannot send messages' });
        return;
      }
      if (user.isMuted && user.muteExpiresAt && user.muteExpiresAt <= now) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isMuted: false, muteExpiresAt: null }
        });
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

      const safeMessageType = ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM'].includes(messageType) ? messageType : 'TEXT';
      const normalizedMessageText = typeof messageText === 'string' ? messageText.trim() : '';
      const normalizedAttachmentUrl = typeof attachmentUrl === 'string' ? attachmentUrl.trim() : attachmentUrl;
      const message = await prisma.chatMessage.create({
        data: {
          loungeId,
          languageRoomId,
          userId: socket.userId,
          displayUsername: user.permanentUsername || user.preferredName || 'Anonymous',
          messageText: normalizedMessageText,
          messageType: safeMessageType,
          attachmentUrl: normalizedAttachmentUrl || null,
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

const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Socket.IO server running on http://localhost:${PORT}`);
});

module.exports = server;
