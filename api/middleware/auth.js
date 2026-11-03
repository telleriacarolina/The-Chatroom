const logger = require('../utils/logger');
const { verifyAccess } = require('../utils/jwt');

function verifyAccessToken(token) {
  try {
    return verifyAccess(token);
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

module.exports = authenticateRequest;
