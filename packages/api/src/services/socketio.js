const { Server } = require('socket.io');
const { prisma } = require('../lib/prisma');
const { authenticateSocket } = require('../middleware/auth');
const logger = require('../utils/logger');

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
    logger.info(`User connected: ${socket.userId}`);

    // Join a language room
    socket.on('join_room', async ({ loungeId, languageRoomId }) => {
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
        socket.to(languageRoomId).emit('user_joined', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
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
    socket.on('chat_message', async (data) => {
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

        if (socket.data.currentRoom !== languageRoomId || !socket.rooms.has(languageRoomId)) {
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

        // Get user info
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
        io.to(languageRoomId).emit('chat_message', message);

        logger.info(`Message sent by ${socket.userId} in room ${languageRoomId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
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
      }
    });
  });

  return io;
}

module.exports = { initializeSocketIO };
