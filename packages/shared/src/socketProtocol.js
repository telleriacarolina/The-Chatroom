const SOCKET_EVENTS = {
  CLIENT: {
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    CHAT_MESSAGE: 'chat_message',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop'
  },
  SERVER: {
    CHAT_MESSAGE: 'chat_message',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    USER_TYPING: 'user_typing',
    ERROR: 'error'
  }
};

const SOCKET_ERROR_CODES = {
  JOIN_ROOM_FAILED: 'JOIN_ROOM_FAILED',
  MODERATION_RESTRICTED: 'MODERATION_RESTRICTED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  SEND_MESSAGE_FAILED: 'SEND_MESSAGE_FAILED'
};

module.exports = {
  SOCKET_EVENTS,
  SOCKET_ERROR_CODES
};
