'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

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
