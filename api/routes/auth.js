// Authentication routes
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../utils/logger');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

router.post('/csrf', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, { maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
});

router.post('/guest', async (req, res) => {
  try {
    const temporaryUsername = `guest_${Math.random().toString(36).slice(2, 8)}`;
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const guestId = crypto.randomBytes(8).toString('hex');

    const accessToken = signAccessToken({
      userId: guestId,
      sessionType: 'guest',
      allowedLoungeIds: ['1', '2', '3'],
      permissions: ['chat:connect', 'chat:join', 'chat:message']
    });

    res.json({
      tempSessionToken: sessionToken,
      accessToken,
      guestId,
      username: temporaryUsername,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
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

    // TODO: Replace with real account verification and permission resolution.
    const userId = crypto.randomBytes(8).toString('hex');
    const accessToken = signAccessToken({
      userId,
      sessionType: 'user',
      permissions: ['chat:connect', 'chat:join', 'chat:message']
    });

    res.json({
      ok: true,
      message: 'Authentication not yet implemented',
      accessToken,
      userId
    });
  } catch (e) {
    logger.error('Error signing in:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { phoneNumber } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // TODO: Replace with real account creation and permission resolution.
    const userId = crypto.randomBytes(8).toString('hex');
    const accessToken = signAccessToken({
      userId,
      sessionType: 'user',
      permissions: ['chat:connect', 'chat:join', 'chat:message']
    });

    res.json({
      ok: true,
      message: 'Signup not yet implemented',
      userId,
      accessToken
    });
  } catch (e) {
    logger.error('Error signing up:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
