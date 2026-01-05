import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

// Store interval references for cleanup
const intervals = [];

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
  
  // Create intervals and store references
  intervals.push(setInterval(transitionInactiveUsers, 60 * 1000));
  intervals.push(setInterval(cleanupExpiredSessions, 15 * 60 * 1000));
  intervals.push(setInterval(transitionOfflineUsers, 5 * 60 * 1000));
  
  // Unref intervals to allow graceful shutdown
  intervals.forEach(interval => interval.unref());
  
  // run once on startup
  transitionInactiveUsers();
  cleanupExpiredSessions();
  transitionOfflineUsers();
  
  logger.info('Background jobs started');
}

export function stopBackgroundJobs() {
  logger.info('Stopping background jobs...');
  intervals.forEach(interval => clearInterval(interval));
  intervals.splice(0, intervals.length); // Clear all elements from array
  logger.info('Background jobs stopped');
}

export default { startBackgroundJobs, stopBackgroundJobs };
