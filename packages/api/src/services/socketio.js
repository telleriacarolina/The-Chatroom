const { Server } = require('socket.io');
const { prisma } = require('../lib/prisma');
const { authenticateSocket } = require('../middleware/auth');
const logger = require('../utils/logger');
const { SOCKET_EVENTS, SOCKET_ERROR_CODES } = require('@chatroom/shared/socket-protocol');
const { isRoomMembershipValid, isUserRestrictedFromMessaging } = require('./socketGuards');

const VALID_MESSAGE_TYPES = new Set(['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM']);

function emitSocketError(socket, code, message) {
  socket.emit(SOCKET_EVENTS.SERVER.ERROR, { code, message });
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
          socket.emit('error', { message: 'loungeId and languageRoomId are required' });
          return;
        }

        // Verify room exists and belongs to lounge
        const room = await prisma.languageRoom.findFirst({
          where: {
            id: languageRoomId,
            loungeId,
            isActive: true
          }
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found for lounge' });
          return;
        }

        socket.join(languageRoomId);
        socket.data.currentRoom = languageRoomId;
        socket.data.currentLounge = loungeId;

        logger.info(`User ${socket.userId} joined room ${languageRoomId}`);

        socket.emit('room_joined', { loungeId, languageRoomId });
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
      logger.info(`User ${socket.userId} left room ${languageRoomId}`);
    });

    // Send a chat message
    socket.on(SOCKET_EVENTS.CLIENT.CHAT_MESSAGE, async (data) => {
      try {
        const { loungeId, languageRoomId, messageText, messageType = 'TEXT', attachmentUrl } = data;

        if (!loungeId || !languageRoomId) {
          socket.emit('error', { message: 'loungeId and languageRoomId are required' });
          return;
        }
        if ((!messageText || !messageText.trim()) && !attachmentUrl) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        if (!isRoomMembershipValid(socket, languageRoomId)) {
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

        const now = new Date();
        const banActive = user.isBanned && (!user.banExpiresAt || user.banExpiresAt > now);
        if (banActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
          socket.emit('error', { message: 'User is banned from chat' });
          return;
        }

        const muteExpired = user.isMuted && user.muteExpiresAt && user.muteExpiresAt <= now;
        if (muteExpired) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isMuted: false, muteExpiresAt: null }
          });
          user.isMuted = false;
        }
        if (user.isMuted) {
          socket.emit('error', { message: 'User is muted and cannot send messages' });
          return;
        }

        // Create message in database
        const message = await prisma.chatMessage.create({
          data: {
            loungeId,
            languageRoomId,
            userId: socket.userId,
            displayUsername: user.permanentUsername || user.preferredName || 'Anonymous',
            messageText: messageText?.trim() || '',
            messageType: ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM'].includes(messageType) ? messageType : 'TEXT',
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

        // Broadcast message to room
        io.to(languageRoomId).emit(SOCKET_EVENTS.SERVER.CHAT_MESSAGE, message);

        logger.info(`Message sent by ${socket.userId} in room ${languageRoomId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        emitSocketError(socket, SOCKET_ERROR_CODES.SEND_MESSAGE_FAILED, 'Failed to send message');
      }
    });

    // Typing indicator
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

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      
      if (socket.data.currentRoom) {
        socket.to(socket.data.currentRoom).emit('user_left', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      });
    });
  });

  return io;
}

module.exports = {
  initializeSocketIO
};
