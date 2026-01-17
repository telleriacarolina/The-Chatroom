const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger');

// Store interval references for cleanup
const intervals = [];

/** Transition users from Online -> Away after 5 minutes inactivity */
async function transitionInactiveUsers() {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: { isOnline: true, lastSeenAt: { lt: fiveMinAgo } },
      data: { isOnline: false }
    });
    if (result.count > 0) logger.info(`Transitioned ${result.count} users to AWAY`);
  } catch (e) {
    logger.error('Error transitioning inactive users', e);
  }
}

/** Clean up expired sessions and temp sessions */
async function cleanupExpiredSessions() {
  try {
    const refresh = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const temp = await prisma.tempSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    logger.info(`Cleaned ${refresh.count} sessions and ${temp.count} temp sessions`);
  } catch (e) {
    logger.error('Error cleaning expired sessions', e);
  }
}

/** Auto-unban users with expired temporary bans */
async function processExpiredBans() {
  try {
    const now = new Date();
    const result = await prisma.user.updateMany({
      where: {
        isBanned: true,
        banExpiresAt: { not: null, lt: now }
      },
      data: {
        isBanned: false,
        banExpiresAt: null,
        accountStatus: 'ACTIVE',
        banReason: null
      }
    });

    if (result.count > 0) {
      logger.info(`Auto-unbanned ${result.count} users with expired bans`);
      
      // Deactivate corresponding moderation actions
      await prisma.moderationAction.updateMany({
        where: {
          actionType: { in: ['BAN_TEMP'] },
          isActive: true,
          expiresAt: { not: null, lt: now }
        },
        data: { isActive: false }
      });
    }
  } catch (e) {
    logger.error('Error processing expired bans', e);
  }
}

/** Auto-unmute users with expired mutes */
async function processExpiredMutes() {
  try {
    const now = new Date();
    const result = await prisma.user.updateMany({
      where: {
        isMuted: true,
        muteExpiresAt: { not: null, lt: now }
      },
      data: {
        isMuted: false,
        muteExpiresAt: null
      }
    });

    if (result.count > 0) {
      logger.info(`Auto-unmuted ${result.count} users with expired mutes`);
      
      // Deactivate corresponding moderation actions
      await prisma.moderationAction.updateMany({
        where: {
          actionType: 'MUTE',
          isActive: true,
          expiresAt: { not: null, lt: now }
        },
        data: { isActive: false }
      });
    }
  } catch (e) {
    logger.error('Error processing expired mutes', e);
  }
}

/** Transition users to OFFLINE if no heartbeat in 10 minutes */
async function transitionOfflineUsers() {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: { lastSeenAt: { lt: tenMinAgo } },
      data: { isOnline: false }
    });
    if (result.count > 0) logger.info(`Transitioned ${result.count} users to OFFLINE`);
  } catch (e) {
    logger.error('Error transitioning offline users', e);
  }
}

function startBackgroundJobs() {
  logger.info('Starting background jobs...');
  
  // Create intervals and store references
  intervals.push(setInterval(transitionInactiveUsers, 60 * 1000));
  intervals.push(setInterval(cleanupExpiredSessions, 15 * 60 * 1000));
  intervals.push(setInterval(transitionOfflineUsers, 5 * 60 * 1000));
  intervals.push(setInterval(processExpiredBans, 2 * 60 * 1000)); // Check every 2 minutes
  intervals.push(setInterval(processExpiredMutes, 2 * 60 * 1000)); // Check every 2 minutes
  
  // Unref intervals to allow graceful shutdown
  intervals.forEach(interval => interval.unref());
  
  // run once on startup
  transitionInactiveUsers();
  cleanupExpiredSessions();
  transitionOfflineUsers();
  processExpiredBans();
  processExpiredMutes();
  
  logger.info('Background jobs started');
}

function stopBackgroundJobs() {
  logger.info('Stopping background jobs...');
  intervals.forEach(interval => clearInterval(interval));
  intervals.splice(0, intervals.length); // Clear all elements from array
  logger.info('Background jobs stopped');
}

module.exports = { startBackgroundJobs, stopBackgroundJobs };
