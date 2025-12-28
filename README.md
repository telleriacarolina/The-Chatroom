# The-Chatroom

A full-featured real-time chatroom application with WebSocket support, REST API, JWT authentication, and PostgreSQL database integration.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 💬 **Real-time Chat** - Socket.io powered instant messaging
- 🌍 **Multi-language Support** - Language-specific chat rooms
- 🏠 **Lounges** - Multiple chat lounges with different access levels
- 📊 **Database Integration** - PostgreSQL with Prisma ORM
- 🛡️ **Security** - Rate limiting, CORS, Helmet, CSRF protection
- 👥 **User Management** - Registered and guest accounts
- 🔍 **Content Moderation** - Message flagging and moderation system
- 📱 **Phone Verification** - Twilio integration for phone authentication
- 📸 **Media Support** - Upload and share images, videos, and files

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: React, Next.js
- **Security**: Helmet, CORS, express-rate-limit
- **Phone Verification**: Twilio
- **Cloud Storage**: AWS S3 (optional)

## Project Structure

```
├── middleware/          # Authentication, rate limiting, CSRF protection
├── routes/             # API routes (auth, chatroom)
├── services/           # Socket.io, background jobs, heartbeat
├── lib/                # JWT utilities, Prisma client, crypto
├── prisma/             # Database schema and migrations
├── public/             # Static files for demo chatroom
├── pages/              # Next.js pages and API routes
├── components/         # React components
├── types/              # TypeScript type definitions
├── utils/              # Logger, security utilities
└── docs/               # Database schema documentation
```

## Installation

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- (Optional) Redis for rate limiting
- (Optional) AWS S3 for file storage
- (Optional) Twilio account for phone verification

### Setup

1. Clone the repository:
```bash
git clone https://github.com/telleriacarolina/The-Chatroom.git
cd The-Chatroom
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` - Secret for JWT access tokens (min 32 chars)
- `REFRESH_TOKEN_SECRET` - Secret for JWT refresh tokens (min 32 chars)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001` (or your configured PORT).

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/csrf` - Get CSRF token

### Chatroom Endpoints

- `GET /api/chatroom/lounges` - Get all active lounges (public)
- `GET /api/chatroom/lounges/:loungeId/rooms` - Get language rooms (authenticated)
- `GET /api/chatroom/rooms/:roomId/messages` - Get chat messages (authenticated)

### Socket.io Events

**Client → Server:**
- `join_room` - Join a language room
- `leave_room` - Leave a room
- `chat_message` - Send a chat message
- `typing_start` - Indicate user is typing
- `typing_stop` - Indicate user stopped typing

**Server → Client:**
- `chat_message` - Receive a chat message
- `user_joined` - User joined the room
- `user_left` - User left the room
- `user_typing` - User typing indicator
- `error` - Error message

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User** - User accounts (registered and guest)
- **Session** - User sessions with JWT tokens
- **Lounge** - Chat lounges with access levels
- **LanguageRoom** - Language-specific chat rooms
- **ChatMessage** - Chat messages with moderation
- **MarketplaceItem** - User-generated content marketplace
- **Transaction** - Payment transactions
- **ModerationAction** - Moderation actions and logs
- **UserReport** - User reports for content/users
- **IDVerification** - Age and ID verification records

See `/docs` directory for detailed schema documentation.

## Security Features

- **JWT Authentication** - All sensitive endpoints require valid JWT tokens
- **Rate Limiting** - Prevents abuse with configurable rate limits
- **CSRF Protection** - Cross-site request forgery protection
- **Helmet** - Security headers for Express
- **CORS** - Configured cross-origin resource sharing
- **Password Hashing** - bcrypt for secure password storage
- **Encrypted Data** - Phone numbers and sensitive data encrypted
- **Input Validation** - Request validation and sanitization

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run next:dev` - Start Next.js development server
- `npm run next:build` - Build Next.js application
- `npm run next:start` - Start Next.js production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Demo Chatroom

A simple demo chatroom is available at `http://localhost:3001/` when the server is running. This is a basic Socket.io chat interface for testing.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on GitHub.