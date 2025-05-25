import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Backend server configurations
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
      // For production
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        pathname: '/media/**',
      },
    ],
    // Allow data URLs for base64 previews
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  
  // Remove the API rewrites since we're accessing backend directly
  async rewrites() {
    return [];
  }
};

export default nextConfig;

      // For production, you might want to add your actual domain
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-domain.com',
      //   pathname: '/media/**',
      // },
