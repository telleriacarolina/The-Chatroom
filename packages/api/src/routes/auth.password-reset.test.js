const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

function loadAuthRouter({
  prismaMock,
  sendSmsMock = async () => {},
  limiters = {}
}) {
  const originalLoad = Module._load;
  const rateLimiters = {
    authLimiter: (req, res, next) => next(),
    resetRequestLimiter: (req, res, next) => next(),
    resetVerifyLimiter: (req, res, next) => next(),
    ...limiters
  };

  Module._load = function patched(request, parent, isMain) {
    if (request === '../lib/prisma') return { prisma: prismaMock };
    if (request === '../lib/crypto') return { encryptPhone: (value) => `enc:${value}` };
    if (request === '../lib/twilio') return { sendSms: sendSmsMock };
    if (request === '../middleware/rateLimiter') return rateLimiters;
    if (request === '../lib/jwt') {
      return {
        signAccess: () => 'access',
        signRefresh: () => 'refresh',
        verifyRefresh: () => ({ userId: 'user-1' })
      };
    }
    if (request === '../utils/security') return { generateCSRFToken: () => 'csrf-token' };
    return originalLoad.apply(this, arguments);
  };

  delete require.cache[require.resolve('./auth')];
  const router = require('./auth');
  Module._load = originalLoad;
  return router;
}

async function invokeRoute(router, path, body) {
  const layer = router.stack.find((entry) => entry.route && entry.route.path === path);
  assert.ok(layer, `Route not found: ${path}`);

  const req = { body, cookies: {}, headers: {} };
  const res = {
    statusCode: 200,
    payload: undefined,
    cookiesSet: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    cookie(name, value) {
      this.cookiesSet.push({ name, value });
    },
    clearCookie() {}
  };

  for (const entry of layer.route.stack) {
    const handler = entry.handle;
    let nextCalled = false;
    await new Promise((resolve, reject) => {
      const next = (err) => {
        if (err) return reject(err);
        nextCalled = true;
        resolve();
      };

      Promise.resolve(handler(req, res, next))
        .then(() => {
          if (!nextCalled) resolve();
        })
        .catch(reject);
    });

    if (!nextCalled) break;
  }

  return res;
}

test('reset-password rejects expired code records', async () => {
  const prismaMock = {
    passwordReset: { findFirst: async () => null, deleteMany: async () => ({ count: 0 }) },
    user: { findUnique: async () => ({ id: 'user-1' }), update: async () => ({}) },
    session: { updateMany: async () => ({ count: 1 }) }
  };
  const router = loadAuthRouter({ prismaMock });
  const response = await invokeRoute(router, '/reset-password', {
    phoneNumber: '+15551234567',
    code: '123456',
    newPassword: 'Aa1!aaaaaa'
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error, 'Invalid or expired reset code');
});

test('reset-password rejects incorrect codes with secure hash verification', async () => {
  const { hashOneTimeCode } = require('../utils/passwordPolicy');
  const encryptedPhone = 'enc:+15557654321';
  const prismaMock = {
    passwordReset: {
      findFirst: async () => ({
        token: hashOneTimeCode('654321', encryptedPhone),
        createdAt: new Date()
      }),
      deleteMany: async () => ({ count: 0 })
    },
    user: { findUnique: async () => ({ id: 'user-1' }), update: async () => ({}) },
    session: { updateMany: async () => ({ count: 1 }) }
  };
  const router = loadAuthRouter({ prismaMock });
  const response = await invokeRoute(router, '/reset-password', {
    phoneNumber: '+15557654321',
    code: '123456',
    newPassword: 'Aa1!aaaaaa'
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error, 'Invalid or expired reset code');
});

test('reset-password blocks repeated attempts via limiter', async () => {
  let attempts = 0;
  const prismaMock = {
    passwordReset: { findFirst: async () => null, deleteMany: async () => ({ count: 0 }) },
    user: { findUnique: async () => ({ id: 'user-1' }), update: async () => ({}) },
    session: { updateMany: async () => ({ count: 1 }) }
  };
  const router = loadAuthRouter({
    prismaMock,
    limiters: {
      resetVerifyLimiter: (req, res, next) => {
        attempts += 1;
        if (attempts > 2) return res.status(429).json({ error: 'Rate limited' });
        return next();
      }
    }
  });

  const payload = { phoneNumber: '+15550000000', code: '123456', newPassword: 'Aa1!aaaaaa' };
  const first = await invokeRoute(router, '/reset-password', payload);
  const second = await invokeRoute(router, '/reset-password', payload);
  const third = await invokeRoute(router, '/reset-password', payload);

  assert.equal(first.statusCode, 401);
  assert.equal(second.statusCode, 401);
  assert.equal(third.statusCode, 429);
});

test('request-password-reset returns 503 in production when SMS delivery fails', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const deleteCalls = [];
  const prismaMock = {
    user: { findUnique: async () => ({ id: 'user-1' }) },
    passwordReset: {
      create: async () => ({ id: 'reset-1' }),
      deleteMany: async (args) => {
        deleteCalls.push(args);
        return { count: 1 };
      }
    },
    session: { updateMany: async () => ({ count: 1 }) }
  };

  const router = loadAuthRouter({
    prismaMock,
    sendSmsMock: async () => {
      throw new Error('SMS failed');
    }
  });

  const response = await invokeRoute(router, '/request-password-reset', {
    phoneNumber: '+15559876543'
  });

  process.env.NODE_ENV = originalEnv;

  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, 'Unable to deliver reset code right now');
  assert.ok(deleteCalls.length >= 2);
});

test('reset-password revokes sessions and prevents replay after successful use', async () => {
  const { hashOneTimeCode } = require('../utils/passwordPolicy');
  const encryptedPhone = 'enc:+15551112222';
  const state = { activeReset: true };
  const sessionUpdates = [];

  const prismaMock = {
    passwordReset: {
      findFirst: async () =>
        state.activeReset
          ? { token: hashOneTimeCode('123456', encryptedPhone), createdAt: new Date() }
          : null,
      deleteMany: async () => {
        state.activeReset = false;
        return { count: 1 };
      }
    },
    user: {
      findUnique: async () => ({ id: 'user-1' }),
      update: async () => ({ id: 'user-1' })
    },
    session: {
      updateMany: async (args) => {
        sessionUpdates.push(args);
        return { count: 2 };
      }
    }
  };

  const router = loadAuthRouter({ prismaMock });
  const payload = {
    phoneNumber: '+15551112222',
    code: '123456',
    newPassword: 'Aa1!aaaaaa'
  };

  const success = await invokeRoute(router, '/reset-password', payload);
  const replay = await invokeRoute(router, '/reset-password', payload);

  assert.equal(success.statusCode, 200);
  assert.equal(success.payload.ok, true);
  assert.equal(replay.statusCode, 401);
  assert.equal(sessionUpdates.length, 1);
  assert.deepEqual(sessionUpdates[0], {
    where: { userId: 'user-1' },
    data: { isActive: false }
  });
});
