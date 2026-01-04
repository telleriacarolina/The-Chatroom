# Canonical Loading-State Ownership Pattern

## Overview

This document defines the **canonical loading-state ownership model** for all frontend API calls in The Chatroom application. Following this pattern ensures:

- ✅ Consistent UX during network operations
- ✅ Prevention of double submissions
- ✅ Clear separation of concerns
- ✅ Maintainable and testable code
- ✅ Predictable error handling

---

## The Three-Layer Architecture

### 1. API / Service Layer (Stateless)

**Responsibility:** Network logic and error propagation only.

**Rules:**
- ❌ NEVER manage UI state (loading, error, success)
- ❌ NEVER show loading indicators or toasts
- ✅ Only handle HTTP requests and responses
- ✅ Throw errors for callers to handle
- ✅ Return typed data

**Example:**

```typescript
// ✅ CORRECT: Stateless API service
export const authApi = {
  signin: async (data: SigninData): Promise<SigninResponse> => {
    // No loading state here
    const response = await post<SigninResponse>('/api/auth/signin', data);
    return response; // Just return data
  }
};

// ❌ WRONG: Service managing UI state
export const authApi = {
  signin: async (data: SigninData): Promise<SigninResponse> => {
    setLoading(true); // ❌ NO! Service shouldn't manage loading
    showToast('Signing in...'); // ❌ NO! Service shouldn't show UI
    const response = await post<SigninResponse>('/api/auth/signin', data);
    setLoading(false); // ❌ NO!
    return response;
  }
};
```

---

### 2. Page / Container Layer (State Owner)

**Responsibility:** Owns loading, error, and side effects.

**Rules:**
- ✅ Own loading and error state via `useState` or custom hooks
- ✅ Call API services and handle results
- ✅ Handle side effects (redirects, auth state updates)
- ✅ Pass state down to presentational components as props
- ✅ Prevent duplicate submissions

**Example:**

```typescript
// ✅ CORRECT: Container component owns state
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (data: LoginFormData) => {
    // Prevent double submission
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.signin(data);
      // Handle success (side effects)
      router.push('/dashboard');
    } catch (err) {
      // Handle error
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

---

### 3. Presentational Layer (Props Receiver)

**Responsibility:** Display UI and reflect state received via props.

**Rules:**
- ✅ Receive loading and error state as props
- ✅ Disable inputs when loading
- ✅ Show loading indicators
- ✅ Display error messages
- ❌ NEVER call API directly
- ❌ NEVER manage loading/error state internally

**Example:**

```typescript
// ✅ CORRECT: Presentational component receives state
interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    phoneNumber: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData); // Just call the handler, don't manage loading
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        disabled={isLoading} // ✅ Disable during loading
      />
      <Input
        type="password"
        name="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        disabled={isLoading} // ✅ Disable during loading
      />
      
      {error && <ErrorMessage>{error}</ErrorMessage>} {/* ✅ Display error */}
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'} {/* ✅ Show loading text */}
      </Button>
    </form>
  );
}
```

---

## Reusable Hooks

To simplify the pattern, use these custom hooks:

### `useApiRequest` Hook

```typescript
import { useState } from 'react';

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApiRequest<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiRequestOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async (...args: any[]) => {
    if (isLoading) return; // Prevent double submission

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      options.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading,
    error,
    data,
    reset: () => {
      setIsLoading(false);
      setError(null);
      setData(null);
    }
  };
}
```

**Usage:**

```typescript
export default function LoginPage() {
  const router = useRouter();
  
  const { execute, isLoading, error } = useApiRequest(
    authApi.signin,
    {
      onSuccess: () => router.push('/dashboard')
    }
  );

  return <LoginForm onSubmit={execute} isLoading={isLoading} error={error} />;
}
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: API Service with UI State

```typescript
// ❌ WRONG
export const authApi = {
  signin: async (data: SigninData) => {
    toast.loading('Signing in...'); // NO!
    const response = await post('/api/auth/signin', data);
    toast.success('Signed in!'); // NO!
    return response;
  }
};
```

### ❌ Anti-Pattern 2: Form Managing Its Own API Calls

```typescript
// ❌ WRONG: Form component calling API directly
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authApi.signin({ ... }); // NO! Form shouldn't call API
    setIsLoading(false);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### ❌ Anti-Pattern 3: No Double-Submission Prevention

```typescript
// ❌ WRONG: No guard against double submission
const handleSubmit = async () => {
  setIsLoading(true); // User can click again before this runs
  await authApi.signin(data);
  setIsLoading(false);
};
```

**Fix:**

```typescript
// ✅ CORRECT: Guard against double submission
const handleSubmit = async () => {
  if (isLoading) return; // Early return if already loading
  setIsLoading(true);
  try {
    await authApi.signin(data);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Checklist for New Features

When adding API-driven features, ensure:

- [ ] API service is stateless (no loading/error state)
- [ ] Container/page component owns loading and error state
- [ ] Presentational components receive state via props
- [ ] Form inputs are disabled during loading
- [ ] Submit buttons show loading state
- [ ] Double submission is prevented
- [ ] Error messages are displayed to users
- [ ] Success actions (redirects, toasts) are handled in container

---

## PR Review Guidelines

During code review, check for:

1. **API Layer:**
   - ✅ No UI state management
   - ✅ Errors are thrown, not handled
   - ✅ Functions are pure and stateless

2. **Container Layer:**
   - ✅ Loading state exists and is managed
   - ✅ Error state exists and is handled
   - ✅ Double submission prevention is in place
   - ✅ Side effects (redirects, etc.) are handled here

3. **Presentational Layer:**
   - ✅ Props include `isLoading` and `error`
   - ✅ Inputs are disabled when loading
   - ✅ Loading indicators are shown
   - ✅ No direct API calls

---

## Migration Guide

For existing components that violate this pattern:

1. **Extract API calls from presentational components**
   - Move API calls to parent/container components
   - Pass handlers as props

2. **Remove state from API services**
   - Remove any loading/toast/UI logic
   - Keep only network logic

3. **Add loading guards**
   - Add `if (isLoading) return;` checks
   - Disable buttons and inputs

4. **Add error handling**
   - Use try-catch in container
   - Pass error to presentational component

---

## Enforcement

- All new code must follow this pattern
- PRs violating this pattern will be rejected
- Use `useApiRequest` hook when possible
- Document exceptions if absolutely necessary

---

## Examples

See the following reference implementations:

- Login flow: `packages/web/src/app/(auth)/login/page.tsx`
- Guest session: `packages/web/src/components/auth/GuestLoginForm.tsx`
- Signup flow: `packages/web/src/app/(auth)/signup/page.tsx`

---

## Summary

**The Golden Rule:**

> API services are stateless.  
> Containers own state.  
> Presentational components reflect state.

This pattern ensures predictable UX, prevents race conditions, and keeps your codebase maintainable.
