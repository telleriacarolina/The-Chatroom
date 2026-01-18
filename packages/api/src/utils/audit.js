const { prisma } = require('../lib/prisma');
const logger = require('./logger');

/**
 * Create an immutable audit log entry
 * Audit logs cannot be deleted or modified to maintain integrity
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - ID of user performing the action (optional)
 * @param {string} params.eventType - Type of event (e.g., 'MODERATION_ACTION', 'USER_REPORT')
 * @param {Object} params.eventDetails - Additional details about the event (will be stored as JSON)
 * @param {string} params.ipAddress - IP address of the user (optional)
 * @param {string} params.userAgent - User agent string (optional)
 * @returns {Promise<Object>} Created audit log entry
 */
async function createAuditLog({ userId, eventType, eventDetails, ipAddress, userAgent }) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        eventType,
        eventDetails: eventDetails || {},
        ipAddress,
        userAgent
      }
    });

    logger.info(`Audit log created: ${eventType} by user ${userId || 'system'}`);
    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit log failure shouldn't break the main operation
    return null;
  }
}

/**
 * Extract IP address from Express request
 * Handles proxied requests (X-Forwarded-For header)
 * 
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Get user agent from request
 * 
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Middleware to automatically create audit logs for moderation actions
 * Attaches audit logging helpers to the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function auditMiddleware(req, res, next) {
  req.auditLog = {
    create: (eventType, eventDetails) => createAuditLog({
      userId: req.userId,
      eventType,
      eventDetails,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    })
  };
  next();
}

module.exports = {
  createAuditLog,
  getIpAddress,
  getUserAgent,
  auditMiddleware
};
