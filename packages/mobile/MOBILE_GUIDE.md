# @chatroom/mobile - Complete Mobile Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (Mac only)
- Android: Android Studio + Emulator

### Installation

```bash
cd packages/mobile
npm install
```

### Environment Setup

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001  # For Android emulator
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:3002
```

> **Note:** Use `10.0.2.2` for Android emulator or your machine's IP for physical devices

### Run Development Server

```bash
# From root directory
npm run dev:mobile

# Or from mobile package
cd packages/mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

---

## 📱 Features Implemented

### ✅ Authentication
- Guest login with username
- Persistent session (AsyncStorage)
- User context management
- Age verification (18+)

### ✅ Chat System
- Real-time messaging with Socket.IO
- Multiple language categories
- Country-specific lounges
- Online user counts
- Message timestamps
- Own/other message styling

### ✅ Navigation
- **Login Screen** - Enter username and create guest session
- **Home Screen** - Select language category (8 languages)
- **Chat Screen** - Real-time messaging in selected lounge

### ✅ Context Management
- ChatContext with Socket.IO integration
- User authentication state
- Connection status tracking

---

## 📂 Project Structure

```
packages/mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Username creation
│   │   ├── HomeScreen.tsx       # Language selection
│   │   └── ChatScreen.tsx       # Real-time chat
│   ├── contexts/
│   │   └── ChatContext.tsx      # Chat state management
│   └── App.tsx                  # Main navigation
├── app.json                     # Expo configuration
├── babel.config.js              # Babel config
├── tsconfig.json                # TypeScript config
├── package.json
└── .env.example
```

---

## 🎨 UI Components

### Login Screen
- Username input (4-10 characters)
- Guest session creation
- Sign in/Sign up options
- Age confirmation footer

### Home Screen
- 8 language cards (grid layout)
- Member counts per language
- Flag emojis
- Navigation to lounges

### Chat Screen
- Real-time message list
- Message input with send button
- Connection status indicator
- Own/other message bubbles
- Timestamps

---

## 🔌 Socket.IO Integration

### Events

**Emit:**
```typescript
socket.emit('join_room', { loungeId, languageRoomId });
socket.emit('leave_room', { languageRoomId });
socket.emit('chat_message', { loungeId, languageRoomId, messageText });
```

**Listen:**
```typescript
socket.on('chat_message', (msg) => {
  setMessages(prev => [...prev, msg]);
});

socket.on('connect', () => {
  console.log('Connected');
});
```

---

## 🌐 API Integration

### Endpoints Used

**Create Guest Session:**
```typescript
POST /api/auth/guest
Body: { ageCategory: '_18PLUS' }
Response: { guestId, tempSessionToken }
```

**Sign In:**
```typescript
POST /api/auth/signin
Body: { phoneNumber, password }
Response: { user: { id, phoneNumber } }
```

---

## 📦 Dependencies

### Core
- `react-native` - Native components
- `expo` - Development framework
- `@react-navigation/native` - Navigation
- `@react-navigation/native-stack` - Stack navigator

### Communication
- `socket.io-client` - WebSocket client
- `axios` - HTTP requests

### Storage
- `@react-native-async-storage/async-storage` - Persistent storage

### UI
- `react-native-safe-area-context` - Safe area handling

---

## 🛠️ Development Commands

```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Clear cache
expo start --clear

# Build for production
eas build --platform android
eas build --platform ios
```

---

## 📱 Testing on Physical Device

### iOS (iPhone/iPad)
1. Install **Expo Go** from App Store
2. Run `npm start`
3. Scan QR code with Camera app
4. Opens in Expo Go automatically

### Android
1. Install **Expo Go** from Play Store
2. Run `npm start`
3. Scan QR code with Expo Go app

### Update `.env` for Device Testing
```bash
# Replace localhost with your computer's IP
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.XXX:3002
```

Find your IP:
- Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`
- Linux: `ip addr show`

---

## 🏗️ Building for Production

### Setup EAS Build
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build APK (Android)
```bash
eas build --platform android --profile preview
```

### Build IPA (iOS)
```bash
eas build --platform ios --profile preview
```

### Submit to Stores
```bash
eas submit --platform android
eas submit --platform ios
```

---

## 🎯 Next Steps

### Immediate Enhancements
1. **Lounge Selection Screen** - Show country-specific lounges
2. **User Profile** - View and edit profile
3. **Push Notifications** - Message notifications
4. **Image Sharing** - Send photos in chat
5. **Voice Messages** - Record and send audio

### Advanced Features
1. **Video Chat** - WebRTC integration
2. **Marketplace** - Browse and purchase items
3. **Offline Mode** - Cache messages locally
4. **Dark Mode** - Theme switching
5. **Localization** - Multi-language UI

---

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check Socket.IO connection
curl http://localhost:3002
```

### Metro Bundler Issues
```bash
expo start --clear
rm -rf node_modules
npm install
```

### iOS Build Issues
```bash
cd ios && pod install
```

### Android Emulator Not Found
```bash
# List emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_31
```

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [React Native](https://reactnative.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## 🎉 You're Ready!

Start developing with:
```bash
npm run dev:mobile
```

Happy mobile development! 🚀
