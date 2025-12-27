import { parse, serialize } from 'cookie';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const refresh = cookies.refreshToken;
  if (refresh) {
    await prisma.session.updateMany({ where: { sessionToken: refresh }, data: { isActive: false } }).catch(() => {});
  }

  res.setHeader('Set-Cookie', [
    serialize('accessToken', '', { httpOnly: true, path: '/', maxAge: 0 }),
    serialize('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 })
  ]);
  res.json({ ok: true });
}
