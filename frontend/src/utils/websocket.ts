// frontend/src/utils/websocket.ts
import config from '@/config';

export class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export interface WebSocketUrlOptions {
  token?: string;
  params?: Record<string, string>;
}

/**
 * Constructs a WebSocket URL with proper authentication
 * @param path - The WebSocket path (e.g., '/conversations/', '/chat/123/')
 * @param options - Optional configuration
 * @returns Fully constructed WebSocket URL
 */
export const getWebSocketUrl = (path: string, options: WebSocketUrlOptions = {}): string => {
  const token = options.token || localStorage.getItem('accessToken');
  
  if (!token) {
    throw new WebSocketError('No access token found');
  }

  // Use config.wsUrl (your existing property name)
  let wsBaseUrl = config.wsUrl;
  
  // In browser, prefer window.location for correct host
  if (typeof window !== 'undefined' && !config.wsUrl.includes('localhost')) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsBaseUrl = `${wsProtocol}//${window.location.host}`;
  }
  
  // Ensure path starts with /ws/ but avoid double /ws/
  let cleanPath = path;
  if (!cleanPath.startsWith('/ws/')) {
    cleanPath = `/ws${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }
  
  // Build query params
  const params = new URLSearchParams({ token, ...options.params });
  
  return `${wsBaseUrl}${cleanPath}?${params.toString()}`;
};

/**
 * Extracts conversation ID from WebSocket path
 */
export const getConversationIdFromPath = (path: string): string | null => {
  const match = path.match(/\/chat\/(\d+)\//);
  return match ? match[1] : null;
};

/**
 * WebSocket connection states
 */
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * Check if WebSocket is in a connected state
 */
export const isWebSocketConnected = (ws: WebSocket | null): boolean => {
  return ws?.readyState === WebSocketState.OPEN;
};

/**
 * WebSocket Connection Manager
 * Manages WebSocket connections to prevent duplicates and handle cleanup
 */
class WebSocketConnectionManager {
  private connections: Map<string, WebSocket> = new Map();
  
  /**
   * Get or create a WebSocket connection
   * @param key - Unique identifier for the connection
   * @param url - WebSocket URL
   * @param handlers - Event handlers for the WebSocket
   * @returns WebSocket instance
   */
  getConnection(key: string, url: string, handlers: {
    onopen?: (event: Event) => void;
    onmessage?: (event: MessageEvent) => void;
    onclose?: (event: CloseEvent) => void;
    onerror?: (event: Event) => void;
  }): WebSocket {
    // Return existing connection if it's open
    const existing = this.connections.get(key);
    if (existing && existing.readyState === WebSocketState.OPEN) {
      console.log(`♻️ Reusing existing WebSocket connection for ${key}`);
      return existing;
    }
    
    // Close existing connection if it's not open
    if (existing) {
      console.log(`🔄 Closing stale WebSocket connection for ${key}`);
      existing.close(1000, 'Replacing with new connection');
      this.connections.delete(key);
    }
    
    // Create new connection
    console.log(`🆕 Creating new WebSocket connection for ${key}`);
    const ws = new WebSocket(url);
    this.connections.set(key, ws);
    
    // Set up handlers
    if (handlers.onopen) ws.onopen = handlers.onopen;
    if (handlers.onmessage) ws.onmessage = handlers.onmessage;
    if (handlers.onclose) ws.onclose = handlers.onclose;
    if (handlers.onerror) ws.onerror = handlers.onerror;
    
    return ws;
  }
  
  /**
   * Close and remove a WebSocket connection
   * @param key - Unique identifier for the connection
   */
  closeConnection(key: string) {
    const ws = this.connections.get(key);
    if (ws) {
      console.log(`🔌 Closing WebSocket connection for ${key}`);
      ws.close(1000, 'Intentional close');
      this.connections.delete(key);
    }
  }
  
  /**
   * Close all WebSocket connections
   */
  closeAllConnections() {
    console.log(`🔌 Closing all ${this.connections.size} WebSocket connections`);
    this.connections.forEach((ws, key) => {
      ws.close(1000, 'Closing all connections');
    });
    this.connections.clear();
  }
  
  /**
   * Get the current state of a connection
   * @param key - Unique identifier for the connection
   */
  getConnectionState(key: string): WebSocketState | null {
    const ws = this.connections.get(key);
    return ws ? ws.readyState : null;
  }
  
  /**
   * Check if a connection exists and is open
   * @param key - Unique identifier for the connection
   */
  isConnected(key: string): boolean {
    const ws = this.connections.get(key);
    return ws ? ws.readyState === WebSocketState.OPEN : false;
  }
}

// Export singleton instance
export const wsManager = new WebSocketConnectionManager();