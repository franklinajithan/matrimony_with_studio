
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/dashboard/matches", destination: "/suggestions", permanent: false },
      { source: "/dashboard/connections", destination: "/messages", permanent: false },
      { source: "/dashboard/search", destination: "/search", permanent: false },
      { source: "/help", destination: "/contact", permanent: false },
      { source: "/success-stories/priya-rohan", destination: "/success-stories", permanent: false },
      { source: "/success-stories/aisha-sameer", destination: "/success-stories", permanent: false },
      { source: "/success-stories/lakshmi-arjun", destination: "/success-stories", permanent: false },
      { source: "/success-stories/deepa-karthik", destination: "/success-stories", permanent: false },
    ];
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
