import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { isSafeRedirectPath } from "@/lib/auth";
import { GET as googleCallbackGET } from "@/app/api/auth/callback/google/route";
import { GET as googleInitGET } from "@/app/api/auth/google/route";
import { middleware } from "@/middleware";
import { prisma } from "@/lib/prisma";

describe("Open Redirect Security & Protocol-Relative URL Protection (Issue #275)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "mock-google-client-id",
      GOOGLE_CLIENT_SECRET: "mock-google-client-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Unit Test Fungsi Helper isSafeRedirectPath", () => {
    it("Menolak URL yang diawali garis miring ganda (//) yang merupakan protocol-relative URL", () => {
      expect(isSafeRedirectPath("//attacker.com")).toBe(false);
      expect(isSafeRedirectPath("//attacker.com/evil")).toBe(false);
      expect(isSafeRedirectPath("//phishing.com/fake-login")).toBe(false);
      expect(isSafeRedirectPath("///evil.com")).toBe(false);
    });

    it("Menolak URL yang diawali kombinasi backslash (/\\ atau \\\\)", () => {
      expect(isSafeRedirectPath("/\\attacker.com")).toBe(false);
      expect(isSafeRedirectPath("\\\\attacker.com")).toBe(false);
      expect(isSafeRedirectPath("\\attacker.com")).toBe(false);
    });

    it("Menolak URL absolut eksternal atau skema berbahaya lainnya", () => {
      expect(isSafeRedirectPath("https://attacker.com")).toBe(false);
      expect(isSafeRedirectPath("http://evil.com")).toBe(false);
      expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
      expect(isSafeRedirectPath("data:text/html,evil")).toBe(false);
    });

    it("Menolak input kosong, null, undefined, atau tipe data non-string", () => {
      expect(isSafeRedirectPath("")).toBe(false);
      expect(isSafeRedirectPath(null)).toBe(false);
      expect(isSafeRedirectPath(undefined)).toBe(false);
      expect(isSafeRedirectPath(123 as unknown as string)).toBe(false);
    });

    it("Menerima path internal lokal yang sah", () => {
      expect(isSafeRedirectPath("/")).toBe(true);
      expect(isSafeRedirectPath("/profil")).toBe(true);
      expect(isSafeRedirectPath("/pesanan")).toBe(true);
      expect(isSafeRedirectPath("/checkout")).toBe(true);
      expect(isSafeRedirectPath("/kos/room-uuid-123")).toBe(true);
      expect(isSafeRedirectPath("/kos/room-uuid-123?tab=ulasan&sort=desc")).toBe(true);
    });
  });

  describe("2. Proteksi Open Redirect pada Handler Callback Google OAuth (GET /api/auth/callback/google)", () => {
    beforeEach(() => {
      // Mock network calls to Google token and userinfo endpoints
      global.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes("oauth2.googleapis.com/token")) {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-access-token" }),
          };
        }
        if (urlStr.includes("googleapis.com/oauth2/v2/userinfo")) {
          return {
            ok: true,
            json: async () => ({
              id: "google-user-123",
              email: "victim@example.com",
              name: "Victim User",
              picture: "https://lh3.googleusercontent.com/avatar.jpg",
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }) as unknown as typeof fetch;

      // Mock database lookup and update
      const mockUserRecord = {
        id: "user-123",
        email: "victim@example.com",
        name: "Victim User",
        whatsapp: "081234567890",
        avatar: "/uploads/avatars/user.jpg",
        bio: "User bio",
        google_id: "google-user-123",
        password_hash: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(prisma.user, "findFirst").mockResolvedValue(mockUserRecord as unknown as never);
      vi.spyOn(prisma.user, "update").mockResolvedValue(mockUserRecord as unknown as never);
    });

    it("Mengarahkan ke fallback '/' ketika state berisi '//attacker.com'", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/callback/google?code=valid_code&state=%2F%2Fattacker.com"
      );
      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
      expect(location).not.toContain("attacker.com");
    });

    it("Mengarahkan ke fallback '/' ketika state berisi '/\\\\malicious.com'", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/callback/google?code=valid_code&state=%2F%5Cmalicious.com"
      );
      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });

    it("Mengarahkan ke fallback '/' ketika state berisi URL absolut eksternal", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/callback/google?code=valid_code&state=https%3A%2F%2Fevil.com"
      );
      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });

    it("Mengarahkan ke path internal yang sah jika state valid (misal '/profil')", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/callback/google?code=valid_code&state=%2Fprofil"
      );
      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/profil");
    });

    it("Mengarahkan ke fallback '/' jika state bernilai null atau kosong", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/callback/google?code=valid_code"
      );
      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });
  });

  describe("3. Proteksi Open Redirect pada Middleware (src/middleware.ts)", () => {
    it("Mengarahkan ke fallback '/' jika callbackUrl pada /login berisi '//attacker.com'", () => {
      const req = new NextRequest("http://localhost:3000/login?callbackUrl=%2F%2Fattacker.com", {
        headers: {
          cookie: "user_token=dummy_valid_token",
        },
      });

      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
      expect(location).not.toContain("attacker.com");
    });

    it("Mengarahkan ke fallback '/' jika callbackUrl pada /register berisi '/\\\\evil.com'", () => {
      const req = new NextRequest("http://localhost:3000/register?callbackUrl=%2F%5Cevil.com", {
        headers: {
          cookie: "user_token=dummy_valid_token",
        },
      });

      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });

    it("Mengarahkan ke path yang diminta jika callbackUrl sah (misal '/pesanan')", () => {
      const req = new NextRequest("http://localhost:3000/login?callbackUrl=%2Fpesanan", {
        headers: {
          cookie: "user_token=dummy_valid_token",
        },
      });

      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/pesanan");
    });

    it("Mengarahkan ke fallback '/' jika callbackUrl tidak disertakan", () => {
      const req = new NextRequest("http://localhost:3000/login", {
        headers: {
          cookie: "user_token=dummy_valid_token",
        },
      });

      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });
  });

  describe("4. Defense-in-Depth pada Inisiasi Google OAuth (GET /api/auth/google)", () => {
    it("Memfilter parameter callbackUrl berbahaya dan mengirimkan state '/' ke Google OAuth", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/google?callbackUrl=%2F%2Fattacker.com"
      );
      const res = await googleInitGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBeDefined();

      const parsedUrl = new URL(location!);
      expect(parsedUrl.hostname).toBe("accounts.google.com");
      expect(parsedUrl.searchParams.get("state")).toBe("/");
    });

    it("Meneruskan callbackUrl internal yang sah ke parameter state Google OAuth", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/google?callbackUrl=%2Fkos%2Froom-123"
      );
      const res = await googleInitGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBeDefined();

      const parsedUrl = new URL(location!);
      expect(parsedUrl.searchParams.get("state")).toBe("/kos/room-123");
    });
  });
});
