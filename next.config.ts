import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
