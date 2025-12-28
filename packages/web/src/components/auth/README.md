# Authentication Components

This directory contains the authentication forms for The Chatroom application.

## Components

### LoginForm

A comprehensive login form that handles user authentication with phone number and password.

**Features:**
- Phone number validation
- Password visibility toggle
- "Stay signed in" option (extends session to 30 days)
- Error handling with user-friendly messages
- Loading states during API calls
- JWT token handling via httpOnly cookies

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;        // Callback when login succeeds
  onSwitchToSignup?: () => void; // Callback to switch to signup form
}
```

**Usage:**
```tsx
import { LoginForm } from '@/components/auth';

function AuthPage() {
  const handleLoginSuccess = () => {
    // Redirect to dashboard or chat
    router.push('/chat');
  };

  return (
    <LoginForm
      onSuccess={handleLoginSuccess}
      onSwitchToSignup={() => setShowSignup(true)}
    />
  );
}
```

### SignupForm

A registration form that creates new user accounts with phone number verification.

**Features:**
- Phone number validation (10-15 digits)
- Optional first name, last name, and birth year fields
- Age validation (minimum 13 years old)
- Automatic password generation sent via SMS
- Success state showing SMS confirmation
- Error handling for duplicate phone numbers

**Props:**
```typescript
interface SignupFormProps {
  onSuccess?: () => void;       // Callback when signup succeeds
  onSwitchToLogin?: () => void; // Callback to switch to login form
}
```

**Usage:**
```tsx
import { SignupForm } from '@/components/auth';

function AuthPage() {
  const handleSignupSuccess = () => {
    // Show success message or switch to login
    setShowLogin(true);
  };

  return (
    <SignupForm
      onSuccess={handleSignupSuccess}
      onSwitchToLogin={() => setShowLogin(true)}
    />
  );
}
```

## API Integration

Both forms use the API client from `@/lib/api.ts` which handles:
- HTTP requests to the backend API server
- Automatic credential inclusion for cookies
- Error handling and response parsing
- TypeScript type safety

### Backend Endpoints

The forms connect to these API endpoints:

- **POST /api/auth/signup** - Register a new user
  ```json
  {
    "phoneNumber": "5551234567",
    "firstName": "John",
    "lastName": "Doe",
    "birthYear": "1990"
  }
  ```

- **POST /api/auth/signin** - Authenticate a user
  ```json
  {
    "phoneNumber": "5551234567",
    "password": "userPassword123",
    "staySignedIn": true
  }
  ```

### JWT Token Handling

The backend sets JWT tokens as httpOnly cookies:
- `accessToken` - Short-lived (15 minutes) for API requests
- `refreshToken` - Long-lived (30 days) for token refresh

The frontend doesn't directly access these tokens; they're automatically included in requests via `credentials: 'include'`.

## Phone Validation

Phone validation utilities are available in `@/lib/phoneValidation.ts`:

```typescript
import { validatePhoneNumber, formatPhoneNumber, normalizePhoneNumber } from '@/lib/phoneValidation';

// Validate a phone number
const result = validatePhoneNumber("+1 (555) 123-4567");
// { isValid: true }

// Format for display
const formatted = formatPhoneNumber("5551234567");
// "(555) 123-4567"

// Normalize for API
const normalized = normalizePhoneNumber("+1 (555) 123-4567");
// "15551234567"
```

## Styling

The forms use Tailwind CSS and shadcn/ui components:
- Button component from `@/components/ui/button`
- Input component from `@/components/ui/input`
- Card components from `@/components/ui/card`
- Label component from `@/components/ui/label`
- Checkbox component from `@/components/ui/checkbox`
- Icons from `lucide-react`

## Environment Variables

Set the API server URL in your `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If not set, it defaults to `http://localhost:3001`.

## Testing

A demo page is available at `/auth-demo` to test both forms:

```tsx
// packages/web/src/pages/auth-demo.tsx
import AuthDemo from '@/pages/auth-demo';
```

To test locally:
1. Start the API server: `npm run dev:api`
2. Start the Next.js server: `npm run dev:web`
3. Visit http://localhost:3000/auth-demo

## Error Handling

Both forms handle common errors:
- Invalid phone number format
- Missing required fields
- Server errors (500)
- Duplicate phone numbers (409)
- Invalid credentials (401)
- Network errors

Error messages are displayed in a styled alert below the form fields.

## Accessibility

- All inputs have proper labels
- Form can be submitted with Enter key
- Loading states disable form elements
- Error messages are clearly visible
- Keyboard navigation supported

## Future Enhancements

Potential improvements:
- [ ] Add phone number formatting as user types
- [ ] Add password strength indicator
- [ ] Add "Forgot Password" flow
- [ ] Add reCAPTCHA for bot protection
- [ ] Add OAuth/social login options
- [ ] Add phone number verification via SMS code
- [ ] Add password requirements indicator
