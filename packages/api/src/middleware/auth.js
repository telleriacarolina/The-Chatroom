const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware for Express routes
function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Middleware for Socket.io connections
function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return next(new Error('Invalid or expired token'));
    }

    socket.userId = payload.userId;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  authenticateRequest,
  authenticateSocket,
  verifyAccessToken
};
