# API Endpoints Documentation

This file documents all API endpoints for The Chatroom project.

## Authentication

### CSRF Token
- **POST /auth/csrf**
  - Generate a CSRF token for protecting form submissions
  - No authentication required
  - Response: `{ csrfToken: string }`
  - Sets `csrfToken` cookie

### User Registration
- **POST /auth/signup**
  - Register a new user with phone number
  - Rate limited: 5 attempts per 15 minutes
  - Body: `{ phoneNumber, firstName?, lastName?, birthYear? }`
  - Response: `{ message, userId }`
  - Generates default password and stores it (TODO: send via SMS)
  - Password hashed with bcrypt (12 rounds)

### Sign In
- **POST /auth/signin**
  - Authenticate user with phone and password
  - Rate limited: 5 attempts per 15 minutes
  - Body: `{ phoneNumber, password, staySignedIn? }`
  - Response: `{ ok: true, user: { id, phoneNumber } }`
  - Sets httpOnly cookies: `accessToken` (15 min), `refreshToken` (30 days)
  - Creates session in database

### Guest Session
- **POST /auth/guest**
  - Create temporary guest session
  - No authentication required
  - Body: `{ ageCategory: "18+RED" | "PLUS_18" }`
  - Response: `{ tempSessionToken, guestId, expiresAt }`
  - Session expires after 24 hours

### Token Refresh
- **POST /auth/refresh**
  - Refresh access token using refresh token
  - Requires valid `refreshToken` cookie
  - Response: `{ accessToken }`
  - Sets new `accessToken` cookie (15 min)

### Logout
- **POST /auth/logout**
  - Invalidate current session
  - Requires `refreshToken` cookie
  - Response: `{ ok: true }`
  - Clears all authentication cookies
  - Marks session as inactive in database

### Change Password
- **POST /auth/change-password**
  - Change password for existing user
  - Rate limited: 5 attempts per 15 minutes
  - Body: `{ phoneNumber, currentPassword, newPassword }`
  - Response: `{ ok: true, message }`
  - Invalidates all existing sessions
  - New password hashed with bcrypt (12 rounds)

### Request Password Reset
- **POST /auth/request-password-reset**
  - Request a password reset token
  - Rate limited: 5 attempts per 15 minutes
  - Body: `{ phoneNumber }`
  - Response: `{ ok: true, message, resetToken? (dev only) }`
  - Generates secure reset token (32 bytes)
  - Token expires after 15 minutes
  - TODO: Send token via SMS in production

### Reset Password
- **POST /auth/reset-password**
  - Reset password using reset token
  - Rate limited: 5 attempts per 15 minutes
  - Body: `{ phoneNumber, token, newPassword }`
  - Response: `{ ok: true, message }`
  - Validates token expiration
  - Password must be at least 8 characters
  - New password hashed with bcrypt (12 rounds)
  - Invalidates all existing sessions
  - Deletes used reset token

## Security Features

### Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 60 requests per 1 minute
- Heartbeat: 120 requests per 1 minute

### Token Security
- **Access Token:** JWT, 15-minute expiry
- **Refresh Token:** JWT, 30-day expiry
- **Reset Token:** 32-byte random hex, 15-minute expiry
- All tokens validated before use

### Password Security
- bcrypt hashing with 12 salt rounds
- Minimum 8 characters for user passwords
- Passwords never stored or transmitted in plain text

### Phone Number Encryption
- AES-256-GCM encryption for phone numbers
- Encrypted at rest in database

## Lounges
- GET /lounges — List all lounges (auth required)
- POST /lounges — Create a new lounge (auth required)

## Real-Time Messaging
- Socket.io events: join-lounge, message

See ARCHITECTURE.md for architecture details and README.md for setup instructions.
