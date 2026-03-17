import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zapsight/preview", "@zapsight/storage"],
};

export default nextConfig;
