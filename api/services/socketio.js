// Socket.IO initialization
const { Server } = require('socket.io');
const logger = require('../utils/logger');

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { userId: socket.id });
      logger.debug(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { userId: socket.id });
      logger.debug(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('chat-message', (data) => {
      const { roomId, content } = data;
      io.to(roomId).emit('chat-message', {
        userId: socket.id,
        content,
        timestamp: new Date().toISOString()
      });
      logger.debug(`Message in room ${roomId}: ${content}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initializeSocketIO };
