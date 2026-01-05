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
        // Verify room exists
        const room = await prisma.languageRoom.findUnique({
          where: { id: languageRoomId }
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(languageRoomId);
        socket.currentRoom = languageRoomId;
        socket.currentLounge = loungeId;

        logger.info(`User ${socket.userId} joined room ${languageRoomId}`);
        
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
      socket.leave(languageRoomId);
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

        if (!socket.currentRoom || socket.currentRoom !== languageRoomId) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: {
            id: true,
            permanentUsername: true,
            avatarUrl: true
          }
        });

        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Create message in database
        const message = await prisma.chatMessage.create({
          data: {
            loungeId,
            languageRoomId,
            userId: socket.userId,
            displayUsername: user.permanentUsername || 'Anonymous',
            messageText,
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
        io.to(languageRoomId).emit('chat_message', message);

        logger.info(`Message sent by ${socket.userId} in room ${languageRoomId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', ({ languageRoomId }) => {
      socket.to(languageRoomId).emit('user_typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ languageRoomId }) => {
      socket.to(languageRoomId).emit('user_typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user_left', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  return io;
}

module.exports = { initializeSocketIO };
