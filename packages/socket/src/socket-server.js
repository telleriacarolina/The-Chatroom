require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logger = require('./lib/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, '../../public')));

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('chat message', (msg) => {
    logger.debug(`Chat message: ${msg}`);
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Socket.IO server running on http://localhost:${PORT}`);
});

module.exports = server;
