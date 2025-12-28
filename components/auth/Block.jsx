import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Flame, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Block() {
  const [screen, setScreen] = useState('entry');
  const [showPassword, setShowPassword] = useState(false);
  const [stayOnline, setStayOnline] = useState(true);
  const [isFirstSignIn, setIsFirstSignIn] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('');

  // Form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in -> call API
  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password, staySignedIn: stayOnline })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign in failed');

      if (defaultPassword && password === defaultPassword) {
        setIsFirstSignIn(true);
        setScreen('password-change');
      } else {
        setScreen('entry');
        alert('Sign in successful!');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign up -> call API and show success (server sends SMS)
  const handleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const generatedPassword = `${firstName.slice(0, 3)}${birthYear}${lastName.slice(0, 3)}!`;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, firstName, lastName, birthYear })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign up failed');

      setDefaultPassword(generatedPassword);
      setScreen('signup-success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Guest session -> call API
  const handleGuest = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageCategory: '_18PLUS' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Guest login failed');
      alert('Guest session started. Temporary token: ' + (data?.tempSessionToken || '(none)') + '\nRestrictions: No DMs, No RED content, No marketplace.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Change password (calls API)
  const handleChangePassword = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, currentPassword: password || defaultPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Change password failed');
      alert('Password changed successfully! Please sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setDefaultPassword('');
      setIsFirstSignIn(false);
      setScreen('entry');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeepPassword = () => {
    alert('Default password kept. You can change it anytime from account settings.');
    setScreen('entry');
  };

  if (screen === 'entry') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#700303" }}>
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <h1 
              className="text-4xl md:text-5xl font-bold tracking-[0.3em] md:tracking-[0.5em]" 
              style={{ color: "#ffffff" }}
            >
              THE CHATROOM
            </h1>
            <div className="flex justify-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                <MessageSquare 
                  className="w-24 h-24 md:w-32 md:h-32 stroke-[3px]" 
                  style={{ color: "transparent", fill: "transparent", stroke: "#ffffff" }} 
                />
                <Flame 
                  className="w-12 h-12 md:w-16 md:h-16 absolute" 
                  style={{ color: "#ffc0cb", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} 
                />
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => setScreen('signin')}
              className="w-full h-12 text-base rounded-full border-2 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#ffc0cb", color: "#1d0207", borderColor: "#1d0207" }}
            >
              Sign In
            </Button>
            <Button
              onClick={() => setScreen('signup')}
              className="w-full h-12 text-base rounded-full border-2 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#ffc0cb", color: "#1d0207", borderColor: "#1d0207" }}
            >
              Sign Up
            </Button>
            <Button
              onClick={handleGuest}
              className="w-full h-12 text-base rounded-full border-2 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#ffc0cb", color: "#1d0207", borderColor: "#1d0207" }}
            >
              Guest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'signin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#700303" }}>
        <Card className="w-full max-w-md rounded-3xl border-2" style={{ borderColor: "#1d0207" }}>
          <CardHeader>
            <Button variant="ghost" onClick={() => setScreen('entry')} className="w-fit mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Enter your phone number and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="stay-online" checked={stayOnline} onCheckedChange={setStayOnline} />
              <Label htmlFor="stay-online" className="text-sm cursor-pointer">Stay online</Label>
            </div>
            <Alert className="rounded-xl">
              <AlertDescription className="text-xs">
                {stayOnline ? "You'll stay online for 30 days and appear as 'Away' after 5 minutes of inactivity." : "You'll be signed out after 24 hours and appear as 'Offline' after 5 minutes of inactivity."}
              </AlertDescription>
            </Alert>
            <Button onClick={handleSignIn} className="w-full rounded-xl" style={{ backgroundColor: "#1d0207" }}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#700303" }}>
        <Card className="w-full max-w-md rounded-3xl border-2" style={{ borderColor: "#1d0207" }}>
          <CardHeader>
            <Button variant="ghost" onClick={() => setScreen('entry')} className="w-fit mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Create your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-phone">Phone Number</Label>
              <Input id="signup-phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth-year">Birth Year</Label>
              <Input id="birth-year" type="number" placeholder="1990" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="rounded-xl" />
            </div>
            <Alert className="rounded-xl">
              <AlertDescription className="text-xs">You must be 18 or older to create an account.</AlertDescription>
            </Alert>
            <Button onClick={handleSignUp} className="w-full rounded-xl" style={{ backgroundColor: "#1d0207" }}>Create Account</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === 'signup-success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#700303" }}>
        <Card className="w-full max-w-md rounded-3xl border-2" style={{ borderColor: "#1d0207" }}>
          <CardHeader>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
            <CardDescription>Your default password has been generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="rounded-xl" style={{ backgroundColor: "#ffc0cb", borderColor: "#1d0207" }}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Your Default Password:</p>
                  <p className="text-2xl font-mono font-bold" style={{ color: "#1d0207" }}>{defaultPassword}</p>
                  <p className="text-xs mt-2" style={{ color: "#1d0207" }}>This password has been sent to your phone via SMS.</p>
                </div>
              </AlertDescription>
            </Alert>
            <Alert className="rounded-xl">
              <AlertDescription className="text-xs">You can always change it later from your account settings</AlertDescription>
            </Alert>
            <Button onClick={() => setScreen('entry')} className="w-full rounded-xl" style={{ backgroundColor: "#1d0207" }}>Continue to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === 'password-change') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#700303" }}>
        <Card className="w-full max-w-md rounded-3xl border-2" style={{ borderColor: "#1d0207" }}>
          <CardHeader>
            <CardTitle className="text-2xl">First Sign In</CardTitle>
            <CardDescription>You're using your default password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="rounded-xl" style={{ backgroundColor: "#ffc0cb", borderColor: "#1d0207" }}>
              <AlertDescription>
                <p className="font-semibold" style={{ color: "#1d0207" }}>Your Default Password:</p>
                <p className="text-xl font-mono font-bold mt-1" style={{ color: "#1d0207" }}>{defaultPassword}</p>
              </AlertDescription>
            </Alert>
            <Alert className="rounded-xl">
              <AlertDescription className="text-xs">You can always change it later from your account settings</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password (optional)</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl" placeholder="Confirm new password" />
            </div>
            <div className="space-y-2">
              <Button onClick={handleChangePassword} className="w-full rounded-xl" style={{ backgroundColor: "#1d0207" }}>Change Password Now</Button>
              <Button onClick={handleKeepPassword} variant="outline" className="w-full rounded-xl border-2" style={{ borderColor: "#1d0207" }}>Keep Default Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
