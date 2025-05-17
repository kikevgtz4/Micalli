import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // IPv4 configuration
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**', // Allow all paths
      },
      // IPv6 configuration
      {
        protocol: 'http',
        hostname: '::1',
        port: '8000',
        pathname: '/**', // Allow all paths
      },
      // Standard localhost configuration
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**', // Allow all paths
      },
    ],
  },
};

      // For production, you might want to add your actual domain
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-domain.com',
      //   pathname: '/media/**',
      // },

export default nextConfig;