// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // For local development
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // For Docker
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/media/**',
      },
      // For production
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        pathname: '/media/**',
      },
    ],
    // Performance optimizations
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    
    // Keep your existing security settings
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ADD THIS for Docker file watching
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  
  // Keep your existing rewrites
  async rewrites() {
    // Only rewrite in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  }
};

export default nextConfig;