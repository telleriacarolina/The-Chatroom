import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import Block from "@/components/chat/Block";

export default function BlockWithAuth() {
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);

  const handleAuthSuccess = () => {
    // Close modal and potentially refresh/redirect
    setShowAuthModal(null);
    // In a real app, you might want to reload user state or redirect
    console.log("Authentication successful!");
  };

  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 z-10"
            onClick={() => setShowAuthModal(null)}
          >
            <X className="w-5 h-5" />
          </Button>
          {showAuthModal === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={() => setShowAuthModal('signup')}
            />
          ) : (
            <SignupForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setShowAuthModal('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return <Block onShowLogin={() => setShowAuthModal('login')} onShowSignup={() => setShowAuthModal('signup')} />;
}
