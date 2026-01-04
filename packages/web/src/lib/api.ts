/**
 * API Client Utilities
 * 
 * Provides a fetch wrapper with error handling, TypeScript types,
 * and helper functions for making HTTP requests to the backend API.
 * 
 * 🔒 CANONICAL PATTERN: This file implements the STATELESS API SERVICE layer.
 * 
 * Rules:
 * - ❌ NEVER manage UI state (loading, error, success indicators)
 * - ❌ NEVER show toasts, modals, or other UI elements
 * - ✅ Only handle HTTP requests and responses
 * - ✅ Throw errors for callers to handle
 * - ✅ Return typed data
 * 
 * State management belongs in container/page components, not here.
 * See: docs/frontend/LOADING_STATE_PATTERN.md
 */

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
  details?: any;
}

export interface FetchOptions extends RequestInit {
  baseURL?: string;
  timeout?: number;
}

// Auth-related response types
export interface SignupResponse {
  message: string;
  userId: string;
}

export interface SigninResponse {
  ok: boolean;
  user: {
    id: string;
    phoneNumber: string;
  };
}

export interface GuestResponse {
  tempSessionToken: string;
  guestId: string;
  expiresAt: string;
}

export interface CSRFResponse {
  csrfToken: string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ApiRequestError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

// ============================================================================
// Core Fetch Wrapper
// ============================================================================

/**
 * Enhanced fetch wrapper with error handling and timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include', // Include cookies for auth
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiRequestError('Request timeout', 408);
    }
    throw error;
  }
}

/**
 * Main API request function with error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { baseURL = API_BASE_URL, headers = {}, ...fetchOptions } = options;
  
  const url = `${baseURL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers: defaultHeaders,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = 'Request failed';
      let errorDetails;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiRequestError(errorMessage, response.status, errorDetails);
    }

    // Parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Return empty object for non-JSON responses (e.g., 204 No Content)
    return {} as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Network errors or other unexpected errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiRequestError('Network error - unable to reach server', 0);
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

// ============================================================================
// HTTP Method Helpers
// ============================================================================

/**
 * GET request helper
 */
export async function get<T = any>(
  endpoint: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export async function post<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function put<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function patch<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function del<T = any>(
  endpoint: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

// ============================================================================
// API Endpoint Helpers
// ============================================================================

/**
 * Authentication API helpers
 */
export const authApi = {
  /**
   * Get CSRF token for protected requests
   */
  getCSRFToken: () => post<CSRFResponse>('/api/auth/csrf'),

  /**
   * Sign up a new user
   */
  signup: (data: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    birthYear?: string;
  }) => post<SignupResponse>('/api/auth/signup', data),

  /**
   * Sign in an existing user
   */
  signin: (data: {
    phoneNumber: string;
    password: string;
    staySignedIn?: boolean;
  }) => post<SigninResponse>('/api/auth/signin', data),

  /**
   * Create guest session
   */
  createGuest: (data: { ageCategory?: string }) =>
    post<GuestResponse>('/api/auth/guest', data),

  /**
   * Change password
   */
  changePassword: (data: {
    phoneNumber: string;
    oldPassword: string;
    newPassword: string;
  }) => post('/api/auth/change-password', data),

  /**
   * Refresh access token
   */
  refreshToken: () => post('/api/auth/refresh'),

  /**
   * Sign out current user
   */
  signout: () => post('/api/auth/signout'),
};

/**
 * Health check
 */
export const healthCheck = () =>
  get<{ status: string; timestamp: string }>('/health');

// ============================================================================
// Exports
// ============================================================================

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  apiRequest,
  authApi,
  healthCheck,
};
