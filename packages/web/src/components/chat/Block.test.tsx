import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApiUrl, createGuestSession, getCSRFToken, resolveApiBaseUrl } from '../../lib/api';

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_WINDOW = (globalThis as { window?: Window }).window;
const ORIGINAL_FETCH = globalThis.fetch;

function clearApiEnv(): void {
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.API_INTERNAL_URL;
  delete process.env.VERCEL_URL;
}

function setMockWindow(hostname: string): void {
  Object.defineProperty(globalThis, 'window', {
    value: { location: { hostname } },
    configurable: true,
  });
}

function clearWindow(): void {
  Object.defineProperty(globalThis, 'window', {
    value: undefined,
    configurable: true,
  });
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
  globalThis.fetch = ORIGINAL_FETCH;

  if (ORIGINAL_WINDOW) {
    Object.defineProperty(globalThis, 'window', {
      value: ORIGINAL_WINDOW,
      configurable: true,
    });
  } else {
    delete (globalThis as { window?: Window }).window;
  }
});

describe('API URL resolution', () => {
  it('uses NEXT_PUBLIC_API_URL in browser when configured', () => {
    clearApiEnv();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
    setMockWindow('chatroom.example.com');
    expect(resolveApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses same-origin /api in browser when NEXT_PUBLIC_API_URL is missing', () => {
    clearApiEnv();
    setMockWindow('chatroom.example.com');
    expect(buildApiUrl(resolveApiBaseUrl(), '/api/auth/csrf?foo=bar')).toBe('/api/auth/csrf?foo=bar');
  });

  it('falls back to localhost in browser local development', () => {
    clearApiEnv();
    setMockWindow('localhost');
    expect(resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('uses API_INTERNAL_URL on server when configured', () => {
    clearApiEnv();
    clearWindow();
    process.env.API_INTERNAL_URL = 'https://internal-api.example.com';
    expect(resolveApiBaseUrl()).toBe('https://internal-api.example.com');
  });

  it('falls back to VERCEL_URL on server when API_INTERNAL_URL is missing', () => {
    clearApiEnv();
    clearWindow();
    process.env.VERCEL_URL = 'chatroom-preview.vercel.app';
    expect(resolveApiBaseUrl()).toBe('https://chatroom-preview.vercel.app');
  });

  it('falls back to localhost on server in local development', () => {
    clearApiEnv();
    clearWindow();
    expect(resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('preserves path and query strings', () => {
    expect(buildApiUrl('https://api.example.com', '/api/auth/signin?lang=en&debug=true')).toBe(
      'https://api.example.com/api/auth/signin?lang=en&debug=true'
    );
  });

  it('prevents duplicate /api prefixes', () => {
    expect(buildApiUrl('https://api.example.com/api', '/api/auth/signup')).toBe(
      'https://api.example.com/api/auth/signup'
    );
  });

  it('rejects malformed absolute endpoint URLs', () => {
    expect(() => buildApiUrl('https://api.example.com', 'https://malicious.example.com/api')).toThrow(
      'Endpoint must be a relative API path.'
    );
  });

  it('rejects malformed base URLs', () => {
    expect(() => buildApiUrl('not-a-valid-url', '/api/auth/csrf')).toThrow(
      'Invalid API base URL configuration.'
    );
  });
});

describe('Guest and CSRF API requests', () => {
  it('creates guest session using the production guest endpoint payload', async () => {
    clearApiEnv();
    setMockWindow('localhost');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ tempSessionToken: 'temp-token', guestId: 'g-1' }),
    });

    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const response = await createGuestSession('PLUS_18');
    expect(response.error).toBeUndefined();
    expect(response.data?.tempSessionToken).toBe('temp-token');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/guest',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ ageCategory: 'PLUS_18' }),
      })
    );
  });

  it('requests CSRF token from auth endpoint', async () => {
    clearApiEnv();
    setMockWindow('localhost');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ csrfToken: 'csrf-token' }),
    });

    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const csrfToken = await getCSRFToken();
    expect(csrfToken).toBe('csrf-token');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/csrf',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });
});
