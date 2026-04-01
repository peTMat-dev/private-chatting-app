import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Set root to monorepo root so Turbopack can follow pnpm symlinks
    // from client/node_modules into the shared parent .pnpm store
    root: path.resolve(process.cwd(), '..'),
  },
  // Explicitly allow dev asset requests from your app domain
  // to future-proof against stricter defaults.
  allowedDevOrigins: [
    // Hostname-only form
    "app.lenez.dev",
    // Explicit schemes as well
    "https://app.lenez.dev",
    "http://app.lenez.dev",
  ],
};

export default nextConfig;
