/**
 * LoginForm - Presentational Component
 * 
 * This component demonstrates the canonical loading-state ownership pattern.
 * It is a PRESENTATIONAL component that:
 * - Receives loading/error state as props
 * - Does NOT make API calls directly
 * - Does NOT manage loading/error state internally
 * - Disables inputs during loading
 * - Shows loading indicators
 */

'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export interface LoginFormData {
  phoneNumber: string;
  password: string;
  staySignedIn?: boolean;
}

export interface LoginFormProps {
  /**
   * Callback invoked when the form is submitted
   * Container component owns the actual API call
   */
  onSubmit: (data: LoginFormData) => void | Promise<void>;
  
  /**
   * Loading state managed by container component
   */
  isLoading: boolean;
  
  /**
   * Error message managed by container component
   */
  error: string | null;
  
  /**
   * Optional: redirect to signup page
   */
  onSignupClick?: () => void;
}

/**
 * LoginForm - Presentational component for user login
 * 
 * This component follows the canonical pattern:
 * - State is received via props from container
 * - No direct API calls
 * - Inputs are disabled during loading
 * - Shows loading indicators
 */
export function LoginForm({ onSubmit, isLoading, error, onSignupClick }: LoginFormProps) {
  // Only manage FORM data state, not loading/error
  const [formData, setFormData] = useState<LoginFormData>({
    phoneNumber: '',
    password: '',
    staySignedIn: false,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.phoneNumber || !formData.password) {
      return;
    }
    
    // Call the handler provided by container
    // The container owns the loading state and API call
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error display - state comes from props */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              disabled={isLoading} // ✅ Disabled during loading
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={isLoading} // ✅ Disabled during loading
              required
            />
          </div>

          {/* Stay Signed In Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              id="staySignedIn"
              type="checkbox"
              checked={formData.staySignedIn}
              onChange={handleInputChange('staySignedIn')}
              disabled={isLoading} // ✅ Disabled during loading
              className="h-4 w-4"
            />
            <Label htmlFor="staySignedIn" className="text-sm">
              Stay signed in
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.phoneNumber || !formData.password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'} {/* ✅ Loading indicator */}
          </Button>

          {/* Signup Link */}
          {onSignupClick && (
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSignupClick}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
