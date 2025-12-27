import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encryptPhone } from '@/lib/crypto';
import { getRequestKey, runRateLimit } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phoneNumber, currentPassword, newPassword } = req.body || {};
  if (!phoneNumber || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  try {
    runRateLimit(getRequestKey(req));
  } catch (e) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });

    const ok = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    // Invalidate all sessions for this user
    await prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } }).catch(() => {});

    res.json({ ok: true, message: 'Password changed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}
