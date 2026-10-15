const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { prisma } = require('../lib/prisma');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function normalizeAgeCategory(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (normalized === 'PLUS_18' || normalized === '_18PLUS' || normalized === '18+') return 'PLUS_18';
  if (normalized === 'PLUS_18_RED' || normalized === '_18PLUS_RED' || normalized === '18+RED') return 'PLUS_18_RED';
  return null;
}

function getAccessRequirements(accessLevel) {
  switch (accessLevel) {
    case 'MAIN_LOUNGE':
      return { ageVerified: true };
    case 'RED_LOUNGE':
      return { ageVerified: true, idVerified: true };
    default:
      return {};
  }
}

async function loadUserForAccess(userId) {
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accountStatus: true,
      isBanned: true,
      isMuted: true,
      ageVerified: true,
      idVerified: true,
      role: true,
      permanentUsername: true
    }
  });
}

function validateUserAccess(user, { accessLevel = null } = {}) {
  if (!user) {
    return { ok: false, status: 404, message: 'User not found' };
  }

  if (user.accountStatus !== 'ACTIVE') {
    return { ok: false, status: 403, message: 'Account is not active' };
  }

  if (user.isBanned) {
    return { ok: false, status: 403, message: 'Account is banned' };
  }

  if (accessLevel) {
    const requirements = getAccessRequirements(accessLevel);
    if (requirements.ageVerified && !user.ageVerified) {
      return { ok: false, status: 403, message: 'Age verification is required for this room' };
    }

    if (requirements.idVerified && !user.idVerified) {
      return { ok: false, status: 403, message: 'ID verification is required for this room' };
    }
  }

  return { ok: true, user };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await loadUserForAccess(payload.userId);
    const accessCheck = validateUserAccess(user);
    if (!accessCheck.ok) {
      return res.status(accessCheck.status).json({ error: accessCheck.message });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return next(new Error('Invalid or expired token'));
    }

    const user = await loadUserForAccess(payload.userId);
    const accessCheck = validateUserAccess(user);
    if (!accessCheck.ok) {
      return next(new Error(accessCheck.message));
    }

    socket.userId = user.id;
    socket.user = user;
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
  normalizeAgeCategory,
  getAccessRequirements,
  loadUserForAccess,
  validateUserAccess
};
