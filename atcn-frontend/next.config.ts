import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from the FastAPI backend during development
  async rewrites() {
    return [];
  },
};

export default nextConfig;
