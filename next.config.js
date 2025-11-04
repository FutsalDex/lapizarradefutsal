/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
    ],
  },
  experimental: {
    allowedDevelopmentOrigins: ['https://*.firebase.app', 'https://*.web.app'],
  },
};

export default nextConfig;
