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
    throw new WebSocketError('No access token found. Please log in.');
  }

  // Use config.wsUrl
  let wsBaseUrl = config.wsUrl;
  
  // In browser, prefer window.location for correct host in production
  if (typeof window !== 'undefined' && !config.isDevelopment) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsBaseUrl = `${wsProtocol}//${window.location.host}`;
  }
  
  // Ensure path starts with /ws/ but avoid double /ws/
  let cleanPath = path;
  if (!cleanPath.startsWith('/ws/')) {
    cleanPath = `/ws${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }
  
  // Ensure path ends with /
  if (!cleanPath.endsWith('/')) {
    cleanPath += '/';
  }
  
  // Build query params
  const params = new URLSearchParams({ 
    token, 
    ...options.params,
    // Add timestamp to prevent caching issues
    _t: Date.now().toString()
  });
  
  const fullUrl = `${wsBaseUrl}${cleanPath}?${params.toString()}`;
  console.log('WebSocket URL:', fullUrl);
  
  return fullUrl;
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
  return ws !== null && ws.readyState === WebSocketState.OPEN;
};

/**
 * WebSocket Connection Manager - Singleton pattern to manage connections
 */
class WebSocketConnectionManager {
  private static instance: WebSocketConnectionManager;
  private connections: Map<string, WebSocket> = new Map();
  private connectionAttempts: Map<string, number> = new Map();
  
  private constructor() {}
  
  static getInstance(): WebSocketConnectionManager {
    if (!WebSocketConnectionManager.instance) {
      WebSocketConnectionManager.instance = new WebSocketConnectionManager();
    }
    return WebSocketConnectionManager.instance;
  }
  
  /**
   * Get or create a WebSocket connection
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
    
    // Track connection attempts
    const attempts = this.connectionAttempts.get(key) || 0;
    this.connectionAttempts.set(key, attempts + 1);
    
    // Create new connection
    console.log(`🆕 Creating new WebSocket connection for ${key} (attempt ${attempts + 1})`);
    const ws = new WebSocket(url);
    this.connections.set(key, ws);
    
    // Set up handlers
    const originalOnClose = handlers.onclose;
    
    if (handlers.onopen) ws.onopen = handlers.onopen;
    if (handlers.onmessage) ws.onmessage = handlers.onmessage;
    if (handlers.onerror) ws.onerror = handlers.onerror;
    
    // Wrap onclose to clean up
    ws.onclose = (event) => {
      this.connections.delete(key);
      originalOnClose?.(event);
    };
    
    return ws;
  }
  
  /**
   * Close and remove a WebSocket connection
   */
  closeConnection(key: string) {
    const ws = this.connections.get(key);
    if (ws && ws.readyState === WebSocketState.OPEN) {
      console.log(`🔌 Closing WebSocket connection for ${key}`);
      ws.close(1000, 'Intentional close');
      this.connections.delete(key);
      this.connectionAttempts.delete(key);
    }
  }
  
  /**
   * Close all WebSocket connections
   */
  closeAllConnections() {
    console.log(`🔌 Closing all ${this.connections.size} WebSocket connections`);
    this.connections.forEach((ws, key) => {
      if (ws.readyState === WebSocketState.OPEN) {
        ws.close(1000, 'Closing all connections');
      }
    });
    this.connections.clear();
    this.connectionAttempts.clear();
  }
  
  /**
   * Get the current state of a connection
   */
  getConnectionState(key: string): WebSocketState | null {
    const ws = this.connections.get(key);
    return ws ? ws.readyState : null;
  }
  
  /**
   * Check if a connection exists and is open
   */
  isConnected(key: string): boolean {
    const ws = this.connections.get(key);
    return ws ? ws.readyState === WebSocketState.OPEN : false;
  }
  
  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      openConnections: 0,
      connectingConnections: 0,
      closedConnections: 0,
      connectionAttempts: {} as Record<string, number>,
    };
    
    this.connections.forEach((ws, key) => {
      switch (ws.readyState) {
        case WebSocketState.OPEN:
          stats.openConnections++;
          break;
        case WebSocketState.CONNECTING:
          stats.connectingConnections++;
          break;
        case WebSocketState.CLOSED:
        case WebSocketState.CLOSING:
          stats.closedConnections++;
          break;
      }
    });
    
    this.connectionAttempts.forEach((attempts, key) => {
      stats.connectionAttempts[key] = attempts;
    });
    
    return stats;
  }
}

// Export singleton instance
export const wsManager = WebSocketConnectionManager.getInstance();

// Add global error handler for debugging
if (typeof window !== 'undefined') {
  (window as any).wsManager = wsManager;
  (window as any).getWebSocketStats = () => wsManager.getStats();
}