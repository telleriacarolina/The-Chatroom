"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionStatus from "@/components/ConnectionStatus";
import { createGuestSession } from "@/lib/api";
import { setAuthToken } from "@/lib/socket";
import { Crown, Eye, UserCircle, Users, MessageSquare, ChevronRight, ChevronLeft, Clock, DollarSign, ShoppingCart, Zap, Package, Video, Calendar, LogIn, UserPlus, Loader2 } from "lucide-react";

interface BlockProps {
  onShowLogin?: () => void;
  onShowSignup?: () => void;
}

export default function Block({ onShowLogin, onShowSignup }: BlockProps) {
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLounge, setSelectedLounge] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [isLoadingLounges, setIsLoadingLounges] = useState(false);

  const existingUsernames = ["Sarah M", "John D", "Carlos R", "Maria L", "Guest_1234", "Guest_5678"];

  const decodeJwtPayload = (token: string | null): Record<string, unknown> | null => {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const isJwtExpired = (token: string | null): boolean => {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  };

  const isTempSessionExpired = (value?: string | null): boolean => {
    if (!value) return true;
    const expiresAt = new Date(value);
    if (Number.isNaN(expiresAt.getTime())) return true;
    return expiresAt.getTime() <= Date.now();
  };

  const clearGuestAuthState = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("guestToken");
    localStorage.removeItem("guestAccessToken");
    localStorage.removeItem("guestTempSessionToken");
    localStorage.removeItem("guestSessionExpiresAt");
    localStorage.removeItem("guestUsername");
    setAuthToken(null);
  };

  const setGuestToken = (token: string | null) => {
    if (typeof window === "undefined") return;

    if (token) {
      localStorage.setItem("guestToken", token);
      const isJwtToken = token.includes('.') && token.split('.').length === 3;
      if (isJwtToken) {
        localStorage.setItem("guestAccessToken", token);
      } else {
        localStorage.setItem("guestTempSessionToken", token);
      }
    } else {
      clearGuestAuthState();
    }
    setAuthToken(token);
  };

  const getValidGuestToken = () => {
    if (typeof window === "undefined") return null;

    const accessToken = localStorage.getItem("guestAccessToken");
    const tempToken = localStorage.getItem("guestTempSessionToken");
    const expiresAt = localStorage.getItem("guestSessionExpiresAt");

    if (accessToken && !isJwtExpired(accessToken)) {
      return accessToken;
    }

    if (tempToken && !isTempSessionExpired(expiresAt)) {
      return tempToken;
    }

    if ((accessToken || tempToken) && (!accessToken || isJwtExpired(accessToken)) && (!tempToken || isTempSessionExpired(expiresAt))) {
      clearGuestAuthState();
    }

    return null;
  };

  const persistGuestSession = (guestSession: {
    accessToken?: string | null;
    tempSessionToken?: string | null;
    expiresAt?: string | Date | null;
    username?: string | null;
  }) => {
    if (typeof window === "undefined") return;

    const accessToken = guestSession.accessToken ?? localStorage.getItem("guestAccessToken");
    const tempSessionToken = guestSession.tempSessionToken ?? localStorage.getItem("guestTempSessionToken");
    const nextExpiresAt = guestSession.expiresAt ? new Date(guestSession.expiresAt).toISOString() : localStorage.getItem("guestSessionExpiresAt");

    if (accessToken) {
      localStorage.setItem("guestAccessToken", accessToken);
    } else {
      localStorage.removeItem("guestAccessToken");
    }

    if (tempSessionToken) {
      localStorage.setItem("guestTempSessionToken", tempSessionToken);
    } else {
      localStorage.removeItem("guestTempSessionToken");
    }

    if (nextExpiresAt) {
      localStorage.setItem("guestSessionExpiresAt", nextExpiresAt);
    } else {
      localStorage.removeItem("guestSessionExpiresAt");
    }

    if (guestSession.username) {
      localStorage.setItem("guestUsername", guestSession.username);
    } else {
      localStorage.removeItem("guestUsername");
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('guestUsername');
      const restoredToken = getValidGuestToken();

      if (storedUsername && restoredToken) {
        setTempUsername(storedUsername);
        setGuestToken(restoredToken);
      } else if (storedUsername) {
        localStorage.removeItem('guestUsername');
        clearGuestAuthState();
      }
    }
  }, []);

  const languageCategories = {
    english: {
      name: "English",
      flag: "🇬🇧",
      lounges: [
        { id: "en-all", name: "All Users Lounge", members: 342, isAll: true },
        { id: "en-us", name: "🇺🇸 United States", members: 156 },
        { id: "en-uk", name: "🇬🇧 United Kingdom", members: 89 },
        { id: "en-ca", name: "🇨🇦 Canada", members: 45 },
        { id: "en-au", name: "🇦🇺 Australia", members: 34 },
        { id: "en-nz", name: "🇳🇿 New Zealand", members: 18 },
        { id: "en-jm", name: "🇯🇲 Jamaica", members: 12 },
        { id: "en-tt", name: "🇹🇹 Trinidad & Tobago", members: 9 },
        { id: "en-bb", name: "🇧🇧 Barbados", members: 7 },
        { id: "en-bs", name: "🇧🇸 Bahamas", members: 6 },
      ],
    },
    spanish: {
      name: "Español",
      flag: "🇪🇸",
      lounges: [
        { id: "es-all", name: "All Users Lounge", members: 198, isAll: true },
        { id: "es-es", name: "🇪🇸 España", members: 67 },
        { id: "es-mx", name: "🇲🇽 México", members: 54 },
        { id: "es-ar", name: "🇦🇷 Argentina", members: 32 },
        { id: "es-co", name: "🇨🇴 Colombia", members: 28 },
        { id: "es-cl", name: "🇨🇱 Chile", members: 17 },
        { id: "es-cu", name: "🇨🇺 Cuba", members: 11 },
        { id: "es-do", name: "🇩🇴 República Dominicana", members: 10 },
        { id: "es-pr", name: "🇵🇷 Puerto Rico", members: 8 },
      ],
    },
    french: {
      name: "Français",
      flag: "🇫🇷",
      lounges: [
        { id: "fr-all", name: "All Users Lounge", members: 156, isAll: true },
        { id: "fr-fr", name: "🇫🇷 France", members: 78 },
        { id: "fr-ca", name: "🇨🇦 Canada", members: 34 },
        { id: "fr-be", name: "🇧🇪 Belgique", members: 23 },
        { id: "fr-ch", name: "🇨🇭 Suisse", members: 21 },
        { id: "fr-ht", name: "🇭🇹 Haïti", members: 9 },
        { id: "fr-gp", name: "🇬🇵 Guadeloupe", members: 6 },
        { id: "fr-mq", name: "🇲🇶 Martinique", members: 5 },
      ],
    },
    german: {
      name: "Deutsch",
      flag: "🇩🇪",
      lounges: [
        { id: "de-all", name: "All Users Lounge", members: 124, isAll: true },
        { id: "de-de", name: "🇩🇪 Deutschland", members: 67 },
        { id: "de-at", name: "🇦🇹 Österreich", members: 32 },
        { id: "de-ch", name: "🇨🇭 Schweiz", members: 25 },
      ],
    },
    japanese: {
      name: "日本語",
      flag: "🇯🇵",
      lounges: [
        { id: "ja-all", name: "All Users Lounge", members: 203, isAll: true },
        { id: "ja-jp", name: "🇯🇵 日本", members: 203 },
      ],
    },
    chinese: {
      name: "中文",
      flag: "🇨🇳",
      lounges: [
        { id: "zh-all", name: "All Users Lounge", members: 287, isAll: true },
        { id: "zh-cn", name: "🇨🇳 中国", members: 178 },
        { id: "zh-tw", name: "🇹🇼 台灣", members: 67 },
        { id: "zh-hk", name: "🇭🇰 香港", members: 42 },
      ],
    },
    portuguese: {
      name: "Português",
      flag: "🇵🇹",
      lounges: [
        { id: "pt-all", name: "All Users Lounge", members: 145, isAll: true },
        { id: "pt-br", name: "🇧🇷 Brasil", members: 98 },
        { id: "pt-pt", name: "🇵🇹 Portugal", members: 47 },
      ],
    },
    arabic: {
      name: "العربية",
      flag: "🇸🇦",
      lounges: [
        { id: "ar-all", name: "All Users Lounge", members: 167, isAll: true },
        { id: "ar-sa", name: "🇸🇦 السعودية", members: 56 },
        { id: "ar-eg", name: "🇪🇬 مصر", members: 45 },
        { id: "ar-ae", name: "🇦🇪 الإمارات", members: 34 },
        { id: "ar-ma", name: "🇲🇦 المغرب", members: 32 },
      ],
    },
  };

  const handleSetUsername = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("Please enter a username");
      return;
    }

    if (trimmedUsername.length < 4) {
      setError("Username must be at least 4 characters");
      return;
    }

    if (trimmedUsername.length > 10) {
      setError("Username must be no more than 10 characters");
      return;
    }

    if (existingUsernames.includes(trimmedUsername)) {
      setError("This username is already taken. Please choose another.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await createGuestSession("PLUS_18");
      const socketToken = response.data?.accessToken ?? response.data?.tempSessionToken;
      if (response.error || !socketToken) {
        throw new Error(response.error || "Guest session token was not returned");
      }

      persistGuestSession({
        accessToken: response.data?.accessToken ?? null,
        tempSessionToken: response.data?.tempSessionToken ?? null,
        expiresAt: response.data?.expiresAt ?? null,
        username: trimmedUsername,
      });
      setGuestToken(socketToken);
      setTempUsername(trimmedUsername);
      setUsername("");
    } catch (err) {
      setError("Failed to create guest session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start with username creation screen
  if (!tempUsername) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MessageSquare className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Enter The Chatroom</CardTitle>
            <CardDescription>
              You Know You Ready to Chit-Chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="username"
                placeholder="Enter your username (4-10 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetUsername()}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Username must be between 4 and 10 characters
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSetUsername} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Session...
                </>
              ) : (
                "Enter"
              )}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onShowLogin}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button variant="outline" className="flex-1" onClick={onShowSignup}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>

            <div className="mt-4 flex justify-center">
              <ConnectionStatus />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedLanguage) {
    return (
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">The Chatroom</h1>
            </div>
            <Badge variant="secondary" className="gap-2">
              <UserCircle className="w-4 h-4" />
              {tempUsername}
            </Badge>
            <ConnectionStatus />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTempUsername("");
              setSelectedLanguage(null);
              setSelectedLounge(null);
              localStorage.removeItem("guestUsername");
              setGuestToken(null);
            }}
          >
            Change Username
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose a Language Category</CardTitle>
            <CardDescription>
              Select a language to see all available lounges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLanguages ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="w-12 h-12 mb-2" />
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(languageCategories).map(([key, lang]) => (
                  <Card
                    key={key}
                    className="hover:border-primary transition-colors cursor-pointer"
                    onClick={() => setSelectedLanguage(key)}
                  >
                    <CardHeader>
                      <div className="text-4xl mb-2">{lang.flag}</div>
                      <CardTitle className="text-lg">{lang.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{lang.lounges[0].members} online</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {lang.lounges.length} lounges available
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Want More Features?
            </CardTitle>
            <CardDescription>
              Upgrade to unlock premium benefits and secure a permanent username
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary">
                <CardHeader>
                  <Crown className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-base">Creator Account</CardTitle>
                  <Badge variant="default" className="w-fit">
                    <Calendar className="w-3 h-3 mr-1" />
                    Yearly Subscription
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span className="font-medium text-primary">Instant access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <UserCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span className="font-medium text-primary">Permanent username</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <DollarSign className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Monetize content & interactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Video className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Live video features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Schedule appointments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Exchange shipping info safely</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-secondary">
                <CardHeader>
                  <Eye className="w-8 h-8 text-secondary mb-2" />
                  <CardTitle className="text-base">Viewer Account</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    <Calendar className="w-3 h-3 mr-1" />
                    Yearly Subscription
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-secondary" />
                      <span className="font-medium text-secondary">Instant access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <UserCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-secondary" />
                      <span className="font-medium text-secondary">Permanent username</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Video className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Live video access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Priority room entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShoppingCart className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Purchase creator content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Join private groups</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <UserCircle className="w-8 h-8 text-muted-foreground mb-2" />
                  <CardTitle className="text-base">Guest Access</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    Free
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Temporary username for your visit</span>
                    </li>
                    <li>• Free access to all lounges</li>
                    <li>• No login required</li>
                    <li>• Basic chat features</li>
                  </ul>
                  <div className="mt-3 p-2 bg-primary/10 rounded text-xs border border-primary">
                    <p className="font-medium text-primary mb-1">💡 Upgrade for instant access!</p>
                    <p className="text-muted-foreground">Get a permanent username and skip all wait times</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLanguage = languageCategories[selectedLanguage];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedLanguage(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{currentLanguage.flag}</span>
            <h1 className="text-3xl font-bold">{currentLanguage.name} Lounges</h1>
          </div>
          <Badge variant="secondary" className="gap-2">
            <UserCircle className="w-4 h-4" />
            {tempUsername}
          </Badge>
          <ConnectionStatus />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setTempUsername("");
            setSelectedLanguage(null);
            setSelectedLounge(null);
            localStorage.removeItem("guestUsername");
            setGuestToken(null);
          }}
        >
          Change Username
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Lounge</CardTitle>
          <CardDescription>
            Join the All Users Lounge or a country-specific chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLounges ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-5 h-5 rounded" />
                        <div>
                          <Skeleton className="h-5 w-48 mb-2" />
                          {i === 0 && <Skeleton className="h-5 w-32" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="w-5 h-5" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {currentLanguage.lounges.map((lounge) => (
                <Card
                  key={lounge.id}
                  className={`hover:border-primary transition-colors cursor-pointer ${
                    lounge.isAll ? "border-2 border-primary" : ""
                  }`}
                  onClick={() => setSelectedLounge(lounge.id)}
                >
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{lounge.name}</CardTitle>
                          {lounge.isAll && (
                            <Badge variant="default" className="mt-1">
                              All Users Welcome
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{lounge.members} online</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> The All Users Lounge connects everyone speaking {currentLanguage.name}, 
              while country-specific lounges let you chat with people from particular regions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
