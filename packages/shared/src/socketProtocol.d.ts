export declare const SOCKET_EVENTS: {
  readonly CLIENT: {
    readonly JOIN_ROOM: 'join_room';
    readonly LEAVE_ROOM: 'leave_room';
    readonly CHAT_MESSAGE: 'chat_message';
    readonly TYPING_START: 'typing_start';
    readonly TYPING_STOP: 'typing_stop';
  };
  readonly SERVER: {
    readonly CHAT_MESSAGE: 'chat_message';
    readonly ROOM_JOINED: 'room_joined';
    readonly USER_JOINED: 'user_joined';
    readonly USER_LEFT: 'user_left';
    readonly USER_TYPING: 'user_typing';
    readonly ERROR: 'error';
  };
};

export declare const SOCKET_ERROR_CODES: {
  readonly JOIN_ROOM_FAILED: 'JOIN_ROOM_FAILED';
  readonly MODERATION_RESTRICTED: 'MODERATION_RESTRICTED';
  readonly USER_NOT_FOUND: 'USER_NOT_FOUND';
  readonly INVALID_MESSAGE: 'INVALID_MESSAGE';
  readonly SEND_MESSAGE_FAILED: 'SEND_MESSAGE_FAILED';
};

export type ChatMessagePayload = {
  id?: string;
  userId?: string;
  loungeId: string;
  languageRoomId: string;
  messageText: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM';
  attachmentUrl?: string | null;
  createdAt?: string;
};

export type ClientToServerEventPayloads = {
  'join_room': {
    loungeId: string;
    languageRoomId: string;
  };
  'leave_room': {
    languageRoomId: string;
  };
  'chat_message': ChatMessagePayload;
  'typing_start': {
    loungeId: string;
    languageRoomId: string;
  };
  'typing_stop': {
    loungeId: string;
    languageRoomId: string;
  };
};

export type ServerToClientEventPayloads = {
  'chat_message': ChatMessagePayload;
  'room_joined': {
    loungeId: string;
    languageRoomId: string;
  };
  'user_joined': {
    userId: string;
    timestamp: string;
  };
  'user_left': {
    userId: string;
    timestamp: string;
  };
  'user_typing': {
    userId: string;
    isTyping: boolean;
  };
  'error': {
    message: string;
  };
};
