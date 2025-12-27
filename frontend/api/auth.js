const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

let csrfToken = null;

export async function fetchCSRFToken() {
  const response = await fetch(`${API_BASE}/auth/csrf`, {
    credentials: 'include'
  });
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function apiRequest(endpoint, options = {}) {
  if (!csrfToken && options.method && options.method !== 'GET') {
    await fetchCSRFToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (csrfToken && options.method && options.method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest(endpoint, options);
  }

  return response;
}

export async function signUp(phone, firstName, lastName, birthYear) {
  const response = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: phone, firstName, lastName, birthYear })
  });
  return response.json();
}

export async function signIn(phone, password, stayOnline = false) {
  const response = await apiRequest('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: phone, password, staySignedIn: stayOnline })
  });
  return response.json();
}

export async function signOut() {
  const response = await apiRequest('/auth/logout', { method: 'POST' });
  return response.json();
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
}

export async function keepDefaultPassword() {
  const response = await apiRequest('/auth/keep-default-password', { method: 'POST' });
  return response.json();
}

export async function sendHeartbeat() {
  const response = await apiRequest('/auth/heartbeat', { method: 'POST' });
  return response.json();
}

export async function startGuestSession() {
  const response = await apiRequest('/auth/guest', { method: 'POST' });
  return response.json();
}
