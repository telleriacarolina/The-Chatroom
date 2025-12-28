import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Eye, UserCircle, Users, MessageSquare, Globe, ChevronRight, ChevronLeft, Clock, Loader2, DollarSign, Lock, ShoppingCart, Zap, Package, Video, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Types for language and lounge
type Lounge = {
  id: string;
  name: string;
  members: number;
  isAll?: boolean;
};
type LanguageCategory = {
  name: string;
  flag: string;
  lounges: Lounge[];
};

type LanguageMap = Record<string, LanguageCategory>;

export default function Block() {
  const [username, setUsername] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLounge, setSelectedLounge] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [waitProgress, setWaitProgress] = useState<number>(0);

  const existingUsernames = ["Sarah M", "John D", "Carlos R", "Maria L", "Guest_1234", "Guest_5678"];

  // Language categories with All Users Lounge + Country-specific lounges
  const languageCategories: LanguageMap = {
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

  // Guest waiting room with priority messaging
  useEffect(() => {
    if (isWaiting) {
      const duration = Math.floor(Math.random() * 30000) + 30000; // 30-60 seconds
      const interval = 100;
      const steps = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setWaitProgress((currentStep / steps) * 100);

        if (currentStep >= steps) {
          clearInterval(timer);
          setIsWaiting(false);
          setWaitProgress(0);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isWaiting]);

  const handleSetUsername = () => {
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
    setIsWaiting(true);

    setTimeout(() => {
      setTempUsername(username);
      setUsername("");
    }, Math.floor(Math.random() * 30000) + 30000);
  };

  // Guest waiting room
  if (isWaiting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Enter The Chatroom! 🌍</CardTitle>
            <CardDescription>
              Please wait while we prepare your experience...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Setting up your session...</span>
                <span className="font-medium">{Math.round(waitProgress)}%</span>
              </div>
              <Progress value={waitProgress} className="h-2" />
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-start gap-3 mb-3">
                <Crown className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-primary mb-1">Priority Username Access</p>
                  <p className="text-sm text-muted-foreground">
                    Users with Creator or Viewer accounts get first priority to usernames and instant access to all features!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-3">How The Chatroom Works</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Multi-Language Lounges</p>
                      <p className="text-xs text-muted-foreground">
                        Chat in 8 languages with country-specific rooms and global lounges
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Live Video Features</p>
                      <p className="text-xs text-muted-foreground">
                        Creators & Viewers get access to live video chats and streaming
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Monetize Content</p>
                      <p className="text-xs text-muted-foreground">
                        Creators can sell content, offer paid interactions, and receive gifts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Private Groups</p>
                      <p className="text-xs text-muted-foreground">
                        Join exclusive creator groups and premium communities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary/10 rounded-lg border border-secondary">
              <div className="flex items-start gap-3">
                <ShoppingCart className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-secondary mb-2">Purchase Content Safely</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Secure payment processing for all transactions</li>
                    <li>• Instant access to purchased content</li>
                    <li>• Safe shipping info exchange for physical items</li>
                    <li>• Monthly, yearly, or one-time purchases available</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2 border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm">Creator Account</CardTitle>
                  </div>
                  <Badge variant="default" className="w-fit text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Instant Access + Priority
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Permanent username (yearly)</li>
                    <li>✓ No wait times</li>
                    <li>✓ Monetize & sell content</li>
                    <li>✓ Live video features</li>
                    <li>✓ Create private groups</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-secondary">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-secondary" />
                    <CardTitle className="text-sm">Viewer Account</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Instant Access + Priority
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Permanent username (yearly)</li>
                    <li>✓ No wait times</li>
                    <li>✓ Live video access</li>
                    <li>✓ Purchase content</li>
                    <li>✓ Join private groups</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button variant="outline" size="sm" onClick={() => {
                setIsWaiting(false);
                setWaitProgress(0);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Create your username to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Choose Your Username</Label>
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

            <Button onClick={handleSetUsername} className="w-full" disabled={isWaiting}>
              {isWaiting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                "Start Chatting"
              )}
            </Button>

            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary">
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-primary mb-1">Get Priority Username Access!</p>
                  <p className="text-muted-foreground mb-2">
                    Creator & Viewer accounts get instant access with no wait times, plus first priority to claim usernames.
                  </p>
                  <p className="text-muted-foreground">
                    Upgrade to secure a permanent username with a yearly subscription!
                  </p>
                </div>
              </div>
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
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTempUsername("")}
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
                      <span className="font-medium text-primary">Priority username access</span>
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
                      <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Create private groups</span>
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
                      <span className="font-medium text-secondary">Priority username access</span>
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
                    <li className="text-amber-600">• Wait times for username access</li>
                  </ul>
                  <div className="mt-3 p-2 bg-primary/10 rounded text-xs border border-primary">
                    <p className="font-medium text-primary mb-1">💡 Skip the wait!</p>
                    <p className="text-muted-foreground">Upgrade for instant access & permanent username</p>
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
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setTempUsername("")}
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
