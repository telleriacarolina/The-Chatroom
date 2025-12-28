import { prisma } from '@/lib/prisma';

/**
 * Process user heartbeat
 */
export async function processHeartbeat(userId, stayOnline = false) {
  const now = new Date();
  const update = await prisma.user.updateMany({
    where: { id: userId },
    data: {
      lastSeenAt: now,
      isOnline: true,
      stayOnline: stayOnline,
      stayOnlineUntil: stayOnline ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
    }
  });

  if (update.count === 0) throw new Error('User not found');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return { id: user.id, onlineStatus: user.isOnline ? 'ONLINE' : 'OFFLINE', lastActivity: user.lastSeenAt };
}

export async function getUserPresence(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return { id: user.id, onlineStatus: user.isOnline ? (user.stayOnline ? 'ONLINE' : 'AWAY') : 'OFFLINE', lastActivity: user.lastSeenAt };
}
