const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

if (process.env.NODE_ENV === 'production' && (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET === 'dev_access_secret')) {
  throw new Error('ACCESS_TOKEN_SECRET must be set in production');
}
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev_access_secret');
const JWT_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

if (!ACCESS_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET must be configured');
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

function isJwtLikeToken(value) {
  return typeof value === 'string' && JWT_TOKEN_PATTERN.test(value);
}

async function validateGuestSessionForIdentity(userId, tempSessionId) {
  if (!userId || !tempSessionId) return null;

  const tempSession = await prisma.tempSession.findUnique({
    where: { id: tempSessionId },
    select: { id: true, userId: true, expiresAt: true, sessionToken: true, temporaryUsername: true }
  });

  if (!tempSession || !tempSession.userId) {
    return null;
  }

  if (tempSession.userId !== userId) {
    return null;
  }

  if (tempSession.expiresAt && new Date(tempSession.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return tempSession;
}

async function validateTempSessionCredential(token) {
  if (!token || typeof token !== 'string') return null;

  const tempSession = await prisma.tempSession.findUnique({
    where: { sessionToken: token },
    select: { id: true, temporaryUsername: true, userId: true, expiresAt: true, sessionToken: true }
  });

  if (!tempSession || !tempSession.userId) return null;
  if (tempSession.expiresAt && new Date(tempSession.expiresAt).getTime() <= Date.now()) return null;

  return tempSession;
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
      const tempSessionId = payload.tempSessionId || null;
      const validatedGuestSession = tempSessionId ? await validateGuestSessionForIdentity(payload.userId, tempSessionId) : null;

      if (payload.guest === true || payload.guestId || tempSessionId) {
        if (!validatedGuestSession) {
          return next(new Error('Guest session invalid or expired'));
        }
      }

      socket.userId = payload.userId;
      socket.tempSessionId = validatedGuestSession?.id ?? null;
      socket.tempSessionUsername = validatedGuestSession?.temporaryUsername ?? null;
      return next();
    }

    if (isJwtLikeToken(resolvedToken)) {
      return next(new Error('Invalid or expired token'));
    }

    const guestTempSession = await validateTempSessionCredential(resolvedToken);
    if (!guestTempSession) {
      return next(new Error('Invalid or expired token'));
    }

    socket.userId = guestTempSession.userId;
    socket.tempSessionId = guestTempSession.id;
    socket.tempSessionUsername = guestTempSession.temporaryUsername;
    return next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  authenticateRequest,
  authenticateSocket,
  verifyAccessToken,
  validateGuestSessionForIdentity,
  validateTempSessionCredential
};
