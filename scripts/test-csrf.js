const assert = require('assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../api/routes/auth');

function extractCookie(setCookieHeader, name) {
  const cookie = setCookieHeader.find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split(';')[0].split('=').slice(1).join('=');
}

async function run() {
  const app = express();
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

    const missingTokenRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '123', password: '123' })
    });
    assert.strictEqual(missingTokenRes.status, 403, 'missing csrf token should be rejected');

    const mismatchTokenRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': `${csrfToken}-tampered`,
        cookie: `csrfToken=${csrfCookie}`
      },
      body: JSON.stringify({ phoneNumber: '123', password: '123' })
    });
    assert.strictEqual(mismatchTokenRes.status, 403, 'tampered csrf token should be rejected');

    const validTokenRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: `csrfToken=${csrfCookie}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(validTokenRes.status, 400, 'valid csrf token should pass csrf checks');

    const crossOriginCsrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'POST',
      headers: {
        origin: 'https://app.example.com',
        'x-forwarded-proto': 'https'
      }
    });
    const crossOriginCookie = crossOriginCsrfRes.headers.getSetCookie()[0];
    assert.ok(crossOriginCookie.includes('SameSite=None'), 'cross-origin csrf cookie should be SameSite=None');
    assert.ok(crossOriginCookie.includes('Secure'), 'cross-origin csrf cookie should be Secure');

    console.log('CSRF tests passed');
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
