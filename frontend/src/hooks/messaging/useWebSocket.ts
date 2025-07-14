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

// Global connection tracking to prevent duplicates
const activeConnections = new Map<string, WebSocket>();

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
    heartbeatInterval = 30000,
  } = options;

  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalClose = useRef(false);
  const connectionKey = useRef<string>('');

  // Generate unique connection key
  useEffect(() => {
    if (conversationId && user) {
      connectionKey.current = `chat-${conversationId}-${user.id}`;
    }
  }, [conversationId, user]);

  // Heartbeat implementation
  const startHeartbeat = useCallback(() => {
    if (!heartbeatInterval) return;
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

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
    // Don't connect if missing required data
    if (!conversationId || !user || isIntentionalClose.current) {
      console.log('WebSocket connection skipped:', { conversationId, user: !!user, intentionalClose: isIntentionalClose.current });
      return;
    }

    // Check for existing connection
    const existingConnection = activeConnections.get(connectionKey.current);
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      console.log('Reusing existing WebSocket connection');
      socketRef.current = existingConnection;
      setIsConnected(true);
      setIsConnecting(false);
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting, skipping duplicate attempt');
      return;
    }

    setIsConnecting(true);

    try {
      const wsUrl = getWebSocketUrl(`/chat/${conversationId}/`);
      console.log('Creating new WebSocket connection:', wsUrl);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      activeConnections.set(connectionKey.current, socket);

      socket.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCountRef.current = 0;
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
          
          // Handle connection_established message
          if (message.type === 'connection_established') {
            console.log('Connection established:', message);
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
        
        // Remove from active connections
        activeConnections.delete(connectionKey.current);
        
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        stopHeartbeat();
        onDisconnect?.();

        // Handle different close codes
        if (isIntentionalClose.current || event.code === 1000) {
          // Normal closure
          return;
        }
        
        if (event.code === 4001) {
          toast.error('Authentication required. Please log in again.');
          return;
        }
        
        if (event.code === 4003) {
          toast.error('Access denied to this conversation.');
          return;
        }

        // Attempt reconnection with exponential backoff
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectCountRef.current - 1),
            30000
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
      activeConnections.delete(connectionKey.current);
    }
  }, [conversationId, user, onConnect, onDisconnect, onError, onMessage, reconnectAttempts, reconnectDelay, startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    isIntentionalClose.current = true;
    
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop heartbeat
    stopHeartbeat();

    // Close WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close(1000, 'User disconnect');
    }
    
    // Remove from active connections
    activeConnections.delete(connectionKey.current);
    socketRef.current = null;
    setIsConnected(false);
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
    // Reset intentional close flag
    isIntentionalClose.current = false;
    
    // Small delay to prevent React double-render issues
    const connectTimer = setTimeout(() => {
      connect();
    }, 100);
    
    return () => {
      clearTimeout(connectTimer);
      disconnect();
    };
  }, [conversationId]); // Only depend on conversationId, not connect/disconnect

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}