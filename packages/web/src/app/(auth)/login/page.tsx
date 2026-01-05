/**
 * Login Page - Container Component
 * 
 * This component demonstrates the canonical loading-state ownership pattern.
 * It is a CONTAINER component that:
 * - Owns loading and error state
 * - Calls the API service (which is stateless)
 * - Handles side effects (redirects, auth state updates)
 * - Passes state down to presentational components
 * - Prevents double submissions
 */

'use client';

import { useRouter } from 'next/navigation';
import { LoginForm, type LoginFormData } from '@/components/auth/LoginForm';
import { authApi } from '@/lib/api';
import { useApiRequest } from '@/hooks';

/**
 * LoginPage - Container component that owns state and handles API calls
 * 
 * This component follows the canonical pattern:
 * - Uses useApiRequest hook to manage loading/error state
 * - Calls stateless API service
 * - Handles side effects (navigation)
 * - Passes state to presentational component
 */
export default function LoginPage() {
  const router = useRouter();

  // ✅ Container owns loading/error state via custom hook
  const { execute: handleLogin, isLoading, error } = useApiRequest(
    authApi.signin,
    {
      // ✅ Handle side effects here (navigation)
      onSuccess: (result) => {
        console.log('Login successful:', result);
        router.push('/'); // Redirect to dashboard/home
      },
      onError: (err) => {
        console.error('Login failed:', err);
        // Error is already captured in the hook's error state
      },
    }
  );

  // ✅ Handler that calls the API (no state management here, it's in the hook)
  const onSubmit = async (data: LoginFormData) => {
    try {
      await handleLogin(data);
    } catch (err) {
      // Error is already handled by the hook
      // This catch is optional, for any additional handling
    }
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  // ✅ Pass state down to presentational component
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <LoginForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        error={error}
        onSignupClick={handleSignupClick}
      />
    </div>
  );
}
