<<<<<<< HEAD
export default function Block() {
=======
/*
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, Eye, UserCircle, Users, MessageSquare, Globe, ChevronRight, 
  ChevronLeft, Clock, Loader2, DollarSign, Lock, ShoppingCart, Zap, 
  Package, Video, Calendar, ExternalLink, Send, ArrowLeft, Settings, Store, Timer 
} from "lucide-react";

type Message = {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
};

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

export default function Block() {
  // Username state
  const [username, setUsername] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  // Age verification state
  const [accountType, setAccountType] = useState<string>("guest");
  const [showUnder18Message, setShowUnder18Message] = useState<boolean>(false);
  
  // Language and lounge state
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLounge, setSelectedLounge] = useState<string | null>(null);
<<<<<<< HEAD
  const [error, setError] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
=======
  
  // Chat room state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<number>(127);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Waiting room state
  const [isWaitingRoom, setIsWaitingRoom] = useState<boolean>(false);
>>>>>>> origin/main
  return (
    <section style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>The Chatroom</h1>
      <p style={{ marginTop: 8 }}>
        Placeholder UI while components and data wiring are finalized.
      </p>
    </section>
  );
<<<<<<< HEAD
}
/*
=======
  const [showMarketplace, setShowMarketplace] = useState<boolean>(false);
  const [inChatRoom, setInChatRoom] = useState<boolean>(false);

>>>>>>> origin/main
  // Language categories with country-specific lounges
  const languageCategories: LanguageCategory[] = [
      lounges: [
        { id: "en-all", name: "All English Speakers", members: 1234, isAll: true },
        { id: "en-us", name: "United States", members: 456 },
        { id: "en-uk", name: "United Kingdom", members: 234 },
        { id: "en-ca", name: "Canada", members: 123 },
        { id: "en-au", name: "Australia", members: 89 },
        { id: "en-nz", name: "New Zealand", members: 34 },
      ]
    },
    {
      name: "Spanish",
      flag: "🇪🇸",
      lounges: [
        { id: "es-all", name: "Todos los hispanohablantes", members: 987, isAll: true },
        { id: "es-es", name: "España", members: 234 },
        { id: "es-mx", name: "México", members: 456 },
        { id: "es-ar", name: "Argentina", members: 123 },
        { id: "es-co", name: "Colombia", members: 89 },
      ]
    },
    {
      name: "French",
      flag: "🇫🇷",
      lounges: [
        { id: "fr-all", name: "Tous les francophones", members: 654, isAll: true },
        { id: "fr-fr", name: "France", members: 345 },
        { id: "fr-ca", name: "Canada", members: 123 },
        { id: "fr-be", name: "Belgique", members: 67 },
      ]
    },
    {
      name: "German",
      flag: "🇩🇪",
      lounges: [
        { id: "de-all", name: "Alle Deutschsprachigen", members: 543, isAll: true },
        { id: "de-de", name: "Deutschland", members: 234 },
        { id: "de-at", name: "Österreich", members: 89 },
        { id: "de-ch", name: "Schweiz", members: 67 },
      ]
    },
    {
      name: "Japanese",
      flag: "🇯🇵",
      lounges: [
        { id: "ja-all", name: "すべての日本語話者", members: 432, isAll: true },
        { id: "ja-jp", name: "日本", members: 345 },
      ]
    },
    {
      name: "Chinese",
      flag: "🇨🇳",
      lounges: [
        { id: "zh-all", name: "所有中文使用者", members: 765, isAll: true },
        { id: "zh-cn", name: "中国", members: 456 },
        { id: "zh-tw", name: "台灣", members: 123 },
      ]
    },
    {
      name: "Portuguese",
      flag: "🇵🇹",
      lounges: [
        { id: "pt-all", name: "Todos os falantes de português", members: 543, isAll: true },
        { id: "pt-br", name: "Brasil", members: 345 },
        { id: "pt-pt", name: "Portugal", members: 123 },
      ]
    },
    {
      name: "Arabic",
      flag: "🇸🇦",
      lounges: [
        { id: "ar-all", name: "جميع الناطقين بالعربية", members: 432, isAll: true },
        { id: "ar-sa", name: "السعودية", members: 234 },
        { id: "ar-eg", name: "مصر", members: 123 },
      ]
    }
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate waiting room countdown
  useEffect(() => {
    if (isWaitingRoom && queuePosition > 0) {
      const timer = setTimeout(() => {
        setQueuePosition(prev => prev - 1);
        setWaitProgress(prev => Math.min(prev + (100 / 15), 100));
      }, 2000);
      return () => clearTimeout(timer);
    } else if (isWaitingRoom && queuePosition === 0) {
      setIsWaitingRoom(false);
      setInChatRoom(true);
    }
  }, [isWaitingRoom, queuePosition]);

  // Simulate online users fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAgeTabChange = (value: string) => {
    if (value === "under18") {
      setShowUnder18Message(true);
      setAccountType("guest");
    } else {
      setShowUnder18Message(false);
    }
<<<<<<< HEAD

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

    setError(null);
    setIsWaiting(true);

    setTimeout(() => {
      setTempUsername(username);
      setUsername("");
    }, Math.floor(Math.random() * 30000) + 30000);
=======
>>>>>>> origin/main
  };

  const handleUsernameSubmit = () => {
    const trimmed = tempUsername.trim();
    if (trimmed.length < 4 || trimmed.length > 10) {
      setError("Username must be 4-10 characters");
      return;
    }
    setError("");
    setUsername(trimmed);
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setSelectedLounge(null);
  };

  const handleLoungeSelect = (loungeId: string) => {
    setSelectedLounge(loungeId);
  };

  const handleJoinLounge = () => {
    if (accountType === "guest") {
      setIsWaitingRoom(true);
      setQueuePosition(15);
      setWaitProgress(0);
    } else {
      setInChatRoom(true);
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage: Message = {
        id: Math.random().toString(36).substring(7),
        user: username,
        text: currentMessage,
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setCurrentMessage("");
    }
  };

  const handleSignIn = async () => {
    // TODO: Connect to API endpoint /api/auth/signin
    console.log("Sign in:", { phoneNumber, password });
    setShowSignInModal(false);
  };

  const handleSignUp = async () => {
    // TODO: Connect to API endpoint /api/auth/signup
    console.log("Sign up:", { phoneNumber, firstName, lastName, birthYear });
    setShowSignUpModal(false);
  };

  const selectedCategory = languageCategories.find(cat => cat.name === selectedLanguage);

  // Marketplace View
  if (showMarketplace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={() => setShowMarketplace(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chat
            </Button>
            <h1 className="text-4xl font-bold text-white">Creator Marketplace</h1>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>

          <Alert className="mb-6 bg-purple-800/50 border-purple-600">
            <Crown className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-white">
              Upgrade to Creator Account to sell your own content and services!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors">
                <CardHeader>
                  <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4" />
                  <CardTitle className="text-white">Premium Content #{item}</CardTitle>
                  <CardDescription className="text-gray-400">By CreatorName{item}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">$9.99</span>
                    <Button>
                      <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room View
  if (isWaitingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-white flex items-center justify-center gap-2">
              <Timer className="w-8 h-8 text-yellow-400" />
              Waiting Room
            </CardTitle>
            <CardDescription className="text-center text-gray-300 text-lg">
              Queue Position: {queuePosition}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={waitProgress} className="h-4" />
            
            <Alert className="bg-blue-900/50 border-blue-600">
              <Clock className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-white">
                Estimated wait time: {queuePosition * 2} seconds
              </AlertDescription>
            </Alert>

            <Alert className="bg-yellow-900/50 border-yellow-600">
              <Zap className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-white">
                Skip the queue! Upgrade to Creator or Viewer account for instant access.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                onClick={() => setShowSignUpModal(true)}
              >
                <Crown className="w-4 h-4 mr-2" /> Upgrade to Creator
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowSignUpModal(true)}
              >
                <Eye className="w-4 h-4 mr-2" /> Upgrade to Viewer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat Room View
  if (inChatRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4">
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Online Users
              </h3>
              <Badge variant="secondary">{onlineUsers} active</Badge>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowMarketplace(true)}
              >
                <Store className="w-4 h-4 mr-2" /> Marketplace
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowSignInModal(true)}
              >
                <UserCircle className="w-4 h-4 mr-2" /> Account
              </Button>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800/50 border-b border-gray-700 p-4">
              <h2 className="text-white text-xl font-semibold">
                {selectedCategory?.flag} {selectedCategory?.lounges.find(l => l.id === selectedLounge)?.name}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-purple-400">{msg.user}</span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-gray-800/50 border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Age Verification Screen
  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-white">Welcome to The Chatroom</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Please verify your age to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="18plus" onValueChange={handleAgeTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="under18">Under 18</TabsTrigger>
                <TabsTrigger value="18plus">18+ Years</TabsTrigger>
              </TabsList>
            </Tabs>

            {showUnder18Message ? (
              <Alert className="bg-red-900/50 border-red-600">
                <AlertDescription className="text-white space-y-2">
                  <p className="font-semibold">This platform is for adults only (18+).</p>
                  <p className="text-sm">
                    If you're looking for age-appropriate online communities, try searching for:
                  </p>
                  <a 
                    href="https://www.google.com/search?q=safe+chat+rooms+for+teens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Safe chat rooms for teens <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Create Username</Label>
                  <Input
                    id="username"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="Enter 4-10 characters"
                    maxLength={10}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>

                <Button 
                  onClick={handleUsernameSubmit} 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={tempUsername.length < 4}
                >
                  Continue as Guest
                </Button>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSignInModal(true)}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSignUpModal(true)}
                  >
                    Sign Up
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sign In Modal */}
        <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Sign In</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your phone number and password
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-phone" className="text-white">Phone Number</Label>
                <Input
                  id="signin-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-white">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button onClick={handleSignIn} className="w-full">
                Sign In
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sign Up Modal */}
        <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Account</DialogTitle>
              <DialogDescription className="text-gray-400">
                Fill in your details to get started
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-white">Phone Number</Label>
                <Input
                  id="signup-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthYear" className="text-white">Birth Year</Label>
                <Input
                  id="birthYear"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="YYYY"
                  maxLength={4}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button onClick={handleSignUp} className="w-full">
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-white flex items-center justify-center gap-2">
                <Globe className="w-8 h-8" />
                Choose Your Language
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Welcome, {username}! Select your preferred language to join conversations
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {languageCategories.map((category) => (
              <Card 
                key={category.name}
                className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => handleLanguageSelect(category.name)}
              >
                <CardHeader>
                  <CardTitle className="text-4xl text-center mb-2">{category.flag}</CardTitle>
                  <CardTitle className="text-xl text-center text-white">{category.name}</CardTitle>
                  <CardDescription className="text-center text-gray-400">
                    {category.lounges[0].members} online
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Account Tier Comparison */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Account Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Creator Account */}
              <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    Creator Account
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    For content creators and influencers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>Monetize your content</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span>Host video sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Create private groups</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Package className="w-4 h-4 text-orange-400" />
                    <span>Sell custom content</span>
                  </div>
                </CardContent>
              </Card>

              {/* Viewer Account */}
              <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-600">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Eye className="w-6 h-6 text-blue-400" />
                    Viewer Account
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    For content consumers and supporters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <ShoppingCart className="w-4 h-4 text-green-400" />
                    <span>Purchase exclusive content</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span>Join video sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Access private groups</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Priority support</span>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Account */}
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <UserCircle className="w-6 h-6 text-gray-400" />
                    Guest Account
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Free basic access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span>Join public lounges</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Basic chat features</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Waiting room queue</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lounge Selection Screen
  if (!selectedLounge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => setSelectedLanguage(null)}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Languages
          </Button>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-white">
                {selectedCategory?.flag} {selectedCategory?.name} Lounges
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Choose a lounge to join the conversation
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {selectedCategory?.lounges.map((lounge) => (
              <Card 
                key={lounge.id}
                className={`bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors cursor-pointer ${
                  lounge.isAll ? 'border-yellow-600' : ''
                }`}
                onClick={() => handleLoungeSelect(lounge.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        {lounge.isAll && <Crown className="w-5 h-5 text-yellow-400" />}
                        {lounge.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {lounge.members} members online
                      </CardDescription>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-500" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ready to Join Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-white">Ready to Join!</CardTitle>
          <CardDescription className="text-center text-gray-300 text-lg">
            {selectedCategory?.flag} {selectedCategory?.lounges.find(l => l.id === selectedLounge)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-4 text-gray-300">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{selectedCategory?.lounges.find(l => l.id === selectedLounge)?.members} online</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              <span>{username}</span>
            </div>
          </div>

          <Button 
            onClick={handleJoinLounge}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Join Lounge
          </Button>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedLounge(null)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Change Lounge
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedLanguage(null)}
              className="flex-1"
            >
              Change Language
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
<<<<<<< HEAD
*/
=======

*/

export default function Block() {
  return (
    <section style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>The Chatroom</h1>
      <p style={{ marginTop: 8 }}>
        Placeholder UI while components and data wiring are finalized.
      </p>
    </section>
  );
}
>>>>>>> origin/main
