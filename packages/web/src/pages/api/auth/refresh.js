import { parse, serialize } from 'cookie';
import { verifyRefresh, signAccess } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const refresh = cookies.refreshToken;
  if (!refresh) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = verifyRefresh(refresh);
    // @ts-ignore
    const userId = payload.userId;
    const session = await prisma.session.findUnique({ where: { sessionToken: refresh } });
    if (!session || !session.isActive) return res.status(401).json({ error: 'Invalid session' });

    const accessToken = signAccess({ userId });
    res.setHeader('Set-Cookie', serialize('accessToken', accessToken, { httpOnly: true, path: '/', maxAge: 60*15 }));
    res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}
