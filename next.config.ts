import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  output: 'standalone',
  devIndicators: {
    // @ts-ignore
    buildActivity: false,
    position: 'bottom-right',
  },
};

export default nextConfig;
