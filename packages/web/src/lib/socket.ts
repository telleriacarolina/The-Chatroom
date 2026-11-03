/**
 * Socket.IO Client Wrapper
 * 
 * Provides a Socket.IO client instance with reconnection logic,
 * connection state management, and TypeScript types for socket events.
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@chatroom/shared/socket-protocol';

const CLIENT_EVENTS = {
  JOIN_ROOM: SOCKET_EVENTS.CLIENT.JOIN_ROOM as 'join_room',
  LEAVE_ROOM: SOCKET_EVENTS.CLIENT.LEAVE_ROOM as 'leave_room',
  CHAT_MESSAGE: SOCKET_EVENTS.CLIENT.CHAT_MESSAGE as 'chat_message',
  TYPING_START: SOCKET_EVENTS.CLIENT.TYPING_START as 'typing_start',
  TYPING_STOP: SOCKET_EVENTS.CLIENT.TYPING_STOP as 'typing_stop',
} as const;

const SERVER_EVENTS = {
  CHAT_MESSAGE: SOCKET_EVENTS.SERVER.CHAT_MESSAGE as 'chat_message',
  USER_JOINED: SOCKET_EVENTS.SERVER.USER_JOINED as 'user_joined',
  USER_LEFT: SOCKET_EVENTS.SERVER.USER_LEFT as 'user_left',
  USER_TYPING: SOCKET_EVENTS.SERVER.USER_TYPING as 'user_typing',
  ERROR: SOCKET_EVENTS.SERVER.ERROR as 'error',
} as const;

// ============================================================================
// Configuration
// ============================================================================

function resolveSocketUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SOCKET_URL || '';
  }

  return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
}

// ============================================================================
// Types
// ============================================================================

export interface ServerToClientEvents {
  [SERVER_EVENTS.CHAT_MESSAGE]: (message: unknown) => void;
  [SERVER_EVENTS.USER_JOINED]: (data: { userId: string; timestamp: string }) => void;
  [SERVER_EVENTS.USER_LEFT]: (data: { userId: string; timestamp: string }) => void;
  [SERVER_EVENTS.USER_TYPING]: (data: { userId: string; isTyping: boolean }) => void;
  [SERVER_EVENTS.ERROR]: (data: { code: string; message: string }) => void;
  'lounge counts': (counts: Record<string, number>) => void;
  'user count': (data: { loungeId: string; count: number }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

export interface ClientToServerEvents {
  [CLIENT_EVENTS.CHAT_MESSAGE]: (data: {
    loungeId: string;
    languageRoomId: string;
    messageText: string;
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM';
    attachmentUrl?: string;
  }) => void;
  [CLIENT_EVENTS.JOIN_ROOM]: (data: { loungeId: string; languageRoomId: string }) => void;
  [CLIENT_EVENTS.LEAVE_ROOM]: (data: { languageRoomId: string }) => void;
  [CLIENT_EVENTS.TYPING_START]: (data: { loungeId: string; languageRoomId: string }) => void;
  [CLIENT_EVENTS.TYPING_STOP]: (data: { loungeId: string; languageRoomId: string }) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ============================================================================
// Socket Instance
// ============================================================================

let socket: TypedSocket | null = null;

/**
 * Get or create Socket.IO client instance
 * Uses singleton pattern with SSR safety
 */
export function getSocket(): TypedSocket | null {
  // Don't create socket during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socket) {
    socket = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: false, // Manual connection control
    }) as TypedSocket;
  }

  return socket;
}

/**
 * Connect to Socket.IO server
 */
export function connect(): TypedSocket | null {
  const socket = getSocket();
  
  if (socket && !socket.connected) {
    socket.connect();
  }

  return socket;
}

export function setAuthToken(token: string): void {
  const socket = getSocket();
  if (!socket) return;
  socket.auth = { token };
}

/**
 * Disconnect from Socket.IO server
 */
export function disconnect(): void {
  const socket = getSocket();
  
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isConnected(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return socket?.connected ?? false;
}

/**
 * Clean up socket instance
 */
export function cleanupSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ============================================================================
// Event Emitters
// ============================================================================

/**
 * Join a lounge
 */
export function joinRoom(loungeId: string, languageRoomId: string): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(CLIENT_EVENTS.JOIN_ROOM, { loungeId, languageRoomId });
  }
}

export function joinLounge(loungeId: string, languageRoomId: string): void {
  joinRoom(loungeId, languageRoomId);
}

/**
 * Leave a lounge
 */
export function leaveRoom(languageRoomId: string): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(CLIENT_EVENTS.LEAVE_ROOM, { languageRoomId });
  }
}

export function leaveLounge(languageRoomId: string): void {
  leaveRoom(languageRoomId);
}

/**
 * Send a chat message
 */
export function sendMessage(data: {
  loungeId: string;
  languageRoomId: string;
  messageText: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM';
  attachmentUrl?: string;
}): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(CLIENT_EVENTS.CHAT_MESSAGE, data);
  }
}

/**
 * Send typing indicator
 */
export function sendTyping(loungeId: string, languageRoomId: string, isTyping: boolean): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(
      isTyping ? CLIENT_EVENTS.TYPING_START : CLIENT_EVENTS.TYPING_STOP,
      { loungeId, languageRoomId }
    );
  }
}

/**
 * Request lounge counts
 */
export function requestLoungeCounts(): void {
  // No-op: lounge count events are not part of the canonical chat protocol.
}

// ============================================================================
// Exports
// ============================================================================

export default {
  getSocket,
  connect,
  setAuthToken,
  disconnect,
  isConnected,
  cleanupSocket,
  joinRoom,
  joinLounge,
  leaveRoom,
  leaveLounge,
  sendMessage,
  sendTyping,
  requestLoungeCounts,
};
