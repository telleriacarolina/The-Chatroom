import { useState, useEffect } from "react";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signup } from "@/lib/api";
import { validatePhoneNumber } from "@/lib/phoneValidation";

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    if (!success) return;

    const timeoutId = setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [success]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    // Clear error when user types
    if (error) setError("");
  };

  const handleBirthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setBirthYear(value);
      if (error) setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || "Invalid phone number");
      return;
    }

    // Validate birth year (optional but if provided, should be valid)
    if (birthYear && birthYear.length > 0) {
      const year = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        setError("Please enter a valid birth year");
        return;
      }
      // Check if user is at least 13 years old
      if (currentYear - year < 13) {
        setError("You must be at least 13 years old to sign up");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await signup({
        phoneNumber,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        birthYear: birthYear || undefined,
      });

      if (response.error) {
        setError(response.error);
      } else {
        // Success! Show SMS message
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Account Created!</CardTitle>
          <CardDescription>
            Your default password has been generated. If SMS is configured, it will be sent to your phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-center">
              📱 <strong>If SMS is enabled, check your text messages</strong> for your temporary password.
              You can change it after signing in.
            </p>
          </div>
          
          {onSwitchToLogin && (
            <Button
              onClick={onSwitchToLogin}
              className="w-full"
            >
              Go to Sign In
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Signup form
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <UserPlus className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Create your account and receive a password via SMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isLoading}
              required
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              Your password will be sent to this number via SMS
            </p>
          </div>

          {/* First Name Input */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name (Optional)</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              autoComplete="given-name"
              maxLength={50}
            />
          </div>

          {/* Last Name Input */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name (Optional)</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              autoComplete="family-name"
              maxLength={50}
            />
          </div>

          {/* Birth Year Input */}
          <div className="space-y-2">
            <Label htmlFor="birthYear">Birth Year (Optional)</Label>
            <Input
              id="birthYear"
              type="text"
              placeholder="1990"
              value={birthYear}
              onChange={handleBirthYearChange}
              disabled={isLoading}
              autoComplete="bday-year"
              maxLength={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional - Must be at least 13 years old if provided
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </>
            )}
          </Button>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
