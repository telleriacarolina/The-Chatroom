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

function signAccess(payload, options = {}) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m', ...options });
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

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
