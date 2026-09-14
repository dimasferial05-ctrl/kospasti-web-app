import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memberi tahu Vercel untuk membawa file database SQLite saat deploy
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./prisma/**/*"],
    },
  },
};

export default nextConfig;