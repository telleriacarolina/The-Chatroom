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

- `join_room` - Join a language room within a lounge (`{ loungeId, languageRoomId }`)
- `leave_room` - Leave a joined language room (`{ languageRoomId }`)
- `chat_message` - Send a room-scoped message (`{ loungeId, languageRoomId, messageText, messageType? }`)

### Server → Client

- `room_joined` - Join acknowledgement for the current socket
- `chat_message` - Receive a persisted room message
- `user_joined` / `user_left` - Room presence updates
- `user_typing` - Typing indicator updates

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
