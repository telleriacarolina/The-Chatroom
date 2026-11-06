const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { signAccess, signRefresh, verifyRefresh } = require('../lib/jwt');
const { prisma } = require('../lib/prisma');
const { encryptPhone } = require('../lib/crypto');
const { generateCSRFToken } = require('../utils/security');
const { authLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrf');

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_ENCRYPTION_SECRET = process.env.COOKIE_ENCRYPTION_SECRET || process.env.ACCESS_TOKEN_SECRET || 'dev_cookie_encryption_secret';
const COOKIE_ENCRYPTION_KEY = crypto.createHash('sha256').update(String(COOKIE_ENCRYPTION_SECRET)).digest();

function hashSessionToken(sessionToken) {
  return crypto.createHash('sha256').update(sessionToken).digest('hex');
}

function encryptCookieValue(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptCookieValue(value) {
  const payload = Buffer.from(String(value), 'base64');
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function getCookieOptions(opts = {}) {
  const sameSite = isProduction ? 'none' : 'lax';
  const secure = isProduction;
  return {
    path: '/',
    maxAge: opts.maxAge || 0,
    sameSite,
    secure,
    ...('httpOnly' in opts ? { httpOnly: !!opts.httpOnly } : {}),
  };
}

function setCookie(res, name, value, opts = {}) {
  const sensitiveCookies = new Set(['accessToken', 'refreshToken']);
  const cookieValue = sensitiveCookies.has(name) ? encryptCookieValue(value) : value;
  res.cookie(name, cookieValue, getCookieOptions(opts));
}

function clearCookie(res, name, opts = {}) {
  res.clearCookie(name, getCookieOptions(opts));
}

router.post('/csrf', (req, res) => {
  const token = generateCSRFToken();
  // double-submit: set cookie and return token
  setCookie(res, 'csrfToken', token, { maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
});

router.use((req, res, next) => {
  if (req.path === '/csrf') return next();
  return csrfProtection(req, res, next);
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
    const refreshTokenHash = hashSessionToken(refreshToken);

    await prisma.session.create({ data: {
      userId: user.id,
      sessionToken: refreshTokenHash,
      refreshToken: refreshTokenHash, // Store in both fields for compatibility
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
      ageCategory: ageCategory === '18+RED' ? 'PLUS_18_RED' : 'PLUS_18',
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
    const refreshTokenHash = hashSessionToken(refresh);
    const payload = verifyRefresh(refresh);
    const userId = payload.userId;
    const session = await prisma.session.findUnique({ where: { sessionToken: refreshTokenHash } });
    if (!session || !session.isActive || session.userId !== userId || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const accessToken = signAccess({ userId });
    setCookie(res, 'accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    if (refresh) {
      const refreshTokenHash = hashSessionToken(refresh);
      await prisma.session.updateMany({ where: { sessionToken: refreshTokenHash }, data: { isActive: false } }).catch(() => {});
    }
    clearCookie(res, 'accessToken', { httpOnly: true });
    clearCookie(res, 'refreshToken', { httpOnly: true });
    clearCookie(res, 'csrfToken');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Request password reset - generates a token and stores it in database
 * In production, this would send the token via SMS
 */
router.post('/request-password-reset', authLimiter, async (req, res) => {
  const { phoneNumber } = req.body || {};
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });
  
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    
    // Return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.json({ 
        message: 'If this phone number is registered, a reset token will be sent via SMS',
        ok: true 
      });
    }

    // Generate secure reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Clean up any existing reset tokens for this phone
    await prisma.passwordReset.deleteMany({ 
      where: { phone: encryptedPhone }
    }).catch(() => {});

    // Store the reset token
    await prisma.passwordReset.create({
      data: {
        phone: encryptedPhone,
        token: resetToken,
        expiresAt
      }
    });

    // TODO: In production, send resetToken via SMS using Twilio
    // For now, return it in development mode only
    const response = { 
      message: 'If this phone number is registered, a reset token will be sent via SMS',
      ok: true 
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.resetToken = resetToken; // Only for testing
    }

    res.json(response);
  } catch (e) {
    console.error('Password reset request error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Reset password using the token
 */
router.post('/reset-password', authLimiter, async (req, res) => {
  const { phoneNumber, token, newPassword } = req.body || {};
  
  if (!phoneNumber || !token || !newPassword) {
    return res.status(400).json({ error: 'phoneNumber, token, and newPassword required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    
    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        phone: encryptedPhone,
        token: token,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetRecord) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { phoneNumber: encryptedPhone } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate all sessions
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    }).catch(() => {});

    // Delete the used reset token
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id }
    }).catch(() => {});

    res.json({ 
      ok: true, 
      message: 'Password reset successfully. Please sign in with your new password.' 
    });
  } catch (e) {
    console.error('Password reset error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
