import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (modo demonstração) carrega WASM; não deve ser empacotado pelo bundler.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: { remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }] },
};

export default nextConfig;
