// src/config/index.ts
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  mediaUrl: process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000/media',
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;