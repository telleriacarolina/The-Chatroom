// Authentication routes
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const logger = require('../utils/logger');
const { signAccess } = require('../utils/jwt');

const GUEST_ALLOWED_LOUNGES = ['1', '2', '3'];

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
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const jwtId = crypto.randomBytes(16).toString('hex');

    const accessToken = signAccess({
      userId: guestId,
      sessionType: 'guest',
      allowedLoungeIds: GUEST_ALLOWED_LOUNGES,
      jti: jwtId,
      permissions: ['chat:connect', 'chat:join', 'chat:message']
    }, {
      expiresIn: '60m'
    });

    res.json({
      tempSessionToken: sessionToken,
      accessToken,
      guestId,
      username: temporaryUsername,
      expiresAt: sessionExpiresAt
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
    const accessToken = signAccess({
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
    const accessToken = signAccess({
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
