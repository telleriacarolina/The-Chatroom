import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendSms } from '@/lib/twilio';
import { encryptPhone } from '@/lib/crypto';
import { getRequestKey, runRateLimit } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phoneNumber, firstName, lastName, birthYear } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });

  try {
    runRateLimit(getRequestKey(req));
  } catch (e) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const encryptedPhone = encryptPhone(phoneNumber);
  const existing = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const defaultPassword = `${(firstName||'User').slice(0,3)}${birthYear||'2000'}${(lastName||'').slice(0,3)}!`;
  const passwordHash = bcrypt.hashSync(defaultPassword, 12);
  const encryptedPhone = encryptPhone(phoneNumber);

  const user = await prisma.user.create({ data: {
    phoneNumber: encryptedPhone,
    passwordHash,
    permanentUsername: encryptedPhone,
    accountType: 'REGISTERED'
  }});

  // send SMS with Twilio
  try {
    await sendSms(phoneNumber, `Your default password: ${defaultPassword}`);
  } catch (e) {
    console.warn('SMS send failed', e);
  }

  res.json({ message: 'Default password sent via SMS', userId: user.id });
}
