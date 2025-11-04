import fs from "fs";

const configPath = "./next.config.ts";

if (fs.existsSync(configPath)) {
  let config = fs.readFileSync(configPath, "utf-8");

  if (!config.includes("config.resolve.alias")) {
    config = config.replace(
      /export default nextConfig;/,
      `
  nextConfig.webpack = (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': new URL('./src', import.meta.url).pathname,
    };
    return config;
  };

  export default nextConfig;
      `
    );

    fs.writeFileSync(configPath, config);
    console.log("✅ Alias @ restaurado antes del build");
  } else {
    console.log("ℹ️ Alias @ ya estaba configurado");
  }
} else {
  console.log("⚠️ No se encontró next.config.ts");
}
