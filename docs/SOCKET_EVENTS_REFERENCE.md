# Socket.IO Chat Events - Quick Reference

## Socket Events Summary

### User Presence
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `join-lounge` | Client → Server | `{ loungeId, userId }` | Join lounge and go online |
| `leave-lounge` | Client → Server | `{ loungeId, userId }` | Leave lounge |
| `user-list` | Server → Client | `[{ id, username, avatarUrl, isOnline, lastSeenAt }]` | List of online users |
| `user-joined` | Server → Client | `{ userId, timestamp }` | User joined notification |
| `user-left` | Server → Client | `{ userId, timestamp }` | User left notification |
| `user-reconnected` | Server → Client | `{ userId, timestamp }` | User reconnected notification |

### Messages
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `message` | Client → Server | `{ loungeId, languageRoomId, userId, content, displayUsername, messageType }` | Send new message |
| `message` | Server → Client | `{ id, loungeId, languageRoomId, userId, displayUsername, content, messageType, isEdited, isDeleted, createdAt, user }` | New message broadcast |
| `edit-message` | Client → Server | `{ messageId, userId, newContent, loungeId }` | Edit message |
| `message-edited` | Server → Client | `{ id, content, isEdited, editedAt, userId }` | Message edited notification |
| `delete-message` | Client → Server | `{ messageId, userId, loungeId }` | Delete message |
| `message-deleted` | Server → Client | `{ id, userId, deletedAt, deletedById }` | Message deleted notification |

### Read Receipts
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `mark-read` | Client → Server | `{ messageId, userId }` | Mark message as read |
| `mark-multiple-read` | Client → Server | `{ messageIds[], userId }` | Mark multiple messages as read |
| `message-read` | Server → Client | `{ messageId, userId, readAt }` | Single message read notification |
| `messages-read` | Server → Client | `{ messageIds[], userId, readAt }` | Multiple messages read notification |
| `get-message-reads` | Client → Server | `{ messageId }` | Request read receipts |
| `message-reads` | Server → Client | `{ messageId, reads[] }` | Read receipts response |

### Typing Indicators
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `typing` | Client → Server | `{ loungeId, userId, isTyping }` | Send typing status |
| `user-typing` | Server → Client | `{ userId, isTyping, timestamp }` | Typing status broadcast |

### Connection
| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `connect` | Socket.IO | - | Connection established |
| `disconnect` | Socket.IO | - | Connection closed |
| `reconnect` | Client → Server | `{ userId, loungeIds[] }` | Restore state after reconnect |
| `error` | Server → Client | `{ message }` | Error notification |

## Example Usage

### Connect and Join
```javascript
const socket = io('http://localhost:3002');

socket.on('connect', () => {
  socket.emit('join-lounge', {
    loungeId: 'lounge-123',
    userId: 'user-456'
  });
});

socket.on('user-list', (users) => {
  console.log('Online users:', users);
});
```

### Send and Receive Messages
```javascript
// Send message
socket.emit('message', {
  loungeId: 'lounge-123',
  languageRoomId: 'lang-en',
  userId: 'user-456',
  content: 'Hello world!',
  displayUsername: 'JohnDoe',
  messageType: 'TEXT'
});

// Receive messages
socket.on('message', (message) => {
  console.log('New message:', message);
});
```

### Mark Messages as Read
```javascript
// Single message
socket.emit('mark-read', {
  messageId: 'msg-789',
  userId: 'user-456'
});

// Multiple messages
socket.emit('mark-multiple-read', {
  messageIds: ['msg-1', 'msg-2', 'msg-3'],
  userId: 'user-456'
});
```

### Edit and Delete Messages
```javascript
// Edit
socket.emit('edit-message', {
  messageId: 'msg-789',
  userId: 'user-456',
  newContent: 'Updated message',
  loungeId: 'lounge-123'
});

// Delete
socket.emit('delete-message', {
  messageId: 'msg-789',
  userId: 'user-456',
  loungeId: 'lounge-123'
});
```

### Typing Indicators
```javascript
// Start typing
socket.emit('typing', {
  loungeId: 'lounge-123',
  userId: 'user-456',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  loungeId: 'lounge-123',
  userId: 'user-456',
  isTyping: false
});

// Listen for typing
socket.on('user-typing', (data) => {
  if (data.isTyping) {
    console.log(`${data.userId} is typing...`);
  }
});
```

## Authorization Rules

- **Edit Message**: Only the message author can edit
- **Delete Message**: Only the message author can delete (moderators TODO)
- All operations require valid userId
- Database operations require authenticated sessions

## Error Handling

All events that interact with the database will emit an `error` event if they fail:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  // Display error to user
});
```

## Best Practices

1. **Always handle errors**: Listen for the `error` event
2. **Debounce typing indicators**: Don't send on every keystroke
3. **Batch read receipts**: Use `mark-multiple-read` for efficiency
4. **Clean up on unmount**: Disconnect socket when component unmounts
5. **Validate on client**: Check permissions before emitting events
6. **Sanitize content**: Clean user input before displaying

## Notes

- Typing indicators are not persisted to database
- Presence tracking supports multiple connections per user
- Stale connections are cleaned up every 5 minutes
- All timestamps are in ISO 8601 format
- Message types: TEXT, IMAGE, VIDEO, LINK, SYSTEM