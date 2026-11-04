/**
 * API Client for The Chatroom
 * Handles communication with the backend API server
 */

const LOCAL_API_ORIGIN = 'http://localhost:3001';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function ensureLeadingSlash(value: string): string {
  return value.startsWith('/') ? value : `/${value}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeApiBase(rawValue?: string): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    return stripTrailingSlash(ensureLeadingSlash(trimmed)) || '/';
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = stripTrailingSlash(parsed.pathname);
    const normalizedPath = pathname && pathname !== '/' ? pathname : '';
    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

export function resolveApiBaseUrl(): string {
  const browserApiUrl = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  const serverInternalApiUrl = normalizeApiBase(process.env.API_INTERNAL_URL);

  if (typeof window !== 'undefined') {
    if (browserApiUrl) {
      return browserApiUrl;
    }

    if (LOCAL_HOSTNAMES.has(window.location.hostname)) {
      return LOCAL_API_ORIGIN;
    }

    return '';
  }

  if (serverInternalApiUrl) {
    return serverInternalApiUrl;
  }

  if (browserApiUrl) {
    return browserApiUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return LOCAL_API_ORIGIN;
}

export function buildApiUrl(baseUrl: string, endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    throw new Error('Endpoint must be a relative API path.');
  }

  const [rawPath, rawQuery] = endpoint.split('?');
  let endpointPath = ensureLeadingSlash(rawPath || '/');
  const queryString = rawQuery ? `?${rawQuery}` : '';

  const normalizedBase = baseUrl.trim();
  const baseHasApiPath = normalizedBase.endsWith('/api');

  if (baseHasApiPath && endpointPath.startsWith('/api')) {
    endpointPath = endpointPath.replace(/^\/api(?=\/|$)/, '') || '/';
  }

  if (!normalizedBase) {
    return `${endpointPath}${queryString}`;
  }

  if (normalizedBase.startsWith('/')) {
    const relativeBase = stripTrailingSlash(ensureLeadingSlash(normalizedBase));
    return `${relativeBase}${endpointPath}${queryString}`;
  }

  try {
    const url = new URL(normalizedBase);
    const basePath = stripTrailingSlash(url.pathname);
    const joinedPath = `${basePath}${endpointPath}` || '/';
    url.pathname = joinedPath.startsWith('/') ? joinedPath : `/${joinedPath}`;
    url.search = queryString;
    return url.toString();
  } catch {
    throw new Error('Invalid API base URL configuration.');
  }
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SignupData {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
}

export interface SigninData {
  phoneNumber: string;
  password: string;
  staySignedIn?: boolean;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(buildApiUrl(resolveApiBaseUrl(), endpoint), {
      ...options,
      credentials: 'include', // Important for httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);

        if (!response.ok) {
          return {
            error: `Request failed with status ${response.status}`,
          };
        }

        return {
          error: 'Invalid JSON response from server',
        };
      }
    } else {
      // Fallback for non-JSON responses (e.g., HTML error pages, plain text)
      let textBody = '';
      try {
        textBody = await response.text();
      } catch (e) {
        console.error('Failed to read non-JSON response body:', e);
      }

      if (!response.ok) {
        const baseMessage = `Request failed with status ${response.status}`;
        return {
          error: textBody ? `${baseMessage}: ${textBody}` : baseMessage,
        };
      }

      // Successful non-JSON response; return raw text as data
      return { data: textBody as any as T };
    }

    if (!response.ok) {
      return {
        error: (data && data.error) || `Request failed with status ${response.status}`,
      };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Get CSRF token for protected requests
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const response = await apiFetch<{ csrfToken: string }>('/api/auth/csrf', {
      method: 'POST',
    });
    return response.data?.csrfToken || null;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<ApiResponse> {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Sign in an existing user
 */
export async function signin(data: SigninData): Promise<ApiResponse> {
  return apiFetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<ApiResponse> {
  return apiFetch('/api/auth/refresh', {
    method: 'POST',
  });
}

/**
 * Log out the current user
 */
export async function logout(): Promise<ApiResponse> {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Create a guest session
 */
export async function createGuestSession(ageCategory?: string): Promise<ApiResponse> {
  return apiFetch('/api/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ ageCategory }),
  });
}

/**
 * Change user password
 */
export async function changePassword(
  phoneNumber: string,
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, currentPassword, newPassword }),
  });
}
