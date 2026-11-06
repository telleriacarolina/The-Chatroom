const jwt = require('jsonwebtoken');

const configuredAccessSecret = process.env.ACCESS_TOKEN_SECRET;
const configuredRefreshSecret = process.env.REFRESH_TOKEN_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!configuredAccessSecret || configuredAccessSecret === 'dev_access_secret' || !configuredRefreshSecret || configuredRefreshSecret === 'dev_refresh_secret') {
    throw new Error('JWT secrets must be provided in production environment');
  }
}

const ACCESS_SECRET = configuredAccessSecret || (process.env.NODE_ENV === 'production' ? undefined : 'dev_access_secret');
const REFRESH_SECRET = configuredRefreshSecret || (process.env.NODE_ENV === 'production' ? undefined : 'dev_refresh_secret');

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets must be configured');
}

const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function signAccess(payload, options = {}) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m', ...options });
}

function signGuestAccess(payload, options = {}) {
  const ttlMs = Number(options.ttlMs ?? GUEST_SESSION_TTL_MS);
  const expiresInSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
  const { ttlMs: _ttlMs, ...jwtOptions } = options;
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: expiresInSeconds, ...jwtOptions });
}

function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signAccess, signGuestAccess, signRefresh, verifyAccess, verifyRefresh, GUEST_SESSION_TTL_MS };
