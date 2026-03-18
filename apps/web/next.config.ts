import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zapsight/preview", "@zapsight/storage", "@zapsight/crawl", "@zapsight/db", "@zapsight/widget", "@zapsight/renderer"],
};

export default nextConfig;
