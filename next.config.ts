
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      { source: "/dashboard/discovery", destination: "/discover", permanent: false },
      { source: "/success-stories/priya-rohan", destination: "/success-stories", permanent: false },
      { source: "/success-stories/aisha-sameer", destination: "/success-stories", permanent: false },
      { source: "/success-stories/lakshmi-arjun", destination: "/success-stories", permanent: false },
      { source: "/success-stories/deepa-karthik", destination: "/success-stories", permanent: false },
    ];
  },
  images: {
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
      }
    ],
  },
};

export default nextConfig;
