# Socket.IO Chat Enhancements - Implementation Documentation

## Overview

This implementation adds comprehensive real-time chat features to The Chatroom application, including:
- User presence tracking (online/offline status)
- Message editing and deletion
- Read receipts (single and bulk)
- Typing indicators
- Reconnection handling
- Stale connection cleanup

## Files Modified/Created

### New Files
1. **`/socket/initChat.ts`** - TypeScript implementation of chat handlers
2. **`/socket/initChat.js`** - Compiled JavaScript from TypeScript
3. **`/socket/lib/logger.js`** - Logger utility for socket server
4. **`/socket/lib/prisma.js`** - Prisma client wrapper for socket server

### Modified Files
1. **`/socket/socket-server.js`** - Updated to use initChat module
2. **`/packages/api/prisma/schema.prisma`** - Added MessageRead model
3. **`/package.json`** - Fixed merge conflicts
4. **`/packages/mobile/package.json`** - Fixed merge conflicts

## Database Schema Changes

### New Model: MessageRead
```prisma
model MessageRead {
  id        String      @id @default(uuid())
  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  messageId String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  readAt    DateTime    @default(now())
  
  @@unique([messageId, userId])
  @@index([messageId])
  @@index([userId])
}
```

### Updated Models
- **User**: Added `messageReads MessageRead[]` relation
- **ChatMessage**: Added `reads MessageRead[]` relation

## Socket Events

### Client → Server Events

#### 1. join-lounge
Joins a user to a lounge and updates their online status.
```javascript
socket.emit('join-lounge', {
  loungeId: string,
  userId: string
});
```

#### 2. leave-lounge
Removes user from a lounge.
```javascript
socket.emit('leave-lounge', {
  loungeId: string,
  userId: string
});
```

#### 3. typing
Broadcasts typing indicator to other users.
```javascript
socket.emit('typing', {
  loungeId: string,
  userId: string,
  isTyping: boolean
});
```

#### 4. message
Creates and broadcasts a new message.
```javascript
socket.emit('message', {
  loungeId: string,
  languageRoomId: string,
  userId: string,
  content: string,
  displayUsername: string,
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM'
});
```

#### 5. edit-message
Edits an existing message (authorization checked).
```javascript
socket.emit('edit-message', {
  messageId: string,
  userId: string,
  newContent: string,
  loungeId: string
});
```

#### 6. delete-message
Soft-deletes a message (authorization checked).
```javascript
socket.emit('delete-message', {
  messageId: string,
  userId: string,
  loungeId: string
});
```

#### 7. mark-read
Marks a single message as read.
```javascript
socket.emit('mark-read', {
  messageId: string,
  userId: string
});
```

#### 8. mark-multiple-read
Marks multiple messages as read at once.
```javascript
socket.emit('mark-multiple-read', {
  messageIds: string[],
  userId: string
});
```

#### 9. get-message-reads
Retrieves all read receipts for a message.
```javascript
socket.emit('get-message-reads', {
  messageId: string
});
```

#### 10. reconnect
Handles reconnection and restores user state.
```javascript
socket.emit('reconnect', {
  userId: string,
  loungeIds: string[]
});
```

### Server → Client Events

#### 1. user-list
Sent when a user joins a lounge, contains all online users.
```javascript
socket.on('user-list', (users) => {
  // users: Array of user objects with id, username, avatarUrl, isOnline, lastSeenAt
});
```

#### 2. user-joined
Broadcast when a user joins a lounge.
```javascript
socket.on('user-joined', (data) => {
  // data: { userId: string, timestamp: Date }
});
```

#### 3. user-left
Broadcast when a user leaves a lounge.
```javascript
socket.on('user-left', (data) => {
  // data: { userId: string, timestamp: Date }
});
```

#### 4. user-typing
Broadcast when a user is typing.
```javascript
socket.on('user-typing', (data) => {
  // data: { userId: string, isTyping: boolean, timestamp: Date }
});
```

#### 5. message
Broadcast when a new message is created.
```javascript
socket.on('message', (message) => {
  // message: { id, loungeId, languageRoomId, userId, displayUsername, content, messageType, isEdited, isDeleted, createdAt, user }
});
```

#### 6. message-edited
Broadcast when a message is edited.
```javascript
socket.on('message-edited', (data) => {
  // data: { id: string, content: string, isEdited: boolean, editedAt: Date, userId: string }
});
```

#### 7. message-deleted
Broadcast when a message is deleted.
```javascript
socket.on('message-deleted', (data) => {
  // data: { id: string, userId: string, deletedAt: Date, deletedById: string }
});
```

#### 8. message-read
Broadcast when a message is read by a user.
```javascript
socket.on('message-read', (data) => {
  // data: { messageId: string, userId: string, readAt: Date }
});
```

#### 9. messages-read
Broadcast when multiple messages are read at once.
```javascript
socket.on('messages-read', (data) => {
  // data: { messageIds: string[], userId: string, readAt: Date }
});
```

#### 10. message-reads
Response to get-message-reads request.
```javascript
socket.on('message-reads', (data) => {
  // data: { messageId: string, reads: [{ userId, readAt, user }] }
});
```

#### 11. user-reconnected
Broadcast when a user reconnects.
```javascript
socket.on('user-reconnected', (data) => {
  // data: { userId: string, timestamp: Date }
});
```

#### 12. error
Sent when an error occurs.
```javascript
socket.on('error', (error) => {
  // error: { message: string }
});
```

## Features

### 1. Presence Tracking
- Users are marked online when they connect and join a lounge
- Users are marked offline when all their connections disconnect
- Supports multiple devices/tabs per user
- Periodic cleanup (every 5 minutes) marks stale users as offline
- lastSeenAt timestamp updated on activity

### 2. Message Management
- **Create**: Messages are stored in DB and broadcast to all lounge members
- **Edit**: Only message owner can edit; broadcasts update to all users
- **Delete**: Soft delete with deletedBy tracking; broadcasts deletion
- Authorization checks prevent unauthorized edits/deletes

### 3. Read Receipts
- Single message read tracking
- Bulk read tracking for efficiency
- Query read receipts for any message
- Unique constraint prevents duplicate reads

### 4. Typing Indicators
- Real-time typing status broadcast
- No database persistence (ephemeral)

### 5. Reconnection Handling
- Restores user to all previous lounges
- Updates online status
- Notifies other users of reconnection

### 6. Error Handling
- All database operations wrapped in try-catch
- User-friendly error messages emitted to client
- Detailed error logging for debugging
- Graceful handling of missing data

## Testing

The implementation has been tested with a manual test script that verifies:
- ✓ Socket connection establishment
- ✓ Event emission and reception
- ✓ Join/leave lounge functionality
- ✓ Typing indicators
- ✓ Error handling for missing database

Database-dependent operations require DATABASE_URL environment variable to be set.

## Running the Socket Server

```bash
# Start the socket server
npm run dev:socket

# Or manually
node socket/socket-server.js
```

The server runs on port 3002 by default (configurable via SOCKET_PORT environment variable).

## Migration Required

Before using this implementation in production, run the Prisma migration:

```bash
# Generate Prisma client
npx prisma generate --schema=./packages/api/prisma/schema.prisma

# Create and apply migration
npx prisma migrate dev --name add_message_read --schema=./packages/api/prisma/schema.prisma
```

## Frontend Integration

To integrate with the frontend:

1. **Connect to socket server**:
```typescript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3002');
```

2. **Join a lounge**:
```typescript
socket.emit('join-lounge', { loungeId, userId });
```

3. **Listen for events**:
```typescript
socket.on('user-list', (users) => setOnlineUsers(users));
socket.on('message', (message) => addMessage(message));
socket.on('message-read', (data) => updateReadStatus(data));
```

4. **Send messages**:
```typescript
socket.emit('message', {
  loungeId,
  languageRoomId,
  userId,
  content,
  displayUsername,
  messageType: 'TEXT'
});
```

## Security Considerations

1. **Authorization**: Edit and delete operations verify message ownership
2. **Input Validation**: All inputs should be validated on the client side
3. **Rate Limiting**: Consider adding rate limiting for message creation
4. **XSS Prevention**: Message content should be sanitized on display
5. **Authentication**: User IDs should be verified via session tokens

## Performance Optimizations

1. **Connection Pooling**: Prisma client uses connection pooling
2. **Bulk Operations**: mark-multiple-read for efficient batch updates
3. **Periodic Cleanup**: Automated stale connection cleanup
4. **Indexed Queries**: MessageRead model has indexes on messageId and userId

## Future Enhancements

Potential improvements for future iterations:
- Redis for presence state (horizontal scaling)
- Message pagination for large lounges
- File upload support for attachments
- Reaction tracking (emoji reactions)
- Message search functionality
- User blocking/muting
- Voice/video call support
- Push notifications for offline users

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install` in project root
2. **TypeScript compilation errors**: Run `tsc socket/initChat.ts --outDir socket`
3. **Database connection errors**: Set DATABASE_URL in .env file
4. **Port already in use**: Change SOCKET_PORT in .env file
5. **CORS errors**: Update FRONTEND_URL in .env file

### Debugging

Enable debug logging:
```bash
DEBUG=* node socket/socket-server.js
```

## Contributing

When modifying the chat implementation:
1. Update both initChat.ts (TypeScript source)
2. Recompile to JavaScript: `tsc socket/initChat.ts --outDir socket`
3. Test all socket events manually
4. Update this documentation
5. Consider adding automated tests