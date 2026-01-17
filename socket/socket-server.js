require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logger = require('./lib/logger');
const { initChat } = require('./initChat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, '../../public')));

// Initialize chat handlers with presence tracking and message management
initChat(io);

const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Socket.IO server running on http://localhost:${PORT}`);
});

module.exports = server;
