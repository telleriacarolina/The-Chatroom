# Testing Phase 1: Frontend-Backend Connection

This document describes how to test the newly implemented Phase 1 features.

## Prerequisites

1. **PostgreSQL Database**: Running and accessible
2. **Environment Variables**: Set up in root `.env` file
3. **Node.js**: Version 18+ installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
ACCESS_TOKEN_SECRET="your-super-secret-access-key-min-32-chars-here"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-key-min-32-chars-here"
ENCRYPTION_KEY="your-32-byte-hex-key"
PHONE_ENC_KEY="your-32-byte-hex-key"
NODE_ENV="development"
PORT=3001
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
```

Also create `packages/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

### 3. Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Running the Application

You need to run three separate services:

### Terminal 1: API Server

```bash
npm run dev:api
# Should start on http://localhost:3001
```

### Terminal 2: Socket.IO Server

```bash
npm run dev:socket
# Should start on http://localhost:3002
```

### Terminal 3: Next.js Frontend

```bash
npm run dev:web
# Should start on http://localhost:3000
```

Or run all at once:

```bash
npm run dev
```

## Features to Test

### 1. Connection Status Indicator

**Expected Behavior:**
- Green badge with "Connected" when Socket.IO is connected
- Red badge with "Disconnected" when not connected
- Yellow badge with "Connecting..." during connection
- Reconnect button appears when disconnected

**How to Test:**
1. Open the app at http://localhost:3000
2. Check for connection status badge
3. Stop the Socket.IO server to see "Disconnected" state
4. Restart Socket.IO server and click "Reconnect" button

### 2. Guest Session Creation

**Expected Behavior:**
- User enters username (4-10 characters)
- Loading spinner shows during API call
- Success toast notification appears
- User proceeds to language selection

**How to Test:**
1. Enter a username between 4-10 characters
2. Click "Enter" button
3. Watch for loading state
4. Check for success toast: "Welcome! Guest session created for [username]"
5. Verify you're taken to language selection screen

**Error Cases to Test:**
- Empty username → Error message
- Username < 4 characters → Error message
- Username > 10 characters → Error message
- Duplicate username → Error message
- API server down → Error toast notification

### 3. Real-Time Lounge Member Counts

**Expected Behavior:**
- Member counts displayed for each language
- Member counts displayed for each lounge
- Counts update in real-time when Socket.IO events are received

**How to Test:**
1. Complete guest session creation
2. View language selection screen
3. Check member counts displayed (e.g., "342 online")
4. Select a language
5. View lounge selection screen
6. Check member counts for each lounge

**Note:** Real-time updates require Socket.IO server to emit count events. Currently, counts show default values until the socket server is updated to emit actual count data.

### 4. Toast Notifications

**Expected Behavior:**
- Success toasts (green) for successful actions
- Error toasts (red) for failures
- Warning toasts (yellow) for connection issues
- Info toasts (blue) for informational messages

**Toasts to Test:**
1. **Guest creation success**: "Welcome! Guest session created"
2. **Guest creation failure**: "Failed to create session"
3. **Socket connected**: "Connected - Real-time connection established"
4. **Socket disconnected**: "Disconnected - Lost connection to server"
5. **Connection error**: "Connection Error"
6. **Not connected error**: When trying to join lounge while disconnected

**How to Test:**
1. Complete guest creation flow → Success toast
2. Stop API server, try to create guest → Error toast
3. Stop Socket.IO server → Disconnection toast
4. Restart Socket.IO → Connection toast
5. While disconnected, try to select a lounge → Error toast

### 5. Lounge Joining

**Expected Behavior:**
- User can select a language category
- User can select a specific lounge
- Socket.IO emits 'join lounge' event when lounge is clicked

**How to Test:**
1. Complete guest session creation
2. Select a language (e.g., English)
3. Click on a lounge (e.g., "All Users Lounge")
4. Check browser console for socket event
5. Verify lounge ID is set in component state

**Note:** Full lounge functionality (chat messages, user list) will be implemented in Phase 3.

## Troubleshooting

### Issue: "Connection Error" toast immediately

**Solution:**
- Ensure Socket.IO server is running on port 3002
- Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- Check browser console for CORS errors

### Issue: "Failed to create session" error

**Solution:**
- Ensure API server is running on port 3001
- Ensure database is running and accessible
- Check `DATABASE_URL` in `.env`
- Check API server logs for errors

### Issue: Member counts not updating

**Solution:**
- This is expected - Socket.IO server needs to be updated to emit count events
- Default counts are shown from static data
- Real-time updates will work once server emits events

### Issue: Hydration warnings in console

**Solution:**
- Should be fixed with SSR safety checks
- If persisting, check that all localStorage access has `typeof window !== 'undefined'` check

### Issue: Toast notifications not appearing

**Solution:**
- Check that Toaster is in layout.tsx
- Check browser console for errors
- Try refreshing the page

## Success Criteria

All Phase 1 tasks are complete when:

- ✅ API client utilities work correctly
- ✅ Socket.IO client connects and manages state
- ✅ Connection status indicator shows accurate state
- ✅ Guest session creation calls backend API
- ✅ Toast notifications appear for all actions
- ✅ Member counts display (even if static)
- ✅ No TypeScript errors in build
- ✅ No security vulnerabilities found
- ✅ No SSR/hydration issues

## Next Steps

**Phase 2: Authentication Flow**
- Login form
- Signup form
- JWT token management
- Auth context provider
- Protected routes

**Phase 3: Real-Time Chat**
- Chat message components
- Message broadcasting
- Typing indicators
- Online user list
- Message history

## API Endpoints Used

- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/csrf` - Get CSRF token (if needed)

## Socket.IO Events

**Emitted by Client:**
- `join lounge` - Join a lounge
- `leave lounge` - Leave a lounge
- `request counts` - Request lounge member counts

**Expected from Server (not yet implemented):**
- `lounge counts` - All lounge member counts
- `user count` - Single lounge member count update
- `user joined` - Notification when user joins
- `user left` - Notification when user leaves

---

**Last Updated:** January 3, 2026
