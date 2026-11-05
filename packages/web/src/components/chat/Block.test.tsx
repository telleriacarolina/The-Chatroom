import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Block from './Block';
import * as apiModule from '@/lib/api';
import * as socketModule from '@/lib/socket';

vi.mock('@/components/ConnectionStatus', () => ({
  default: () => <div data-testid="connection-status">ConnectionStatus</div>,
}));

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

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

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
    expect(apiModule.resolveApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses same-origin /api in browser when NEXT_PUBLIC_API_URL is missing', () => {
    clearApiEnv();
    setMockWindow('chatroom.example.com');
    expect(apiModule.buildApiUrl(apiModule.resolveApiBaseUrl(), '/api/auth/csrf?foo=bar')).toBe('/api/auth/csrf?foo=bar');
  });

  it('falls back to localhost in browser local development', () => {
    clearApiEnv();
    setMockWindow('localhost');
    expect(apiModule.resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('uses API_INTERNAL_URL on server when configured', () => {
    clearApiEnv();
    clearWindow();
    process.env.API_INTERNAL_URL = 'https://internal-api.example.com';
    expect(apiModule.resolveApiBaseUrl()).toBe('https://internal-api.example.com');
  });

  it('falls back to VERCEL_URL on server when API_INTERNAL_URL is missing', () => {
    clearApiEnv();
    clearWindow();
    process.env.VERCEL_URL = 'chatroom-preview.vercel.app';
    expect(apiModule.resolveApiBaseUrl()).toBe('https://chatroom-preview.vercel.app');
  });

  it('falls back to localhost on server in local development', () => {
    clearApiEnv();
    clearWindow();
    expect(apiModule.resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('preserves path and query strings', () => {
    expect(apiModule.buildApiUrl('https://api.example.com', '/api/auth/signin?lang=en&debug=true')).toBe(
      'https://api.example.com/api/auth/signin?lang=en&debug=true'
    );
  });

  it('prevents duplicate /api prefixes', () => {
    expect(apiModule.buildApiUrl('https://api.example.com/api', '/api/auth/signup')).toBe(
      'https://api.example.com/api/auth/signup'
    );
  });

  it('rejects malformed absolute endpoint URLs', () => {
    expect(() => apiModule.buildApiUrl('https://api.example.com', 'https://malicious.example.com/api')).toThrow(
      'Endpoint must be a relative API path.'
    );
  });

  it('rejects malformed base URLs', () => {
    expect(() => apiModule.buildApiUrl('not-a-valid-url', '/api/auth/csrf')).toThrow(
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

    const response = await apiModule.createGuestSession('PLUS_18');
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

    const csrfToken = await apiModule.getCSRFToken();
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

describe('Block guest session lifecycle', () => {
  it('creates a guest session, persists it, and syncs socket auth', async () => {
    const createGuestSessionSpy = vi.spyOn(apiModule, 'createGuestSession').mockResolvedValue({
      data: { tempSessionToken: 'session-123' },
    });
    const setAuthTokenSpy = vi.spyOn(socketModule, 'setAuthToken');

    render(<Block />);
    fireEvent.change(screen.getByPlaceholderText('Enter your username (4-10 characters)'), { target: { value: 'GuestA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => expect(createGuestSessionSpy).toHaveBeenCalledWith('PLUS_18'));
    await waitFor(() => expect(localStorage.getItem('guestUsername')).toBe('GuestA'));
    await waitFor(() => expect(localStorage.getItem('guestToken')).toBe('session-123'));
    await waitFor(() => expect(setAuthTokenSpy).toHaveBeenCalledWith('session-123'));
    expect(screen.getByText('GuestA')).toBeTruthy();
  });

  it('restores a previously saved guest session and syncs auth state', () => {
    const setAuthTokenSpy = vi.spyOn(socketModule, 'setAuthToken');
    localStorage.setItem('guestUsername', 'SavedGuest');
    localStorage.setItem('guestToken', 'saved-token');

    render(<Block />);

    expect(screen.getByText('SavedGuest')).toBeTruthy();
    expect(setAuthTokenSpy).toHaveBeenCalledWith('saved-token');
  });

  it('clears persisted guest state when changing username', async () => {
    const createGuestSessionSpy = vi.spyOn(apiModule, 'createGuestSession').mockResolvedValue({
      data: { tempSessionToken: 'new-token' },
    });
    const setAuthTokenSpy = vi.spyOn(socketModule, 'setAuthToken');
    localStorage.setItem('guestUsername', 'OldGuest');
    localStorage.setItem('guestToken', 'old-token');

    render(<Block />);
    fireEvent.click(screen.getByRole('button', { name: 'Change Username' }));

    expect(localStorage.getItem('guestUsername')).toBeNull();
    expect(localStorage.getItem('guestToken')).toBeNull();
    expect(setAuthTokenSpy).toHaveBeenCalledWith(null);

    fireEvent.change(screen.getByPlaceholderText('Enter your username (4-10 characters)'), { target: { value: 'NewGuest' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => expect(createGuestSessionSpy).toHaveBeenCalledWith('PLUS_18'));
    await waitFor(() => expect(localStorage.getItem('guestUsername')).toBe('NewGuest'));
    await waitFor(() => expect(localStorage.getItem('guestToken')).toBe('new-token'));
  });

  it('keeps stale guest session state out of the UI when guest creation fails', async () => {
    const createGuestSessionSpy = vi.spyOn(apiModule, 'createGuestSession').mockResolvedValue({
      error: 'Guest session failed',
    });
    const setAuthTokenSpy = vi.spyOn(socketModule, 'setAuthToken');

    render(<Block />);
    fireEvent.change(screen.getByPlaceholderText('Enter your username (4-10 characters)'), { target: { value: 'GuestFail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => expect(createGuestSessionSpy).toHaveBeenCalledWith('PLUS_18'));
    await waitFor(() => expect(screen.getByText('Failed to create guest session. Please try again.')).toBeTruthy());
    expect(localStorage.getItem('guestUsername')).toBeNull();
    expect(localStorage.getItem('guestToken')).toBeNull();
    expect(setAuthTokenSpy).not.toHaveBeenCalledWith('guest-session-fail');
  });
});
