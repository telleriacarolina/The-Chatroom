const assert = require('node:assert/strict');
const { test } = require('node:test');

const { validatePayload, userSchema, chatMessageSchema, MAX_PAGE_SIZE, sanitizeLogData } = require('../shared/schemas/index.js');
const { enforceMessageThrottle } = require('../socket/messageThrottle.js');

const { authLimiter, apiLimiter } = require('../api/middleware/rateLimiter.js');

test('guest validation rejects malformed payloads', () => {
  assert.equal(validatePayload({ ageCategory: '_18PLUS' }, userSchema.guest).valid, true);
  assert.equal(validatePayload({ ageCategory: 'bogus' }, userSchema.guest).valid, false);
});

test('message validation rejects empty content and invalid ids', () => {
  assert.equal(validatePayload({ content: 'hi' }, chatMessageSchema.create).valid, true);
  assert.equal(validatePayload({ content: '' }, chatMessageSchema.create).valid, false);
  assert.equal(validatePayload({ messageId: '', userId: 'u1', loungeId: 'l1' }, chatMessageSchema.delete).valid, false);
});

test('pagination boundary guards enforce max page size and minimum limit', () => {
  assert.equal(validatePayload({ limit: 0 }, { limit: { type: 'number', minimum: 1, maximum: MAX_PAGE_SIZE } }).valid, false);
  assert.equal(validatePayload({ limit: MAX_PAGE_SIZE + 1 }, { limit: { type: 'number', minimum: 1, maximum: MAX_PAGE_SIZE } }).valid, false);
  assert.equal(validatePayload({ limit: MAX_PAGE_SIZE }, { limit: { type: 'number', minimum: 1, maximum: MAX_PAGE_SIZE } }).valid, true);
});

test('log sanitization strips sensitive values', () => {
  const sanitized = sanitizeLogData({
    authorization: '******',
    password: 'hunter2',
    phoneNumber: '1234567890',
    message: 'keep me secret'
  });

  assert.equal(sanitized.authorization, '[REDACTED]');
  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.phoneNumber, '[REDACTED]');
  assert.equal(sanitized.message, '[REDACTED]');
});

test('per-user message throttle blocks abuse after the threshold', () => {
  const userId = 'rate-limit-test-user';
  for (let i = 0; i < 12; i += 1) {
    assert.equal(enforceMessageThrottle(userId), true);
  }
  assert.equal(enforceMessageThrottle(userId), false);
});

test('auth and API rate limiters are configured as middleware objects', () => {
  assert.ok(authLimiter && typeof authLimiter === 'function');
  assert.ok(apiLimiter && typeof apiLimiter === 'function');
});
