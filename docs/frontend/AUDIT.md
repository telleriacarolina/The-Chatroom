# Loading State Pattern - Codebase Audit

This document tracks the audit of existing components for compliance with the canonical loading-state ownership pattern.

**Last Updated:** 2026-01-04

## Audit Status

- ✅ **API Layer** - Compliant
- ⚠️ **Components** - Partial compliance (see details below)
- 🚧 **Forms** - Needs review

---

## API / Service Layer

### ✅ `packages/web/src/lib/api.ts`

**Status:** COMPLIANT

**Notes:**
- All API functions are stateless
- No UI state management
- Errors are properly thrown
- Functions return typed data

**Example:**
```typescript
export const authApi = {
  signin: (data) => post<SigninResponse>('/api/auth/signin', data),
  // All functions follow this pattern
};
```

---

## Container / Page Components

### ✅ `packages/web/src/app/(auth)/login/page.tsx`

**Status:** COMPLIANT (Reference Implementation)

**Notes:**
- Uses `useApiRequest` hook
- Owns loading and error state
- Handles side effects (navigation)
- Passes state to presentational component
- Prevents double submission

---

## Presentational Components

### ✅ `packages/web/src/components/auth/LoginForm.tsx`

**Status:** COMPLIANT (Reference Implementation)

**Notes:**
- Receives loading/error state via props
- Does not make API calls directly
- Disables inputs during loading
- Shows loading indicators
- Displays error messages

### ⚠️ `packages/web/src/components/chat/Block.tsx`

**Status:** PARTIALLY COMPLIANT

**Current Pattern:**
- ✅ Does not make API calls (currently uses mock data)
- ✅ Manages local UI state (username, selected language, etc.)
- ⚠️ When API integration is added, will need loading state management

**Recommendations:**
1. When integrating with API (creating guest sessions, joining lounges):
   - Split into container and presentational components
   - Container should own loading/error state
   - Use `useApiRequest` hook for API calls
2. Current implementation is acceptable for static UI
3. Update when backend integration is added

**Example Refactor (when API is integrated):**
```typescript
// Container: packages/web/src/app/chat/page.tsx
export default function ChatPage() {
  const { execute: createGuest, isLoading, error } = useApiRequest(
    authApi.createGuest
  );

  return <Block onCreateGuest={createGuest} isLoading={isLoading} error={error} />;
}

// Presentational: packages/web/src/components/chat/Block.tsx
export function Block({ onCreateGuest, isLoading, error }: Props) {
  // Render UI and call onCreateGuest when user submits
}
```

### ⚠️ Other Components

**Status:** NOT YET AUDITED

Components that need review when implementing API integration:
- Any form components
- Any components that will fetch data
- Any components that will submit data

---

## Custom Hooks

### ✅ `packages/web/src/hooks/useApiRequest.ts`

**Status:** COMPLIANT

**Features:**
- Manages loading, error, and data state
- Prevents double submission
- Provides success/error callbacks
- Handles mounted/unmounted state

### ✅ `packages/web/src/hooks/useAsync.ts`

**Status:** COMPLIANT

**Features:**
- General-purpose async operation management
- Similar to useApiRequest for non-API operations

---

## Action Items

### High Priority
- [ ] None - reference implementation complete

### Medium Priority
- [ ] Refactor `Block.tsx` when backend integration is added
- [ ] Review any new form components before merge
- [ ] Add integration tests for login flow

### Low Priority
- [ ] Consider ESLint rules to enforce pattern
- [ ] Add automated checks in CI/CD

---

## Pattern Violations

### None Detected

Currently, there are no pattern violations in the codebase. The API layer is stateless, and the reference implementation demonstrates the correct pattern.

---

## Future Components

When implementing new features with API calls:

1. **Always use the reference implementation as a guide**
   - Container: `packages/web/src/app/(auth)/login/page.tsx`
   - Presentational: `packages/web/src/components/auth/LoginForm.tsx`

2. **Use the custom hooks**
   - `useApiRequest` for API calls
   - `useAsync` for other async operations

3. **Follow the checklist**
   - See: `docs/frontend/LOADING_STATE_PATTERN.md`

---

## Review Notes

**Pre-existing TypeScript Issues:**
- Some components use button/alert variants not in type definitions
- These are unrelated to the loading-state pattern
- Should be fixed separately

**Files with TypeScript errors (pre-existing):**
- `src/components/ThemeToggle.tsx` - Button size prop mismatch
- `src/components/chat/Block.tsx` - Button variant prop mismatch

These do not affect the loading-state pattern implementation.

---

## Conclusion

The codebase is **ready for the canonical loading-state pattern**:

- ✅ API layer is stateless
- ✅ Reference implementation is complete
- ✅ Documentation is comprehensive
- ✅ Custom hooks are available
- ✅ PR review checklist is in place

**Next Steps:**
1. Test the login flow implementation
2. Enforce pattern in code reviews
3. Update components as API integration is added
