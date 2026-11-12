import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
          sameOrigin && url.pathname === "/api/user/wishlist",
        handler: "NetworkFirst",
        options: {
          cacheName: "kospasti-api-wishlist",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
          sameOrigin && url.pathname === "/api/auth/me",
        handler: "NetworkFirst",
        options: {
          cacheName: "kospasti-api-auth",
          networkTimeoutSeconds: 2,
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
          sameOrigin &&
          (/^\/api\/bookings\/[^/]+$/i.test(url.pathname) ||
            url.pathname === "/api/user/bookings"),
        handler: "NetworkFirst",
        options: {
          cacheName: "kospasti-api-receipts",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
          sameOrigin &&
          (url.pathname === "/favorit" || url.pathname.startsWith("/receipt/")),
        handler: "NetworkFirst",
        options: {
          cacheName: "kospasti-offline-pages",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern:
          /^https:\/\/(?:[^/]+\.supabase\.co|images\.unsplash\.com|lh3\.googleusercontent\.com)\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "kospasti-external-images",
          expiration: {
            maxEntries: 120,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rghnaikrurcwctqxdsjo.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
};

export default withPWA(nextConfig);
