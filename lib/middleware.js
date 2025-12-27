import { parse } from 'cookie';
import { verifyAccess } from './jwt';
import { encryptPhone } from './crypto';
import logger from '@/utils/logger';

// Simple in-memory rate limiter keyed by ip or identifier
const RATE_MAP = new Map();

export function runRateLimit(key, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = RATE_MAP.get(key) || { count: 0, firstAt: now };
  if (now - entry.firstAt > windowMs) {
    entry.count = 0;
    entry.firstAt = now;
  }
  entry.count += 1;
  RATE_MAP.set(key, entry);
  if (entry.count > max) {
    const err = new Error('Rate limit exceeded');
    err.code = 'RATE_LIMIT';
    throw err;
  }
}

export function getRequestKey(req) {
  // prefer phoneNumber in body if present (signup/signin), otherwise IP
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return ip;
  } catch (e) {
    return 'unknown';
  }
}

export function authenticateToken(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.accessToken;
  if (!token) throw new Error('No access token');
  const payload = verifyAccess(token);
  // @ts-ignore
  req.user = { id: payload.userId };
  return req.user;
}

export function requireAuth(req, res) {
  try {
    authenticateToken(req);
  } catch (e) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

export function requireVerifiedUser(req, res, user) {
  if (!user?.idVerified) {
    res.status(403).json({ error: 'ID verification required' });
    return false;
  }
  return true;
}

export function guestRestrictions(req, res, user) {
  // placeholder: enforce guest restrictions based on accountType or temp session
  // return true to allow, false to block
  return true;
}
