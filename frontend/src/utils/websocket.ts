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