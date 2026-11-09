/**
 * Socket.IO Client Wrapper
 * 
 * Provides a Socket.IO client instance with reconnection logic,
 * connection state management, and TypeScript types for socket events.
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@chatroom/shared/socket-protocol';
import type {
  ChatMessagePayload,
  ClientToServerEventPayloads,
  ServerToClientEventPayloads,
} from '@chatroom/shared/socket-protocol';

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

type ServerPayloadMap = {
  [SOCKET_EVENTS.SERVER.CHAT_MESSAGE]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.CHAT_MESSAGE];
  [SOCKET_EVENTS.SERVER.ROOM_JOINED]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.ROOM_JOINED];
  [SOCKET_EVENTS.SERVER.USER_JOINED]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.USER_JOINED];
  [SOCKET_EVENTS.SERVER.USER_LEFT]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.USER_LEFT];
  [SOCKET_EVENTS.SERVER.USER_TYPING]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.USER_TYPING];
  [SOCKET_EVENTS.SERVER.ERROR]: ServerToClientEventPayloads[typeof SOCKET_EVENTS.SERVER.ERROR];
};

type ClientPayloadMap = {
  [SOCKET_EVENTS.CLIENT.CHAT_MESSAGE]: ClientToServerEventPayloads[typeof SOCKET_EVENTS.CLIENT.CHAT_MESSAGE];
  [SOCKET_EVENTS.CLIENT.JOIN_ROOM]: ClientToServerEventPayloads[typeof SOCKET_EVENTS.CLIENT.JOIN_ROOM];
  [SOCKET_EVENTS.CLIENT.LEAVE_ROOM]: ClientToServerEventPayloads[typeof SOCKET_EVENTS.CLIENT.LEAVE_ROOM];
  [SOCKET_EVENTS.CLIENT.TYPING_START]: ClientToServerEventPayloads[typeof SOCKET_EVENTS.CLIENT.TYPING_START];
  [SOCKET_EVENTS.CLIENT.TYPING_STOP]: ClientToServerEventPayloads[typeof SOCKET_EVENTS.CLIENT.TYPING_STOP];
};

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
  [SOCKET_EVENTS.SERVER.CHAT_MESSAGE]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.CHAT_MESSAGE]) => void;
  [SOCKET_EVENTS.SERVER.ROOM_JOINED]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.ROOM_JOINED]) => void;
  [SOCKET_EVENTS.SERVER.USER_JOINED]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.USER_JOINED]) => void;
  [SOCKET_EVENTS.SERVER.USER_LEFT]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.USER_LEFT]) => void;
  [SOCKET_EVENTS.SERVER.USER_TYPING]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.USER_TYPING]) => void;
  [SOCKET_EVENTS.SERVER.ERROR]: (data: ServerPayloadMap[typeof SOCKET_EVENTS.SERVER.ERROR]) => void;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.CLIENT.CHAT_MESSAGE]: (data: ClientPayloadMap[typeof SOCKET_EVENTS.CLIENT.CHAT_MESSAGE]) => void;
  [SOCKET_EVENTS.CLIENT.JOIN_ROOM]: (data: ClientPayloadMap[typeof SOCKET_EVENTS.CLIENT.JOIN_ROOM]) => void;
  [SOCKET_EVENTS.CLIENT.LEAVE_ROOM]: (data: ClientPayloadMap[typeof SOCKET_EVENTS.CLIENT.LEAVE_ROOM]) => void;
  [SOCKET_EVENTS.CLIENT.TYPING_START]: (data: ClientPayloadMap[typeof SOCKET_EVENTS.CLIENT.TYPING_START]) => void;
  [SOCKET_EVENTS.CLIENT.TYPING_STOP]: (data: ClientPayloadMap[typeof SOCKET_EVENTS.CLIENT.TYPING_STOP]) => void;
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

export function setAuthToken(token: string | null): void {
  const socket = getSocket();
  if (!socket) return;

  socket.auth = token ? { token } : {};

  // If a connection is already open, reconnect so the new auth payload is applied.
  if (socket.connected) {
    socket.disconnect();
    socket.connect();
  }
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
    socket.emit(SOCKET_EVENTS.CLIENT.JOIN_ROOM, { loungeId, languageRoomId });
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
    socket.emit(SOCKET_EVENTS.CLIENT.LEAVE_ROOM, { languageRoomId });
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
  messageType?: ChatMessagePayload['messageType'];
  attachmentUrl?: string;
}): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(SOCKET_EVENTS.CLIENT.CHAT_MESSAGE, data);
  }
}

/**
 * Send typing indicator
 */
export function sendTyping(loungeId: string, languageRoomId: string, isTyping: boolean): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(
      isTyping ? SOCKET_EVENTS.CLIENT.TYPING_START : SOCKET_EVENTS.CLIENT.TYPING_STOP,
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

const socketClient = {
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

export default socketClient;
