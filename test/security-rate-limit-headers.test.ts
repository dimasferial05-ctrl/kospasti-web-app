import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  MemoryRateLimiter,
  getClientIp,
  getRateLimitHeaders,
  createRateLimitResponse,
  globalRateLimiter,
} from "@/lib/rate-limiter";
import { POST as aiSearchPOST } from "@/app/api/ai-search/route";
import { POST as generateDescriptionPOST } from "@/app/api/ai/generate-description/route";
import { POST as magicLinkGeneratePOST } from "@/app/api/magic-link/generate/route";
import { POST as loginPOST } from "@/app/api/login/route";
import { POST as partnerLoginPOST } from "@/app/api/partner/login/route";
import { prisma } from "@/lib/prisma";
import nextConfigExport from "../next.config";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === "admin_token") {
        return { value: "kospasti_admin_authenticated" };
      }
      return undefined;
    }),
  }),
}));

describe("Security Hardening, Rate Limiting & API Protection (Issue #366)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalRateLimiter.clear();
    process.env = {
      ...originalEnv,
      ADMIN_TOKEN: "kospasti_admin_authenticated",
      ADMIN_EMAIL: "admin@kospasti.com",
      ADMIN_PASSWORD: "adminpassword",
      GEMINI_API_KEY: "",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. MemoryRateLimiter Engine & Helpers", () => {
    it("menghitung request dan sisa kuota dengan benar", () => {
      const limiter = new MemoryRateLimiter();
      const options = { maxRequests: 3, windowMs: 1000, prefix: "test" };

      const r1 = limiter.check("user-1", options);
      expect(r1.success).toBe(true);
      expect(r1.limit).toBe(3);
      expect(r1.remaining).toBe(2);
      expect(r1.retryAfterSeconds).toBe(0);

      const r2 = limiter.check("user-1", options);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check("user-1", options);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // Request ke-4 harus terblokir
      const r4 = limiter.check("user-1", options);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThan(0);

      limiter.destroy();
    });

    it("mereset counter setelah rentang waktu windowMs kedaluwarsa", () => {
      const limiter = new MemoryRateLimiter();
      const options = { maxRequests: 2, windowMs: 100, prefix: "window-test" };

      limiter.check("user-expiry", options);
      limiter.check("user-expiry", options);
      const blocked = limiter.check("user-expiry", options);
      expect(blocked.success).toBe(false);

      // Mock waktu 150ms ke depan
      const originalNow = Date.now;
      vi.spyOn(Date, "now").mockReturnValue(originalNow() + 200);

      const afterExpiry = limiter.check("user-expiry", options);
      expect(afterExpiry.success).toBe(true);
      expect(afterExpiry.remaining).toBe(1);

      limiter.destroy();
    });

    it("mendukung mode brute-force (isBlocked & recordFailure)", () => {
      const limiter = new MemoryRateLimiter();
      const options = { maxRequests: 3, windowMs: 60000, prefix: "bf-test" };

      expect(limiter.isBlocked("client-a", options).blocked).toBe(false);

      limiter.recordFailure("client-a", options);
      limiter.recordFailure("client-a", options);
      expect(limiter.isBlocked("client-a", options).blocked).toBe(false);

      limiter.recordFailure("client-a", options);
      const blockCheck = limiter.isBlocked("client-a", options);
      expect(blockCheck.blocked).toBe(true);
      expect(blockCheck.retryAfterSeconds).toBeGreaterThan(0);

      limiter.reset("client-a", options.prefix);
      expect(limiter.isBlocked("client-a", options).blocked).toBe(false);

      limiter.destroy();
    });

    it("ekstraksi getClientIp membaca header x-forwarded-for, x-real-ip, dan fallback secara akurat", () => {
      const reqForwarded = new Request("http://localhost", {
        headers: { "x-forwarded-for": "103.111.22.33, 10.0.0.1" },
      });
      expect(getClientIp(reqForwarded)).toBe("103.111.22.33");

      const reqRealIp = new Request("http://localhost", {
        headers: { "x-real-ip": "114.122.5.6" },
      });
      expect(getClientIp(reqRealIp)).toBe("114.122.5.6");

      const reqFallback = new Request("http://localhost");
      expect(getClientIp(reqFallback)).toBe("127.0.0.1");
    });

    it("getRateLimitHeaders menyertakan header rate limit standar", () => {
      const headers = getRateLimitHeaders({
        success: false,
        limit: 10,
        remaining: 0,
        resetTime: 1700000000000,
        retryAfterSeconds: 45,
      });

      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["X-RateLimit-Reset"]).toBe(String(Math.ceil(1700000000000 / 1000)));
      expect(headers["Retry-After"]).toBe("45");
    });

    it("createRateLimitResponse mengembalikan status HTTP 429 dan format JSON yang tepat", async () => {
      const res = createRateLimitResponse(
        {
          success: false,
          limit: 5,
          remaining: 0,
          resetTime: Date.now() + 30000,
          retryAfterSeconds: 30,
        },
        "Akses dibatasi sementara."
      );

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Akses dibatasi sementara.");
      expect(res.headers.get("Retry-After")).toBe("30");
    });
  });

  describe("2. Rate Limiting pada AI Search (/api/ai-search)", () => {
    it("memblokir permintaan ke-11 dari IP yang sama dalam 1 menit (Maks 10 req/menit)", async () => {
      const testIp = "192.168.10.15";

      for (let i = 0; i < 10; i++) {
        const req = new Request("http://localhost/api/ai-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": testIp,
          },
          body: JSON.stringify({ prompt: "kos murah cibogo subang" }),
        });
        const res = await aiSearchPOST(req);
        expect(res.status).not.toBe(429);
      }

      // Permintaan ke-11 harus diblokir oleh rate limiter (429)
      const blockedReq = new Request("http://localhost/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ prompt: "kos murah cibogo subang" }),
      });
      const blockedRes = await aiSearchPOST(blockedReq);
      expect(blockedRes.status).toBe(429);

      const json = await blockedRes.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Batas pencarian AI tercapai");
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    });
  });

  describe("3. Rate Limiting pada Generate Deskripsi AI (/api/ai/generate-description)", () => {
    it("memblokir permintaan ke-11 jika melebihi batas kuota generate deskripsi", async () => {
      const testIp = "192.168.10.16";

      // Panggil 10 kali sampai limit habis
      for (let i = 0; i < 10; i++) {
        globalRateLimiter.check(`ip:${testIp}`, {
          maxRequests: 10,
          windowMs: 60 * 1000,
          prefix: "ai-description",
        });
      }

      const req = new Request("http://localhost/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({ name: "Kos Bunga Subang" }),
      });

      const res = await generateDescriptionPOST(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Batas generate deskripsi AI tercapai");
    });
  });

  describe("4. Rate Limiting pada Magic Link Generation (/api/magic-link/generate)", () => {
    it("memblokir permintaan pembuatan Magic Link ke-6 dari IP yang sama dalam 5 menit", async () => {
      const testIp = "192.168.10.17";
      vi.spyOn(prisma.owner, "findUnique").mockResolvedValue({
        id: "owner-1",
        name: "Owner Test",
        email: "owner@test.com",
        whatsapp_number: "08123456789",
        password: "hash",
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      vi.spyOn(prisma.magicLink, "updateMany").mockResolvedValue({ count: 1 });
      vi.spyOn(prisma.magicLink, "create").mockResolvedValue({} as any);

      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost/api/magic-link/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": testIp,
            cookie: "admin_token=kospasti_admin_authenticated",
          },
          body: JSON.stringify({ ownerId: "owner-1" }),
        });
        const res = await magicLinkGeneratePOST(req);
        expect(res.status).toBe(200);
      }

      // Request ke-6 harus 429
      const blockedReq = new Request("http://localhost/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({ ownerId: "owner-1" }),
      });

      const blockedRes = await magicLinkGeneratePOST(blockedReq);
      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Terlalu banyak permintaan pembuatan Magic Link");
    });
  });

  describe("5. Rate Limiting pada User & Partner Login (Brute Force Protection)", () => {
    it("User Login (/api/login) memblokir setelah 5 kali percobaan gagal berturut-turut", async () => {
      const testIp = "192.168.10.18";
      const email = "user.brute@example.com";
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": testIp,
          },
          body: JSON.stringify({ email, password: "wrongpassword" }),
        });
        const res = await loginPOST(req);
        expect(res.status).toBe(401);
      }

      // Percobaan ke-6 harus diblokir rate limit 429
      const blockedReq = new Request("http://localhost/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ email, password: "wrongpassword" }),
      });
      const blockedRes = await loginPOST(blockedReq);
      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Terlalu banyak percobaan login gagal");
    });

    it("Partner Login (/api/partner/login) memblokir setelah 5 kali percobaan gagal berturut-turut", async () => {
      const testIp = "192.168.10.19";
      const email = "partner.brute@example.com";
      vi.spyOn(prisma.owner, "findUnique").mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost/api/partner/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": testIp,
          },
          body: JSON.stringify({ email, password: "wrongpassword" }),
        });
        const res = await partnerLoginPOST(req);
        expect(res.status).toBe(401);
      }

      // Percobaan ke-6 harus 429
      const blockedReq = new Request("http://localhost/api/partner/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ email, password: "wrongpassword" }),
      });
      const blockedRes = await partnerLoginPOST(blockedReq);
      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Terlalu banyak percobaan login gagal");
    });
  });

  describe("6. Security Headers & Clean next.config.ts", () => {
    it("next.config.ts tidak lagi mengabaikan error TypeScript (ignoreBuildErrors tidak boleh true)", () => {
      const config = nextConfigExport;
      expect(config?.typescript?.ignoreBuildErrors).toBeFalsy();
    });

    it("next.config.ts menyuntikkan header keamanan lengkap (X-Frame-Options, X-Content-Type-Options, dll)", async () => {
      const config = nextConfigExport;
      expect(typeof config?.headers).toBe("function");

      const headersList = await config.headers!();
      expect(Array.isArray(headersList)).toBe(true);
      expect(headersList.length).toBeGreaterThan(0);

      const allRouteConfig = headersList.find((h: { source: string }) => h.source === "/(.*)");
      expect(allRouteConfig).toBeDefined();

      const headerMap = new Map<string, string>();
      allRouteConfig.headers.forEach((h: { key: string; value: string }) => {
        headerMap.set(h.key.toLowerCase(), h.value);
      });

      expect(headerMap.get("x-frame-options")).toBe("DENY");
      expect(headerMap.get("x-content-type-options")).toBe("nosniff");
      expect(headerMap.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(headerMap.get("permissions-policy")).toContain("camera=()");
      expect(headerMap.get("permissions-policy")).toContain("microphone=()");
      expect(headerMap.get("x-xss-protection")).toBe("1; mode=block");
    });
  });
});
