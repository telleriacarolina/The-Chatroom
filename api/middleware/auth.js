const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

async function validateGuestSessionForIdentity(userId, tempSessionId) {
  if (!userId || !tempSessionId) return null;

  try {
    const tempSession = await prisma.tempSession.findUnique({
      where: { id: tempSessionId },
      select: { id: true, userId: true, expiresAt: true, temporaryUsername: true }
    });

    if (!tempSession || !tempSession.userId || tempSession.userId !== userId) {
      return null;
    }

    if (tempSession.expiresAt && new Date(tempSession.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return tempSession;
  } catch (error) {
    logger.error('Guest session validation failed:', error);
    return null;
  }
}

// Middleware for Express routes
async function authenticateRequest(req, res, next) {
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

    if (payload.guest === true || payload.guestId || payload.tempSessionId) {
      if (!payload.tempSessionId) {
        return res.status(401).json({ error: 'Invalid guest session' });
      }

      const validatedGuestSession = await validateGuestSessionForIdentity(payload.userId, payload.tempSessionId);
      if (!validatedGuestSession) {
        return res.status(401).json({ error: 'Invalid guest session' });
      }
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authenticateRequest;
module.exports.validateGuestSessionForIdentity = validateGuestSessionForIdentity;
