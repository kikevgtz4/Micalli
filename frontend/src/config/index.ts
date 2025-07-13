// frontend/src/config/index.ts
const config = {
  // Client-side URLs (what the browser uses)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  mediaUrl: process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000/media',
  
  // Server-side URLs (what Next.js server uses in Docker)
  internalApiUrl: process.env.INTERNAL_API_URL || 'http://backend:8000/api',
  internalMediaUrl: process.env.INTERNAL_MEDIA_URL || 'http://backend:8000/media',
  
  // Third-party services
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  
  // Environment flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // WebSocket URL - REMOVE the /ws suffix from defaults
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',  // Changed: removed /ws
  internalWsUrl: process.env.INTERNAL_WS_URL || 'ws://backend:8000',  // Changed: removed /ws
};

export default config;