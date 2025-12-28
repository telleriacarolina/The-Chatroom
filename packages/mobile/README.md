# @chatroom/mobile

React Native mobile application for The Chatroom.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Features

- Cross-platform (iOS & Android)
- Real-time chat with Socket.IO
- Shared types and utilities from @chatroom/shared
- Native navigation
- Push notifications (coming soon)

## Tech Stack

- React Native
- Expo
- React Navigation
- Socket.IO Client
- TypeScript

## Environment Variables

Create `.env` file:
```
API_URL=http://localhost:3001
SOCKET_URL=http://localhost:3002
```

## Building for Production

```bash
# Android
npm run build:android

# iOS
npm run build:ios
```
