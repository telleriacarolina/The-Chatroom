require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const { runMaintenanceJobsIfDue, startBackgroundJobs } = require('./services/backgroundJobs');
const { initializeSocketIO } = require('./services/socketio');
const authRoutes = require('./routes/auth');
const chatroomRoutes = require('./routes/chatroom');
const loungeRoutes = require('./routes/lounges');
const moderationRoutes = require('./routes/moderation');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
const io = initializeSocketIO(server);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (!req.path.startsWith('/socket.io')) {
    runMaintenanceJobsIfDue({ source: 'request' }).catch((error) => {
      logger.error('Request-triggered maintenance failed', error);
    });
  }
  next();
});

// Serve static files for simple chatroom demo
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatroom', chatroomRoutes);
app.use('/api/lounges', loungeRoutes);
app.use('/api/moderation', moderationRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.post('/api/internal/maintenance', async (req, res) => {
  const cronHeader = req.headers['x-vercel-cron'];
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronSecret = process.env.CRON_SECRET || '';
  const providedSecret = req.headers['x-cron-secret'];
  const isCronInvocation = typeof cronHeader === 'string' && cronHeader.length > 0;
  const hasValidSecret = cronSecret.length > 0 && (providedSecret === cronSecret || bearerToken === cronSecret);

  if (!isCronInvocation && !hasValidSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runMaintenanceJobsIfDue({ force: true, source: 'cron' });
    return res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Cron maintenance run failed', error);
    return res.status(500).json({ error: 'Maintenance failed' });
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
  startBackgroundJobs();
});

module.exports = { app, server, io };
