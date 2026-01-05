import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

export default function AuthDemo() {
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginSuccess = () => {
    console.log("Login successful!");
    // In a real app, redirect to the chat or home page
    // NOTE: This alert is for demo purposes only. In production, replace with proper navigation/state-driven success UI.
    alert("Login successful! JWT tokens stored in cookies.");
  };

  const handleSignupSuccess = () => {
    console.log("Signup successful!");
    // In a real app, you might show a message or redirect
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {showLogin ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setShowLogin(false)}
        />
      ) : (
        <SignupForm
          onSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
}
