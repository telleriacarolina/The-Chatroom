const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger');

if (process.env.NODE_ENV === 'production' && (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET === 'dev_access_secret')) {
  throw new Error('ACCESS_TOKEN_SECRET must be set in production');
}
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
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake?.auth?.token;
    const authHeader = socket.handshake?.headers?.authorization;
    const headerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    const resolvedToken = token || headerToken;

    if (!resolvedToken) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyAccessToken(resolvedToken);
    if (payload && payload.userId) {
      socket.userId = payload.userId;
      return next();
    }

    const guestTempSession = await prisma.tempSession.findUnique({
      where: { sessionToken: resolvedToken },
      select: { id: true, temporaryUsername: true, userId: true, expiresAt: true }
    });
    if (guestTempSession) {
      const expired = guestTempSession.expiresAt && new Date(guestTempSession.expiresAt).getTime() <= Date.now();
      if (expired) {
        return next(new Error('Guest session expired'));
      }
      socket.userId = guestTempSession.userId || guestTempSession.id;
      socket.tempSessionId = guestTempSession.id;
      socket.tempSessionUsername = guestTempSession.temporaryUsername;
      return next();
    }

    return next(new Error('Invalid or expired token'));
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
