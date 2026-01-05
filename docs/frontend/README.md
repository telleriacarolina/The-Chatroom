# Frontend Architecture Documentation

This directory contains documentation for The Chatroom frontend architecture and patterns.

## 📚 Documentation

### [Loading State Pattern](./LOADING_STATE_PATTERN.md)
Comprehensive guide to the canonical loading-state ownership model for frontend API calls.

**Key Topics:**
- Three-layer architecture (API/Service, Container, Presentational)
- Preventing double submissions
- Managing loading and error states
- Reusable hooks (`useApiRequest`, `useAsync`)
- Anti-patterns to avoid
- PR review guidelines

## 🎯 Quick Reference

### The Golden Rule

> **API services are stateless.**  
> **Containers own state.**  
> **Presentational components reflect state.**

### Three Layers

1. **API/Service Layer** (Stateless)
   - Location: `packages/web/src/lib/api.ts`
   - Responsibility: Network logic only
   - Rules: No UI state, throw errors, return data

2. **Container/Page Layer** (State Owner)
   - Location: `packages/web/src/app/*/page.tsx`
   - Responsibility: Owns loading/error state, handles side effects
   - Rules: Use hooks, prevent double submission, handle navigation

3. **Presentational Layer** (Props Receiver)
   - Location: `packages/web/src/components/*`
   - Responsibility: Display UI based on props
   - Rules: Receive state via props, disable inputs when loading, no API calls

## 📖 Reference Implementations

### Login Flow (Complete Example)

**Container Component (State Owner):**
```
packages/web/src/app/(auth)/login/page.tsx
```
- Uses `useApiRequest` hook
- Owns loading and error state
- Handles navigation on success

**Presentational Component:**
```
packages/web/src/components/auth/LoginForm.tsx
```
- Receives `isLoading`, `error`, and `onSubmit` props
- Disables inputs during loading
- Shows loading indicators
- Displays error messages

**API Service (Stateless):**
```
packages/web/src/lib/api.ts
```
- `authApi.signin()` - Pure function, no state
- Returns promise with data or throws error

### Custom Hooks

**useApiRequest:**
```
packages/web/src/hooks/useApiRequest.ts
```
- Manages loading, error, and data state
- Prevents double submissions
- Provides success/error callbacks

**useAsync:**
```
packages/web/src/hooks/useAsync.ts
```
- General-purpose async operation management
- Similar to useApiRequest for non-API operations

## 🔍 Pattern Checklist

When implementing a new feature with API calls:

- [ ] API service is stateless (no UI state)
- [ ] Container component uses `useApiRequest` or manages state with `useState`
- [ ] Presentational component receives `isLoading` and `error` props
- [ ] Form inputs are disabled during loading
- [ ] Submit button shows loading state
- [ ] Double submission is prevented
- [ ] Error messages are displayed
- [ ] Success actions (redirects) are handled in container

## 🛠️ Usage Example

### Basic Pattern

```typescript
// 1. Container Component (owns state)
export default function MyPage() {
  const { execute, isLoading, error } = useApiRequest(
    myApi.fetchData,
    {
      onSuccess: (data) => console.log('Success!', data),
      onError: (err) => console.error('Failed!', err)
    }
  );

  return <MyForm onSubmit={execute} isLoading={isLoading} error={error} />;
}

// 2. Presentational Component (receives state)
export function MyForm({ onSubmit, isLoading, error }: Props) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input disabled={isLoading} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Button disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </Button>
    </form>
  );
}
```

## 📝 Notes

- Always use the canonical pattern for consistency
- Review existing implementations for examples
- Document any exceptions with clear reasoning
- PRs that violate the pattern will be rejected

## 🔗 Related Documentation

- [Complete Codebase Reference](../COMPLETE_CODEBASE.md)
- [Update Scenarios](../update-scenarios/README.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
