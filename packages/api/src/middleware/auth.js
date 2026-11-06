const logger = require('../utils/logger');
const { prisma } = require('../lib/prisma');
const jwtLib = require('../lib/jwt');
const crypto = require('crypto');

function verifyAccessToken(token) {
  try {
    return jwtLib.verifyAccess(token);
  } catch (error) {
    return null;
  }
}

async function findActiveSession(sessionToken, userId) {
  if (!sessionToken || !userId) return null;
  const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  if (!sessionTokenHash) return null;

  return prisma.session.findFirst({
    where: {
      sessionToken: sessionTokenHash,
      userId,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    select: { id: true, userId: true }
  });
}

// Middleware for Express routes
async function authenticateRequest(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken || !refreshToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(accessToken);

    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const session = await findActiveSession(refreshToken, payload.userId);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function parseCookies(cookieHeader = '') {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, cookiePair) => {
    const [rawName, ...rawValue] = cookiePair.trim().split('=');
    if (!rawName || rawValue.length === 0) return acc;

    try {
      acc[rawName] = decodeURIComponent(rawValue.join('='));
    } catch (error) {
      acc[rawName] = rawValue.join('=');
    }
    return acc;
  }, {});
}

// Middleware for Socket.io connections
async function authenticateSocket(socket, next) {
  try {
    const cookies = parseCookies(socket.handshake.headers?.cookie);
    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    if (!accessToken || !refreshToken) {
      return next(new Error('Authentication cookies required'));
    }

    const payload = verifyAccessToken(accessToken);

    if (!payload || !payload.userId) {
      return next(new Error('Invalid or expired token'));
    }

    const session = await findActiveSession(refreshToken, payload.userId);

    if (!session) {
      return next(new Error('Invalid or expired session'));
    }

    socket.userId = payload.userId;
    socket.sessionId = session.id;
    socket.refreshToken = refreshToken;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  authenticateRequest,
  authenticateSocket,
  verifyAccessToken,
  findActiveSession
};
