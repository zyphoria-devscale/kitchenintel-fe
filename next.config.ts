import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add this line:
  suppressHydrationWarning: true,
  /* config options here */
};

export default nextConfig;
