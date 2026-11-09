const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger');

const JOB_MIN_INTERVAL_MS = Number.parseInt(process.env.MAINTENANCE_JOB_INTERVAL_MS || '60000', 10);
let lastRunStartedAt = 0;
let isRunning = false;

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

async function runMaintenanceJobs({ source = 'manual' } = {}) {
  await transitionInactiveUsers();
  await cleanupExpiredSessions();
  await transitionOfflineUsers();
  await processExpiredBans();
  await processExpiredMutes();
  logger.info(`Maintenance jobs completed (source=${source})`);
}

async function runMaintenanceJobsIfDue({ force = false, source = 'request' } = {}) {
  const now = Date.now();

  if (!force && now - lastRunStartedAt < JOB_MIN_INTERVAL_MS) {
    return { ran: false, reason: 'interval_not_elapsed' };
  }
  if (isRunning) {
    return { ran: false, reason: 'already_running' };
  }

  isRunning = true;
  lastRunStartedAt = now;

  try {
    await runMaintenanceJobs({ source });
    return { ran: true };
  } finally {
    isRunning = false;
  }
}

function startBackgroundJobs() {
  logger.info('Background jobs are request/cron-triggered; no process-level intervals are started.');
  runMaintenanceJobsIfDue({ force: true, source: 'startup' }).catch((error) => {
    logger.error('Startup maintenance run failed', error);
  });
}

function stopBackgroundJobs() {
  logger.info('No process-level background intervals to stop.');
}

module.exports = {
  startBackgroundJobs,
  stopBackgroundJobs,
  runMaintenanceJobsIfDue,
  runMaintenanceJobs
};
