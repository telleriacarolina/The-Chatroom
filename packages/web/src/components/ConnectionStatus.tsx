/**
 * ConnectionStatus Component
 * 
 * Shows connection status (connected/disconnected/reconnecting)
 * with a colored indicator and optional reconnect button
 */

"use client";

import { useSocket } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';

export interface ConnectionStatusProps {
  showReconnectButton?: boolean;
  className?: string;
}

export default function ConnectionStatus({ 
  showReconnectButton = true,
  className = '' 
}: ConnectionStatusProps) {
  // useSocket internally manages a singleton socket instance.
  // Passing autoConnect: true here will only initialize that shared connection,
  // and will NOT create multiple WebSocket connections when multiple
  // ConnectionStatus components are rendered.
  const { status, isConnected, connect } = useSocket({ autoConnect: true });

  const statusConfig = {
    connected: {
      label: 'Connected',
      icon: Wifi,
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600',
    },
    connecting: {
      label: 'Connecting...',
      icon: Loader2,
      variant: 'secondary' as const,
      className: 'bg-yellow-500 hover:bg-yellow-600',
    },
    disconnected: {
      label: 'Disconnected',
      icon: WifiOff,
      variant: 'destructive' as const,
      className: 'bg-red-500 hover:bg-red-600',
    },
    error: {
      label: 'Connection Error',
      icon: WifiOff,
      variant: 'destructive' as const,
      className: 'bg-red-500 hover:bg-red-600',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimating = status === 'connecting';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={config.variant} className={`gap-1.5 ${config.className}`}>
        <Icon className={`w-3 h-3 ${isAnimating ? 'animate-spin' : ''}`} />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      
      {showReconnectButton && !isConnected && status !== 'connecting' && (
        <Button
          size="sm"
          variant="outline"
          onClick={connect}
          className="h-7 px-2"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}
