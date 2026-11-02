const assert = require('assert');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('../api/routes/auth');
const { getCorsOptions } = require('../api/utils/cors');

function extractCookie(setCookieHeader, name) {
  const cookie = setCookieHeader.find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split(';')[0].split('=').slice(1).join('=');
}

async function run() {
  process.env.FRONTEND_URL = 'https://app.example.com,https://staging.example.com';
  process.env.COOKIE_DOMAIN = '.example.com';

  const app = express();
  app.set('trust proxy', 1);
  app.use(cors(getCorsOptions()));
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, { method: 'POST' });
    assert.strictEqual(csrfRes.status, 200, 'csrf endpoint should return 200');
    const setCookie = csrfRes.headers.getSetCookie();
    assert.ok(setCookie.length > 0, 'csrf endpoint should set cookie');
    assert.ok(setCookie[0].includes('HttpOnly'), 'csrf cookie should be HttpOnly');
    assert.ok(setCookie[0].includes('SameSite=Lax'), 'same-origin csrf cookie should be SameSite=Lax');
    const { csrfToken } = await csrfRes.json();
    const csrfCookie = extractCookie(setCookie, 'csrfToken');
    assert.ok(csrfToken && csrfCookie, 'csrf token should be returned and cookie should exist');

    for (const endpoint of ['guest', 'signin', 'signup']) {
      const missingTokenRes = await fetch(`${baseUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(missingTokenRes.status, 403, `${endpoint} should reject missing csrf token`);
    }

    const invalidTokenRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'short',
        cookie: `csrfToken=${csrfCookie}`
      },
      body: JSON.stringify({ phoneNumber: '123', password: '123' })
    });
    assert.strictEqual(invalidTokenRes.status, 403, 'invalid csrf token should be rejected');

    const mismatchedToken = csrfToken.slice(0, -1) + (csrfToken.slice(-1) === 'a' ? 'b' : 'a');
    const mismatchTokenRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': mismatchedToken,
        cookie: `csrfToken=${csrfCookie}`
      },
      body: JSON.stringify({ phoneNumber: '123', password: '123' })
    });
    assert.strictEqual(mismatchTokenRes.status, 403, 'mismatched csrf token should be rejected');

    const validSameOriginRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: `csrfToken=${csrfCookie}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(validSameOriginRes.status, 400, 'valid same-origin csrf request should pass csrf checks');

    const allowedOrigin = 'https://app.example.com';
    const allowedCsrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'POST',
      headers: {
        origin: allowedOrigin,
        'x-forwarded-proto': 'https'
      }
    });
    assert.strictEqual(
      allowedCsrfRes.headers.get('access-control-allow-origin'),
      allowedOrigin,
      'allowed cross-origin request should echo trusted origin'
    );
    assert.strictEqual(
      allowedCsrfRes.headers.get('access-control-allow-credentials'),
      'true',
      'allowed cross-origin request should allow credentials'
    );
    assert.notStrictEqual(
      allowedCsrfRes.headers.get('access-control-allow-origin'),
      '*',
      'credentialed CORS must not use wildcard origin'
    );

    const allowedCookieHeader = allowedCsrfRes.headers.getSetCookie()[0];
    const allowedTokenBody = await allowedCsrfRes.json();
    const allowedCsrfCookie = extractCookie([allowedCookieHeader], 'csrfToken');
    assert.ok(allowedCsrfCookie, 'allowed origin should receive csrf cookie');

    const validAllowedOriginRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        origin: allowedOrigin,
        'x-forwarded-proto': 'https',
        'content-type': 'application/json',
        'x-csrf-token': allowedTokenBody.csrfToken,
        cookie: `csrfToken=${allowedCsrfCookie}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(validAllowedOriginRes.status, 400, 'valid trusted cross-origin request should pass csrf checks');
    assert.strictEqual(
      validAllowedOriginRes.headers.get('access-control-allow-origin'),
      allowedOrigin,
      'trusted cross-origin response should include explicit allow origin'
    );

    const untrustedOrigin = 'https://evil.example.net';
    const untrustedPreflight = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'OPTIONS',
      headers: {
        origin: untrustedOrigin,
        'access-control-request-method': 'POST'
      }
    });
    assert.ok(
      [200, 204, 404].includes(untrustedPreflight.status),
      'preflight should complete without granting CORS access'
    );
    assert.strictEqual(
      untrustedPreflight.headers.get('access-control-allow-origin'),
      null,
      'untrusted origin should not receive allow-origin header'
    );

    const untrustedPostRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        origin: untrustedOrigin,
        'x-forwarded-proto': 'https',
        'content-type': 'application/json',
        'x-csrf-token': allowedTokenBody.csrfToken,
        cookie: `csrfToken=${allowedCsrfCookie}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(
      untrustedPostRes.headers.get('access-control-allow-origin'),
      null,
      'untrusted cross-origin response should not include allow-origin'
    );

    const crossOriginCsrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'POST',
      headers: {
        origin: allowedOrigin,
        'x-forwarded-proto': 'https'
      }
    });
    const crossOriginCookie = crossOriginCsrfRes.headers.getSetCookie()[0];
    assert.ok(crossOriginCookie.includes('SameSite=None'), 'cross-origin csrf cookie should be SameSite=None');
    assert.ok(crossOriginCookie.includes('Secure'), 'cross-origin csrf cookie should be Secure');
    assert.ok(crossOriginCookie.includes('Domain=.example.com'), 'production cookie should include configured domain');

    console.log('CSRF tests passed');
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
