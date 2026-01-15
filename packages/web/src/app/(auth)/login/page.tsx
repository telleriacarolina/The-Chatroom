/**
 * Login Page
 * Simple wrapper for the LoginForm component
 */

'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    console.log('Login successful!');
    router.push('/'); // Redirect to home
  };

  const handleSwitchToSignup = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-burgundy p-4 sm:p-6">
      <LoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  );
}
