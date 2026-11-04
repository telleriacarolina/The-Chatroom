// Authentication routes
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { validatePayload, userSchema, sanitizeLogData } = require('../../shared/schemas');

router.post('/csrf', (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
  res.json({ csrfToken: token });
});

router.post('/guest', async (req, res) => {
  try {
    const result = validatePayload(req.body || {}, userSchema.guest);
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid guest payload', details: result.errors });
    }
    const { ageCategory } = result.value;
    const temporaryUsername = `guest_${Math.random().toString(36).slice(2, 8)}`;
    const sessionToken = require('crypto').randomBytes(32).toString('hex');

    res.json({
      tempSessionToken: sessionToken,
      guestId: require('crypto').randomBytes(8).toString('hex'),
      username: temporaryUsername,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  } catch (e) {
    logger.error('Error creating guest session:', sanitizeLogData(e));
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const result = validatePayload(req.body || {}, userSchema.signin);
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid sign-in payload', details: result.errors });
    }
    const { phoneNumber } = result.value;
    // TODO: Implement actual authentication
    res.json({ ok: true, message: 'Authentication not yet implemented', phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
  } catch (e) {
    logger.error('Error signing in:', sanitizeLogData(e));
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const result = validatePayload(req.body || {}, userSchema.signup);
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid sign-up payload', details: result.errors });
    }
    const { phoneNumber } = result.value;
    // TODO: Implement actual signup
    res.json({ ok: true, message: 'Signup not yet implemented', userId: require('crypto').randomBytes(8).toString('hex'), phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
  } catch (e) {
    logger.error('Error signing up:', sanitizeLogData(e));
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
