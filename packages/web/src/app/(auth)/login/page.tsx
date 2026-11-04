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
import LoginForm from '@/components/auth/LoginForm';

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

  const handleSignupClick = () => {
    router.push('/signup');
  };

  // ✅ Pass state down to presentational component
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <LoginForm
        onSuccess={() => router.push('/')}
        onSwitchToSignup={handleSignupClick}
      />
    </div>
  );
}
