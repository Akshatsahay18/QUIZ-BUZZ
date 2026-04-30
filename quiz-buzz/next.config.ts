import type { NextConfig } from "next";

const apiOrigin = process.env.QUIZ_BUZZ_API_ORIGIN ?? "http://localhost:8040";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
