# @chatroom/socket

WebSocket server for real-time messaging in The Chatroom application.

## Tech Stack

- **Runtime:** Node.js
- **WebSocket:** Socket.IO
- **Server:** Express (for static files)

## Structure

```
src/
├── socket-server.js    # Socket.IO server
└── lib/
    └── logger.js       # Logging utility
public/
├── index.html          # Test client
├── client.js           # Socket.IO client script
└── style.css           # Test client styles
```

## Environment Variables

Create a `.env` file:

```bash
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

## Development

```bash
# Install dependencies (from root)
npm install

# Start dev server
npm run dev:socket
```

Server runs on http://localhost:3002

## Socket Events

### Client → Server

- `chat message` - Send a message to the room

### Server → Client

- `chat message` - Receive a message from another user

## Test Client

Visit http://localhost:3002 to access the built-in test client for debugging socket connections.

## Scripts

```bash
npm run dev          # Start with nodemon
npm run start        # Production start
```

## Dependencies

See [package.json](./package.json) for full list.

Key dependencies:
- socket.io
- express
