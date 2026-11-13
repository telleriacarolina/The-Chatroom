import jwt from 'jsonwebtoken';

function requireSecret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set and at least 32 characters long`);
  }
  return value;
}

const ACCESS_SECRET = requireSecret('ACCESS_TOKEN_SECRET');
const REFRESH_SECRET = requireSecret('REFRESH_TOKEN_SECRET');

export function signAccess(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefresh(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
