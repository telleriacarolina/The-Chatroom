# The-Chatroom Application Architecture

This document provides detailed information about the chatroom application architecture and implementation.

## Overview

The Chatroom is a comprehensive real-time messaging platform built with Node.js, Express, Socket.io, and PostgreSQL. It supports multiple chat lounges, language-specific rooms, user authentication, content moderation, and a marketplace for user-generated content.

## Architecture

### Backend Server (`server.js`)

The main server file integrates Express.js with Socket.io for both REST API endpoints and real-time WebSocket connections.

**Key Features:**
- HTTP server with Socket.io integration
- Security middleware (Helmet, CORS)
- Cookie-based session management
- Static file serving for demo chatroom
- Comprehensive error handling
- Background job scheduler

**Server Configuration:**
```javascript
- Port: 3001 (configurable via PORT env variable)
- CORS: Configured for frontend URL
- Static files: Served from /public directory
- API routes: /api/auth, /api/chatroom
- Health check: /health endpoint
```

### Authentication System

**JWT-based Authentication (`middleware/auth.js`):**
- Access tokens (15-minute expiry)
- Refresh tokens (30-day expiry)
- Socket.io authentication middleware
- Express route authentication middleware

**Auth Routes (`routes/auth.js`):**
- User registration with phone verification
- Sign in/sign out
- Guest account creation
- Password management
- CSRF token generation
- Rate limiting on auth endpoints

### Real-time Chat (`services/socketio.js`)

**Socket.io Integration:**
- JWT authentication for all socket connections
- Room-based messaging (lounge + language room)
- Real-time message broadcasting
- Database persistence for all messages
- Typing indicators
- User presence notifications
- Automatic room cleanup on disconnect

**Event Flow:**
1. Client authenticates with JWT token
2. Client joins specific language room in a lounge
3. Messages are persisted to database
4. Messages broadcast to all room members
5. Typing indicators sent in real-time
6. User presence tracked and broadcast

### Chatroom API (`routes/chatroom.js`)

**REST Endpoints:**

1. **GET /api/chatroom/lounges**
   - Public endpoint
   - Returns all active lounges with language rooms
   - Used for lounge selection UI

2. **GET /api/chatroom/lounges/:loungeId/rooms**
   - Authenticated endpoint
   - Returns language rooms for specific lounge
   - Rate limited (60 requests/minute)

3. **GET /api/chatroom/rooms/:roomId/messages**
   - Authenticated endpoint
   - Returns paginated chat history
   - Supports cursor-based pagination
   - Rate limited (60 requests/minute)
   - Filters out deleted and non-approved messages

### Database Layer

**Prisma ORM (`prisma/schema.prisma`):**

The database schema includes:

1. **User Management:**
   - Users (registered and guest)
   - Sessions (JWT-based)
   - TempSessions (temporary guest sessions)

2. **Chat System:**
   - Lounges (main chat areas)
   - LanguageRooms (language-specific rooms)
   - ChatMessages (with moderation status)

3. **Content & Commerce:**
   - MarketplaceItems (user-generated content)
   - Transactions (payment processing)

4. **Moderation:**
   - ModerationActions (admin actions)
   - UserReports (community reports)

5. **Verification:**
   - IDVerification (age/ID verification)
   - AuditLog (system audit trail)

### Security Implementation

**1. Authentication Security:**
- JWT tokens with secure secrets
- HttpOnly cookies for refresh tokens
- Token validation on all protected routes
- Automatic token refresh mechanism

**2. Rate Limiting:**
- Auth endpoints: 5 requests/15 minutes
- API endpoints: 60 requests/minute
- Heartbeat endpoint: 120 requests/minute
- Configurable Redis-based store (falls back to memory)

**3. Data Protection:**
- Password hashing with bcrypt (12 rounds)
- Encrypted phone numbers
- Encrypted sensitive user data
- CSRF protection for state-changing operations

**4. Input Validation:**
- Request parameter validation
- Message content sanitization
- File upload restrictions
- SQL injection prevention via Prisma

**5. Network Security:**
- CORS configured for specific origin
- Helmet.js security headers
- Secure cookie settings
- HTTPS support (production)

### Background Services

**Background Jobs (`services/backgroundJobs.js`):**
- Session cleanup (expired sessions)
- Temporary session management
- User presence updates
- Scheduled maintenance tasks

**Heartbeat Service (`services/heartbeat.js`):**
- Keep-alive mechanism for active users
- User online status tracking
- Automatic offline detection

### Optional Features

**Document Upload (`services/documentUpload.js`):**
- AWS S3 integration for file storage
- Image verification with face-api
- OCR with tesseract.js
- Image processing with sharp
- File type validation

**Phone Verification:**
- Twilio SMS integration
- OTP generation and validation
- Phone number encryption

## Data Flow Examples

### Message Sending Flow

1. User sends message via Socket.io
2. Server validates JWT token
3. Server checks user is in the room
4. Message saved to database via Prisma
5. Message broadcast to all room members
6. Message appears in real-time for all users

### User Authentication Flow

1. User submits credentials to /api/auth/signin
2. Server validates credentials (bcrypt)
3. Server generates JWT access + refresh tokens
4. Access token returned in response body
5. Refresh token set as HttpOnly cookie
6. Client uses access token for API calls
7. Client uses refresh endpoint when token expires

### Room Joining Flow

1. Client fetches lounges from API
2. User selects lounge and language room
3. Client emits 'join_room' event with JWT
4. Server validates token and room existence
5. Server adds socket to Socket.io room
6. Server broadcasts 'user_joined' to room
7. Client starts receiving room messages

## Development Workflow

### Local Setup

1. Install PostgreSQL
2. Copy .env.example to .env
3. Configure database URL
4. Run Prisma migrations
5. Start development server

### Testing

- Use Postman/curl for API testing
- Use Socket.io client for WebSocket testing
- Demo chatroom at http://localhost:3001/
- Database inspection via Prisma Studio

### Debugging

- Logger utility in utils/logger.js
- Console output for development
- Audit logs in database
- Error middleware for unhandled errors

## Performance Considerations

1. **Database:**
   - Indexed foreign keys
   - Efficient queries with Prisma
   - Connection pooling

2. **WebSocket:**
   - Room-based broadcasting (not global)
   - Automatic cleanup on disconnect
   - Message batching possible

3. **Caching:**
   - Redis for rate limiting (optional)
   - Session caching possible
   - Consider CDN for static files

4. **Scalability:**
   - Stateless JWT authentication
   - Socket.io adapter for multi-server
   - Database replication support

## Future Enhancements

- End-to-end encryption for messages
- Voice/video chat support
- File sharing and attachments
- Message reactions and threads
- Push notifications
- Mobile app integration
- Advanced moderation tools
- Analytics dashboard

## Deployment

### Environment Configuration

Ensure all required environment variables are set:
- Database connection strings
- JWT secrets (strong, random)
- API keys (Twilio, AWS)
- CORS origins
- Port configuration

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Configure PostgreSQL backups
- [ ] Set up Redis for rate limiting
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Database connection pooling
- [ ] Process manager (PM2)
- [ ] Reverse proxy (nginx)

## Troubleshooting

**Database Connection Issues:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check network connectivity
- Verify database user permissions

**Authentication Issues:**
- Verify JWT secrets are set
- Check token expiration
- Verify CORS configuration
- Check cookie settings

**Socket.io Connection Issues:**
- Verify WebSocket support
- Check CORS configuration
- Verify JWT token in handshake
- Check firewall settings

**Rate Limiting Issues:**
- Check Redis connection (if used)
- Verify rate limit configuration
- Check client IP detection
- Consider increasing limits for testing
