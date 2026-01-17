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

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

// ============================================================================
// Types
// ============================================================================

export interface ServerToClientEvents {
  'chat message': (message: string) => void;
  'user count': (data: { loungeId: string; count: number }) => void;
  'lounge counts': (data: Record<string, number>) => void;
  'user joined': (data: { userId: string; username: string; loungeId: string }) => void;
  'user left': (data: { userId: string; username: string; loungeId: string }) => void;
  'typing': (data: { userId: string; username: string; isTyping: boolean }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

export interface ClientToServerEvents {
  'chat message': (message: string) => void;
  'join lounge': (data: { loungeId: string; username: string }) => void;
  'leave lounge': (data: { loungeId: string }) => void;
  'typing': (data: { loungeId: string; isTyping: boolean }) => void;
  'request counts': () => void;
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
    socket = io(SOCKET_URL, {
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
export function joinLounge(loungeId: string, username: string): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('join lounge', { loungeId, username });
  }
}

/**
 * Leave a lounge
 */
export function leaveLounge(loungeId: string): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave lounge', { loungeId });
  }
}

/**
 * Send a chat message
 */
export function sendMessage(message: string): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('chat message', message);
  }
}

/**
 * Send typing indicator
 */
export function sendTyping(loungeId: string, isTyping: boolean): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('typing', { loungeId, isTyping });
  }
}

/**
 * Request lounge counts
 */
export function requestLoungeCounts(): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('request counts');
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  getSocket,
  connect,
  disconnect,
  isConnected,
  cleanupSocket,
  joinLounge,
  leaveLounge,
  sendMessage,
  sendTyping,
  requestLoungeCounts,
};
