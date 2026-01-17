# PR Review Checklist - Loading State Pattern

Use this checklist when reviewing pull requests that include API-driven features or form submissions.

## ✅ API / Service Layer Review

**File Locations:** `packages/web/src/lib/api.ts`, `packages/web/src/lib/*Api.ts`

- [ ] **No UI State Management**
  - API functions do not use `useState`, `useReducer`, or any React state hooks
  - No loading indicators, toasts, or modals are triggered from API services
  - No error state is stored in the service layer

- [ ] **Pure Functions**
  - API functions are stateless and side-effect free
  - Functions only handle network logic (fetch, error handling)
  - No global state mutations

- [ ] **Error Propagation**
  - Errors are thrown (not silently caught and logged)
  - Error messages are descriptive and useful
  - Errors are typed (using ApiRequestError or similar)

- [ ] **Return Types**
  - Functions return typed promises (`Promise<T>`)
  - Response types are documented with interfaces
  - No undefined/null returns without clear documentation

**Example of CORRECT API service:**
```typescript
// ✅ GOOD
export const authApi = {
  signin: (data: SigninData) => post<SigninResponse>('/api/auth/signin', data)
};
```

**Example of INCORRECT API service:**
```typescript
// ❌ BAD
export const authApi = {
  signin: async (data: SigninData) => {
    setLoading(true); // ❌ NO! UI state in service
    const result = await post('/api/auth/signin', data);
    toast.success('Logged in!'); // ❌ NO! UI feedback in service
    return result;
  }
};
```

---

## ✅ Container / Page Layer Review

**File Locations:** `packages/web/src/app/*/page.tsx`, `packages/web/src/containers/*`

- [ ] **State Ownership**
  - Component owns loading state (`isLoading`, `loading`, etc.)
  - Component owns error state (`error`, `errorMessage`, etc.)
  - Uses `useState` directly OR `useApiRequest` hook

- [ ] **Double Submission Prevention**
  - Check for `if (isLoading) return;` guard in handlers
  - OR button is disabled when loading
  - No way for users to trigger duplicate requests

- [ ] **API Call Management**
  - API calls are wrapped in try-catch blocks
  - Loading state is set before and after API call
  - Error handling is present

- [ ] **Side Effect Handling**
  - Redirects are handled in container (not in API service)
  - Auth state updates are handled in container
  - Success messages/toasts are triggered from container

- [ ] **Props to Children**
  - Loading and error state are passed to presentational components
  - Event handlers are passed down (not defined in presentational components)

**Example of CORRECT container:**
```typescript
// ✅ GOOD
export default function LoginPage() {
  const { execute, isLoading, error } = useApiRequest(
    authApi.signin,
    { onSuccess: () => router.push('/dashboard') }
  );

  return <LoginForm onSubmit={execute} isLoading={isLoading} error={error} />;
}
```

**Example of INCORRECT container:**
```typescript
// ❌ BAD
export default function LoginPage() {
  // ❌ No loading state!
  const handleLogin = async (data) => {
    await authApi.signin(data); // No error handling, no loading state
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

---

## ✅ Presentational Component Review

**File Locations:** `packages/web/src/components/*`

- [ ] **Props Interface**
  - Component receives `isLoading` prop
  - Component receives `error` prop (or similar)
  - Component receives `onSubmit` or event handler prop

- [ ] **No Direct API Calls**
  - Component does not import from `@/lib/api`
  - Component does not make fetch/axios requests
  - Component only calls handlers passed via props

- [ ] **Loading State Reflection**
  - Form inputs are disabled when `isLoading` is true
  - Submit button is disabled when `isLoading` is true
  - Loading indicator is shown (spinner, text, etc.)

- [ ] **Error Display**
  - Error message is displayed when `error` prop is present
  - Error styling is appropriate (red text, alert, etc.)
  - Error is user-friendly

- [ ] **Form State Management**
  - Component CAN manage form field values (local state is OK)
  - Component CANNOT manage loading/error state
  - Validation can be done locally (basic checks)

**Example of CORRECT presentational component:**
```typescript
// ✅ GOOD
export function LoginForm({ onSubmit, isLoading, error }: Props) {
  const [formData, setFormData] = useState({ phone: '', password: '' });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData); // Just call the handler
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input disabled={isLoading} value={formData.phone} onChange={...} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Button disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </Button>
    </form>
  );
}
```

**Example of INCORRECT presentational component:**
```typescript
// ❌ BAD
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false); // ❌ Managing loading in form

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authApi.signin(formData); // ❌ Direct API call in form
    setIsLoading(false);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## ✅ Hook Usage Review

If using `useApiRequest` or `useAsync`:

- [ ] **Correct Hook Usage**
  - Hook is called at component top level
  - Hook receives correct API function
  - Success/error callbacks are provided if needed

- [ ] **Callback Implementation**
  - `onSuccess` handles side effects (navigation, updates)
  - `onError` handles additional error logic if needed
  - Callbacks don't mutate external state unsafely

**Example:**
```typescript
// ✅ GOOD
const { execute, isLoading, error } = useApiRequest(
  authApi.signin,
  {
    onSuccess: (data) => router.push('/dashboard'),
    onError: (err) => console.error('Failed:', err)
  }
);
```

---

## ✅ General Checklist

- [ ] **No Double Submission**
  - Test: Can user click submit button multiple times rapidly?
  - Expected: Only one request should be sent

- [ ] **Loading Feedback**
  - Test: Is there visual feedback during loading?
  - Expected: Button text changes, spinner shows, or inputs are disabled

- [ ] **Error Handling**
  - Test: What happens if API returns error?
  - Expected: User sees error message

- [ ] **Success Handling**
  - Test: What happens on successful request?
  - Expected: User is redirected or sees success message

- [ ] **Accessibility**
  - Loading states are announced to screen readers
  - Error messages are associated with form fields
  - Disabled inputs have appropriate ARIA attributes

---

## 🚫 Common Anti-Patterns to Reject

1. **API Service with UI State**
   ```typescript
   // ❌ REJECT THIS
   export const api = {
     login: async (data) => {
       toast.loading('Logging in...');
       const result = await post('/auth/login', data);
       toast.success('Success!');
       return result;
     }
   };
   ```

2. **Form Component with Direct API Calls**
   ```typescript
   // ❌ REJECT THIS
   export function LoginForm() {
     const [loading, setLoading] = useState(false);
     
     const handleSubmit = async () => {
       setLoading(true);
       await authApi.signin(data);
       setLoading(false);
     };
     
     return <form onSubmit={handleSubmit}>...</form>;
   }
   ```

3. **No Loading Guard**
   ```typescript
   // ❌ REJECT THIS
   const handleSubmit = async () => {
     setLoading(true); // User can click again before this runs!
     await api.call();
     setLoading(false);
   };
   ```

---

## 📝 Review Comments Template

**For API Service violations:**
```
❌ This API function manages UI state (loading/toasts), which violates the canonical pattern.

Please:
1. Remove all UI state management from this function
2. Keep only network logic
3. Move loading/error state to the container component

See: docs/frontend/LOADING_STATE_PATTERN.md
```

**For missing loading state:**
```
❌ This component makes API calls but doesn't manage loading state.

Please:
1. Add loading state using useState or useApiRequest hook
2. Pass loading state to presentational component
3. Add double-submission prevention

See: docs/frontend/LOADING_STATE_PATTERN.md
```

**For form with API calls:**
```
❌ This presentational component makes direct API calls, which violates separation of concerns.

Please:
1. Move API call to parent container component
2. Pass onSubmit handler via props
3. Receive and display loading/error state via props

See: docs/frontend/LOADING_STATE_PATTERN.md
```

---

## 📚 Resources

- [Loading State Pattern Documentation](./LOADING_STATE_PATTERN.md)
- [Reference Implementation: Login Flow](../../packages/web/src/app/(auth)/login/page.tsx)
- [Custom Hooks](../../packages/web/src/hooks/)

---

## Summary

**Before approving a PR, ensure:**

1. ✅ API services are stateless (no UI state)
2. ✅ Containers own loading/error state
3. ✅ Presentational components receive state via props
4. ✅ Double submissions are prevented
5. ✅ Loading indicators are shown
6. ✅ Errors are handled and displayed

**If any of these are violated, request changes and reference the pattern documentation.**
