import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@zapsight/preview", "@zapsight/storage", "@zapsight/crawl", "@zapsight/db", "@zapsight/widget", "@zapsight/renderer"],
  async headers() {
    return [
      {
        // Preview pages — override any baked-in CSP so our widget & API calls work
        source: "/p/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
          },
        ],
      },
      {
        // API endpoints — allow cross-origin requests from preview pages on any domain
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
