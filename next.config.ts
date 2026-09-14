import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memberi tahu Vercel untuk membawa file database SQLite saat deploy
  // (Format baru untuk Next.js 15 & 16 ke atas)
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
};

export default nextConfig;