/**
 * Socket.IO Client Wrapper
 * 
 * Provides a Socket.IO client instance with reconnection logic,
 * connection state management, and TypeScript types for socket events.
 */

import { io, Socket } from 'socket.io-client';

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
  chat_message: (message: unknown) => void;
  user_joined: (data: { userId: string; timestamp: string }) => void;
  user_left: (data: { userId: string; timestamp: string }) => void;
  user_typing: (data: { userId: string; isTyping: boolean }) => void;
  error: (data: { code: string; message: string }) => void;
  'lounge counts': (data: Record<string, number>) => void;
  'user count': (data: { loungeId: string; count: number }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

export interface ClientToServerEvents {
  chat_message: (data: {
    loungeId: string;
    languageRoomId: string;
    messageText: string;
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM';
    attachmentUrl?: string;
  }) => void;
  join_room: (data: { loungeId: string; languageRoomId: string }) => void;
  leave_room: (data: { languageRoomId: string }) => void;
  typing_start: (data: { loungeId: string; languageRoomId: string }) => void;
  typing_stop: (data: { loungeId: string; languageRoomId: string }) => void;
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
    socket.emit('join_room', { loungeId, languageRoomId });
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
    socket.emit('leave_room', { languageRoomId });
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
    socket.emit('chat_message', data);
  }
}

/**
 * Send typing indicator
 */
export function sendTyping(loungeId: string, languageRoomId: string, isTyping: boolean): void {
  const socket = getSocket();
  if (socket) {
    socket.emit(
      isTyping ? 'typing_start' : 'typing_stop',
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
