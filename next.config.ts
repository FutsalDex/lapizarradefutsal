import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // Para Firebase Hosting (SSR)
  typescript: {
    ignoreBuildErrors: true,
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',  // Para Storage de Firebase
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
