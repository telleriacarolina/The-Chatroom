import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

/** Transition users from Online -> Away after 5 minutes inactivity */
export async function transitionInactiveUsers() {
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
export async function cleanupExpiredSessions() {
  try {
    const refresh = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const temp = await prisma.tempSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    logger.info(`Cleaned ${refresh.count} sessions and ${temp.count} temp sessions`);
  } catch (e) {
    logger.error('Error cleaning expired sessions', e);
  }
}

/** Transition users to OFFLINE if no heartbeat in 10 minutes */
export async function transitionOfflineUsers() {
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

export function startBackgroundJobs() {
  logger.info('Starting background jobs...');
  setInterval(transitionInactiveUsers, 60 * 1000);
  setInterval(cleanupExpiredSessions, 15 * 60 * 1000);
  setInterval(transitionOfflineUsers, 5 * 60 * 1000);
  // run once
  transitionInactiveUsers();
  cleanupExpiredSessions();
  transitionOfflineUsers();
  logger.info('Background jobs started');
}

export default { startBackgroundJobs };
