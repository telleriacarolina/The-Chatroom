import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as apiClient from '../../lib/api';
import * as phoneValidation from '../../lib/phoneValidation';
import { Button } from '../ui/button';
import LoginForm from '../auth/LoginForm';

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
    expect(apiClient.resolveApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses same-origin /api in browser when NEXT_PUBLIC_API_URL is missing', () => {
    clearApiEnv();
    setMockWindow('chatroom.example.com');
    expect(apiClient.buildApiUrl(apiClient.resolveApiBaseUrl(), '/api/auth/csrf?foo=bar')).toBe('/api/auth/csrf?foo=bar');
  });

  it('falls back to localhost in browser local development', () => {
    clearApiEnv();
    setMockWindow('localhost');
    expect(apiClient.resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('uses API_INTERNAL_URL on server when configured', () => {
    clearApiEnv();
    clearWindow();
    process.env.API_INTERNAL_URL = 'https://internal-api.example.com';
    expect(apiClient.resolveApiBaseUrl()).toBe('https://internal-api.example.com');
  });

  it('falls back to VERCEL_URL on server when API_INTERNAL_URL is missing', () => {
    clearApiEnv();
    clearWindow();
    process.env.VERCEL_URL = 'chatroom-preview.vercel.app';
    expect(apiClient.resolveApiBaseUrl()).toBe('https://chatroom-preview.vercel.app');
  });

  it('falls back to localhost on server in local development', () => {
    clearApiEnv();
    clearWindow();
    expect(apiClient.resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('preserves path and query strings', () => {
    expect(apiClient.buildApiUrl('https://api.example.com', '/api/auth/signin?lang=en&debug=true')).toBe(
      'https://api.example.com/api/auth/signin?lang=en&debug=true'
    );
  });

  it('prevents duplicate /api prefixes', () => {
    expect(apiClient.buildApiUrl('https://api.example.com/api', '/api/auth/signup')).toBe(
      'https://api.example.com/api/auth/signup'
    );
  });

  it('rejects malformed absolute endpoint URLs', () => {
    expect(() => apiClient.buildApiUrl('https://api.example.com', 'https://malicious.example.com/api')).toThrow(
      'Endpoint must be a relative API path.'
    );
  });

  it('rejects malformed base URLs', () => {
    expect(() => apiClient.buildApiUrl('not-a-valid-url', '/api/auth/csrf')).toThrow(
      'Invalid API base URL configuration.'
    );
  });
});

describe('UI interaction regressions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards disabled state on Button component', () => {
    render(<Button disabled>Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('disables login form controls while sign-in request is loading', async () => {
    let resolveSignin: (() => void) | undefined;
    vi.spyOn(apiClient, 'signin').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignin = () => resolve({});
        })
    );
    vi.spyOn(phoneValidation, 'validatePhoneNumber').mockReturnValue({ isValid: true });

    const user = userEvent.setup();
    render(<LoginForm onSwitchToSignup={() => {}} />);

    await user.type(screen.getByLabelText('Phone Number'), '+15555555555');
    await user.type(screen.getByLabelText('Password'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /signing in/i }) as HTMLButtonElement;
      expect(loadingButton.disabled).toBe(true);
    });

    expect((screen.getByLabelText('Phone Number') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Password') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /sign up/i }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: /signing in/i }));
    expect(apiClient.signin).toHaveBeenCalledTimes(1);

    resolveSignin?.();
    await waitFor(() => {
      const signInButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;
      expect(signInButton.disabled).toBe(false);
    });
  });
});
