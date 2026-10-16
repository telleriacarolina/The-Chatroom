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

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, '../../public')));

io.use((socket, next) => {
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
      if ((!messageText || !messageText.trim()) && !attachmentUrl) {
        socket.emit('error', { message: 'Message content is required' });
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
      const message = await prisma.chatMessage.create({
        data: {
          loungeId,
          languageRoomId,
          userId: socket.userId,
          displayUsername: user.permanentUsername || user.preferredName || 'Anonymous',
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

const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Socket.IO server running on http://localhost:${PORT}`);
});

module.exports = server;
