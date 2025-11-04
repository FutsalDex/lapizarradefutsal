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
      allowedDevelopmentOrigins: [
        'https://*.cloudworkstations.dev',
        'https://*.firebaseapp.com',
        'http://localhost:9100',
        'https://localhost:9100',
      ],
    },
  };
  
  module.exports = nextConfig;
  