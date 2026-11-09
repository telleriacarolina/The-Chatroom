import { afterEach, describe, expect, it } from 'vitest';
import { buildApiUrl, getClientReleaseId, getCompatibilityError, normalizeReleaseId, resolveApiBaseUrl } from '../../lib/api';
import { cleanupSocket, getSocket, restoreStoredAuthToken } from '../../lib/socket';

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_WINDOW = (globalThis as { window?: Window }).window;

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

  it('normalizes blank or null release IDs and keeps API version distinct', () => {
    expect(normalizeReleaseId('   ')).toBeNull();
    expect(normalizeReleaseId('null')).toBeNull();
    expect(normalizeReleaseId('release-123')).toBe('release-123');
    expect(getClientReleaseId()).toBeNull();
  });

  it('classifies release mismatch separately from API version mismatch', () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'x-chatroom-release-id': 'release-a',
        'x-chatroom-api-version': '2.0.0',
      },
    });

    process.env.NEXT_PUBLIC_APP_RELEASE_ID = 'release-b';
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';

    const mismatch = getCompatibilityError(response);
    expect(mismatch).toContain('Deployment release mismatch detected');
    expect(mismatch).not.toContain('API version mismatch detected');
  });

  it('treats missing release IDs as incomplete identity instead of compatible', () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'x-chatroom-release-id': 'release-a',
      },
    });

    delete process.env.NEXT_PUBLIC_APP_RELEASE_ID;
    delete process.env.APP_RELEASE_ID;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.RENDER_GIT_COMMIT;

    const mismatch = getCompatibilityError(response);
    expect(mismatch).toContain('Deployment identity is incomplete');
  });

  it('restores stored auth before connecting the socket', () => {
    setMockWindow('localhost');
    localStorage.setItem('guestToken', 'stored-token');

    const restored = restoreStoredAuthToken();
    const socket = getSocket();

    expect(restored).toBe('stored-token');
    expect(socket?.auth).toMatchObject({ token: 'stored-token' });

    cleanupSocket();
    localStorage.clear();
  });

  it('preserves the stored token across socket auth restoration', () => {
    setMockWindow('localhost');
    localStorage.setItem('guestToken', 'persisted-token');
    const restored = restoreStoredAuthToken();

    expect(restored).toBe('persisted-token');
    expect(getSocket()?.auth).toMatchObject({ token: 'persisted-token' });

    cleanupSocket();
    localStorage.clear();
  });
});
