import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

// 🔧 __dirname manual (para compatibilidad ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "i.ibb.co", pathname: "/**" }
    ],
  },
  webpack: (config) => {
    // 👇 Asegura que el alias @ siempre apunte a /src
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    console.log("✅ Alias @ configurado en:", config.resolve.alias["@"]);

    return config;
  },
};

export default nextConfig;
