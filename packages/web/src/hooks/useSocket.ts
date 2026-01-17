/**
 * useSocket Hook
 * 
 * React hook for managing Socket.IO connection state and events
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, connect, disconnect, TypedSocket } from '@/lib/socket';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseSocketReturn {
  socket: TypedSocket | null;
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

/**
 * Hook for managing Socket.IO connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = false,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);
  const callbacksRef = useRef({ onConnect, onDisconnect, onError });
  const autoConnectAttemptedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onConnect, onDisconnect, onError };
  }, [onConnect, onDisconnect, onError]);

  // Initialize socket
  useEffect(() => {
    const socket = getSocket();
    
    // Skip if SSR or socket not available
    if (!socket) return;
    
    socketRef.current = socket;

    // Set up event listeners
    const handleConnect = () => {
      setStatus('connected');
      setError(null);
      callbacksRef.current.onConnect?.();
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
      callbacksRef.current.onDisconnect?.();
    };

    const handleConnectError = (err: Error) => {
      setStatus('error');
      setError(err);
      callbacksRef.current.onError?.(err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Auto-connect if enabled and not already attempted
    if (autoConnect && !autoConnectAttemptedRef.current && !socket.connected) {
      autoConnectAttemptedRef.current = true;
      setStatus('connecting');
      connect();
    }

    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  const handleConnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setStatus('connecting');
      connect();
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      disconnect();
    }
  }, []);

  return {
    socket: socketRef.current,
    status,
    isConnected: status === 'connected',
    connect: handleConnect,
    disconnect: handleDisconnect,
    error,
  };
}
