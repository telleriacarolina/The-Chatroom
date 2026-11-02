import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT secrets must be provided in production environment');
  }
}

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'development_access_token_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'development_refresh_token_secret';

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
