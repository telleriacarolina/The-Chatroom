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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Initialize Socket.io
const io = initializeSocketIO(server);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files for simple chatroom demo
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lounges', loungeRoutes);
// Message-related endpoints (including Message History API).
// Detailed endpoint specification, usage examples, error codes,
// and performance notes are documented in docs/MESSAGE_HISTORY_API.md.
app.use('/api/messages', messagesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
  startBackgroundJobs();
});

module.exports = { app, server, io };
