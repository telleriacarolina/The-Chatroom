const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { signAccess, signRefresh, verifyRefresh } = require('../lib/jwt');
const { prisma } = require('../lib/prisma');
const { encryptPhone } = require('../lib/crypto');
const { generateCSRFToken } = require('../utils/security');
const { authLimiter } = require('../middleware/rateLimiter');

function setCookie(res, name, value, opts = {}) {
  const options = { httpOnly: !!opts.httpOnly, path: '/', maxAge: opts.maxAge || 0 };
  if (!options.httpOnly) {
    res.cookie(name, value, { maxAge: options.maxAge });
  } else {
    res.cookie(name, value, { httpOnly: true, maxAge: options.maxAge });
  }
}

router.post('/csrf', (req, res) => {
  const token = generateCSRFToken();
  // double-submit: set cookie and return token
  res.cookie('csrfToken', token, { maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
});

router.post('/signup', authLimiter, async (req, res) => {
  const { phoneNumber, firstName, lastName, birthYear } = req.body || {};
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const existing = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const defaultPassword = `${(firstName||'User').slice(0,3)}${birthYear||'2000'}${(lastName||'').slice(0,3)}!`;
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const user = await prisma.user.create({ data: {
      phoneNumber: encryptedPhone,
      passwordHash,
      permanentUsername: encryptedPhone,
      accountType: 'REGISTERED'
    }});

    // Note: Twilio send handled elsewhere if configured
    res.json({ message: 'Default password sent via SMS', userId: user.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', authLimiter, async (req, res) => {
  const { phoneNumber, password, staySignedIn } = req.body || {};
  if (!phoneNumber || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccess({ userId: user.id });
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.session.create({ data: {
      userId: user.id,
      sessionToken: refreshToken,
      expiresAt: new Date(Date.now() + (staySignedIn ? 30*24*60*60*1000 : 24*60*60*1000))
    }});

    setCookie(res, 'accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    setCookie(res, 'refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ ok: true, user: { id: user.id, phoneNumber: user.phoneNumber } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/guest', async (req, res) => {
  const { ageCategory } = req.body || {};
  const temporaryUsername = `guest_${Math.random().toString(36).slice(2,8)}`;
  const token = require('uuid').v4();
  try {
    const temp = await prisma.tempSession.create({ data: {
      temporaryUsername,
      ageCategory: ageCategory === '18+RED' ? '_18PLUS_RED' : '_18PLUS',
      sessionToken: token,
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    }});
    res.json({ tempSessionToken: token, guestId: temp.id, expiresAt: temp.expiresAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/change-password', authLimiter, async (req, res) => {
  const { phoneNumber, currentPassword, newPassword } = req.body || {};
  if (!phoneNumber || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } }).catch(() => {});
    res.json({ ok: true, message: 'Password changed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    if (!refresh) return res.status(401).json({ error: 'No refresh token' });
    const payload = verifyRefresh(refresh);
    const userId = payload.userId;
    const session = await prisma.session.findUnique({ where: { sessionToken: refresh } });
    if (!session || !session.isActive) return res.status(401).json({ error: 'Invalid session' });
    const accessToken = signAccess({ userId });
    setCookie(res, 'accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json({ accessToken });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    if (refresh) await prisma.session.updateMany({ where: { sessionToken: refresh }, data: { isActive: false } }).catch(() => {});
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
