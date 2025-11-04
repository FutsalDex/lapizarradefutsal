import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora errores de TypeScript durante el build en Firebase
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  images: {
    // Permite cargar imágenes desde estos dominios externos
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // 👇 Este bloque soluciona el error de Firebase
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
