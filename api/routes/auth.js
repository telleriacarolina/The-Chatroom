// Authentication routes
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../utils/logger');

const configuredSecret = process.env.ACCESS_TOKEN_SECRET;
const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const GUEST_ACCESS_TOKEN_TTL = '24h';

if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret === 'dev_access_secret')) {
  throw new Error('ACCESS_TOKEN_SECRET must be set in production');
}
const ACCESS_SECRET = configuredSecret || 'dev_access_secret';

router.post('/csrf', (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, { maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
});

router.post('/guest', async (req, res) => {
  try {
    const { ageCategory } = req.body || {};
    const temporaryUsername = `guest_${Math.random().toString(36).slice(2, 8)}`;
    const guestId = require('crypto').randomBytes(8).toString('hex');
    const tempSessionToken = require('uuid').v4();
    const accessToken = jwt.sign({ userId: guestId, guestId, username: temporaryUsername }, ACCESS_SECRET, {
      expiresIn: GUEST_ACCESS_TOKEN_TTL
    });

    res.json({
      accessToken,
      tempSessionToken,
      guestId,
      username: temporaryUsername,
      expiresAt: new Date(Date.now() + GUEST_SESSION_TTL_MS)
    });
  } catch (e) {
    logger.error('Error creating guest session:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body || {};
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    // TODO: Implement actual authentication
    res.json({ ok: true, message: 'Authentication not yet implemented' });
  } catch (e) {
    logger.error('Error signing in:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, birthYear } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    // TODO: Implement actual signup
    res.json({ ok: true, message: 'Signup not yet implemented', userId: require('crypto').randomBytes(8).toString('hex') });
  } catch (e) {
    logger.error('Error signing up:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
