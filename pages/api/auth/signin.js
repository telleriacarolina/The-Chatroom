import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signAccess, signRefresh } from '@/lib/jwt';
import { serialize } from 'cookie';
import { encryptPhone } from '@/lib/crypto';
import { getRequestKey, runRateLimit } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phoneNumber, password, staySignedIn } = req.body;
  if (!phoneNumber || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    runRateLimit(getRequestKey(req));
  } catch (e) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const encryptedPhone = encryptPhone(phoneNumber);
  const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = signAccess({ userId: user.id });
  const refreshToken = signRefresh({ userId: user.id });

  // create session
  await prisma.session.create({ data: {
    userId: user.id,
    sessionToken: refreshToken,
    expiresAt: new Date(Date.now() + (staySignedIn ? 30*24*60*60*1000 : 24*60*60*1000))
  }});

  res.setHeader('Set-Cookie', [
    serialize('accessToken', accessToken, { httpOnly: true, path: '/', maxAge: 60*15 }),
    serialize('refreshToken', refreshToken, { httpOnly: true, path: '/', maxAge: 60*60*24*30 })
  ]);

  res.json({ accessToken, refreshToken, user: { id: user.id, phoneNumber: user.phoneNumber, permanentUsername: user.permanentUsername, idVerified: user.idVerified } });
}
