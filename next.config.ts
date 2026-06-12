import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: 'eslint' key removed — use eslint.config.mjs for linting config
};

export default nextConfig;
