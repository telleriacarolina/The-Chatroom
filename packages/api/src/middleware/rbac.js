const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user has the required role
 * 
 * @param {string[]} allowedRoles - Array of roles that can access the endpoint (e.g., ['MODERATOR', 'ADMIN'])
 * @returns {Function} Express middleware function
 */
function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Fetch user with role
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, role: true, accountStatus: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if user account is active
      if (user.accountStatus !== 'ACTIVE') {
        return res.status(403).json({ error: 'Account is not active' });
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        logger.warn(`Access denied for user ${user.id} with role ${user.role}. Required: ${allowedRoles.join(', ')}`);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles 
        });
      }

      // Attach user role to request for further use
      req.userRole = user.role;
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

module.exports = { requireRole };
