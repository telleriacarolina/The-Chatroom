require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { startBackgroundJobs } = require('./services/backgroundJobs');
const { initializeSocketIO } = require('./services/socketio');
const authRoutes = require('./routes/auth');
const loungeRoutes = require('./routes/lounges');
const messagesRoutes = require('./routes/messages');
const logger = require('./utils/logger');
const { version: apiVersion } = require('../package.json');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const releaseId = process.env.APP_RELEASE_ID
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.RENDER_GIT_COMMIT
  || apiVersion;

// Initialize Socket.io
const io = initializeSocketIO(server);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['x-chatroom-api-version', 'x-chatroom-release-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('x-chatroom-api-version', apiVersion);
  res.setHeader('x-chatroom-release-id', releaseId);
  next();
});

// Serve static files for simple chatroom demo
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lounges', loungeRoutes);
// Message-related endpoints (including Message History API).
// Detailed endpoint specification, usage examples, error codes,
// and performance notes are documented in docs/MESSAGE_HISTORY_API.md.
app.use('/api/messages', messagesRoutes);

app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: apiVersion,
    releaseId,
  })
);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
  startBackgroundJobs();
});

module.exports = { app, server, io };
