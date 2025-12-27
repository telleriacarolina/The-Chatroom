import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ageCategory } = req.body;
  const temporaryUsername = `guest_${Math.random().toString(36).slice(2,8)}`;
  const token = uuidv4();

  const temp = await prisma.tempSession.create({ data: {
    temporaryUsername,
    ageCategory: ageCategory === '18+RED' ? '_18PLUS_RED' : '_18PLUS',
    sessionToken: token,
    expiresAt: new Date(Date.now() + 24*60*60*1000)
  }}).catch(e => { console.error(e); return null });

  res.json({ tempSessionToken: token, guestId: temp?.id, expiresAt: temp?.expiresAt });
}
