import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Use an absolute path to avoid warnings about inferred root
    root: process.cwd(),
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
