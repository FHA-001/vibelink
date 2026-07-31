import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.42.1'],
  experimental: {
    turbo: {
      root: '.',
    },
  },
};

export default nextConfig;
