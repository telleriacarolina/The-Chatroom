import { parse } from 'cookie';
import { verifyAccess } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.accessToken;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = verifyAccess(token);
    // @ts-ignore
    const userId = payload.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, phoneNumber: user.phoneNumber, permanentUsername: user.permanentUsername, idVerified: user.idVerified } });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
