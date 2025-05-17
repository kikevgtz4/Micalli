import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    // Optional: For production, you might want to add your actual domain
    // domains: ['localhost', 'your-production-domain.com'],
  },
};

export default nextConfig;