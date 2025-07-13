// frontend/src/hooks/messaging/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getWebSocketUrl, WebSocketError, isWebSocketConnected } from '@/utils/websocket';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export function useWebSocket(
  conversationId: number | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    heartbeatInterval = 30000, // 30 seconds - optional heartbeat
  } = options;

  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalClose = useRef(false);

  // Optional heartbeat implementation
  const startHeartbeat = useCallback(() => {
    if (!heartbeatInterval) return; // Skip if not enabled
    
    // Clear existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      if (isWebSocketConnected(socketRef.current)) {
        socketRef.current!.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Don't connect if we're intentionally closing or missing required data
    if (isIntentionalClose.current || !conversationId || !user) {
      return;
    }

    // Prevent multiple simultaneous connections
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setIsConnecting(true);

    try {
      // Get WebSocket URL with JWT token
      const wsUrl = getWebSocketUrl(`/chat/${conversationId}/`);
      console.log('Connecting to chat WebSocket:', wsUrl);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCountRef.current = 0;
        
        // Start heartbeat if enabled
        startHeartbeat();
        
        onConnect?.();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong/heartbeat messages silently
          if (message.type === 'pong' || message.type === 'heartbeat') {
            return;
          }
          
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        stopHeartbeat();
        onDisconnect?.();

        // Don't reconnect if it was intentional or auth error
        if (isIntentionalClose.current || event.code === 4001 || event.code === 4003) {
          if (event.code === 4001) {
            toast.error('Authentication required. Please log in again.');
          } else if (event.code === 4003) {
            toast.error('Access denied to this conversation.');
          }
          return;
        }

        // Attempt reconnection with exponential backoff
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectCountRef.current - 1),
            30000 // Max 30 seconds
          );
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          toast.error('Unable to establish connection. Please refresh the page.');
        }
      };
    } catch (error) {
      if (error instanceof WebSocketError) {
        console.error('WebSocket configuration error:', error.message);
        toast.error(error.message);
      } else {
        console.error('Failed to create WebSocket:', error);
      }
      setIsConnecting(false);
    }
  }, [conversationId, user, onConnect, onDisconnect, onError, onMessage, reconnectAttempts, reconnectDelay, startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    isIntentionalClose.current = true;
    
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop heartbeat
    stopHeartbeat();

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnect');
      socketRef.current = null;
    }
  }, [stopHeartbeat]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (isWebSocketConnected(socketRef.current)) {
      try {
        socketRef.current!.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }, []);

  // Connect on mount/conversationId change
  useEffect(() => {
    isIntentionalClose.current = false;
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}