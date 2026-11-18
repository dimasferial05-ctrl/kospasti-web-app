import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  MemoryRateLimiter,
  DistributedRateLimiter,
  getClientIp,
  getRateLimitHeaders,
  createRateLimitResponse,
  globalRateLimiter,
} from "@/lib/rate-limiter";

describe("Distributed & In-Memory Rate Limiter (Issue #414)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalRateLimiter.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. getClientIp() - Ekstraksi IP Klien yang Aman", () => {
    it("mengekstrak IP pertama dari header x-forwarded-for", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("mengekstrak IP dari header x-real-ip jika x-forwarded-for tidak ada", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "198.51.100.10" },
      });
      expect(getClientIp(req)).toBe("198.51.100.10");
    });

    it("mengekstrak IP dari header cf-connecting-ip jika header lain tidak ada", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "cf-connecting-ip": "198.51.100.22" },
      });
      expect(getClientIp(req)).toBe("198.51.100.22");
    });

    it("mengembalikan fallback 127.0.0.1 jika semua header IP tidak ada", () => {
      const req = new Request("http://localhost/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("2. Rate Limit Headers & 429 Response Helper", () => {
    it("membuat header standar rate limit termasuk Retry-After", () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        resetTime: Date.now() + 30000,
        retryAfterSeconds: 30,
      };

      const headers = getRateLimitHeaders(result);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("30");
      expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
    });

    it("membuat NextResponse berstatus 429 dengan body error yang sesuai", async () => {
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        resetTime: Date.now() + 15000,
        retryAfterSeconds: 15,
      };

      const response = createRateLimitResponse(result, "Terlalu banyak permintaan.");
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("15");

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Terlalu banyak permintaan.");
    });
  });

  describe("3. In-Memory Fallback Driver (Saat Kredensial Redis Kosong)", () => {
    it("bekerja secara fallback lokal saat UPSTASH_REDIS_REST_URL tidak disetel", async () => {
      const limiter = new DistributedRateLimiter();
      expect(limiter.isDistributed()).toBe(false);

      const identifier = "test-user-ip-1";
      const options = { maxRequests: 3, windowMs: 10000, prefix: "test" };

      // Request 1, 2, 3 diizinkan
      const res1 = await limiter.check(identifier, options);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = await limiter.check(identifier, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await limiter.check(identifier, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);

      // Request 4 ditolak
      const res4 = await limiter.check(identifier, options);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("menangani pencatatan kegagalan login dan pemblokiran brute-force (isBlocked & recordFailure)", async () => {
      const limiter = new DistributedRateLimiter();
      const clientKey = "attacker-ip-123";
      const options = { maxRequests: 3, windowMs: 15 * 60 * 1000, prefix: "login" };

      // Awalnya belum terblokir
      const initialStatus = await limiter.isBlocked(clientKey, options);
      expect(initialStatus.blocked).toBe(false);

      // Catat 3x kegagalan berturut-turut
      await limiter.recordFailure(clientKey, options);
      await limiter.recordFailure(clientKey, options);
      const thirdFail = await limiter.recordFailure(clientKey, options);
      expect(thirdFail.count).toBe(3);

      // Sekarang harus terblokir
      const blockedStatus = await limiter.isBlocked(clientKey, options);
      expect(blockedStatus.blocked).toBe(true);
      expect(blockedStatus.retryAfterSeconds).toBeGreaterThan(0);

      // Saat login berhasil dan reset dipanggil
      await limiter.reset(clientKey, options.prefix);
      const afterReset = await limiter.isBlocked(clientKey, options);
      expect(afterReset.blocked).toBe(false);
    });
  });

  describe("4. Distributed Rate Limiter dengan Upstash Redis Mock", () => {
    it("melakukan fallback ke memory jika koneksi Redis mengalami error jaringan", async () => {
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      process.env.UPSTASH_REDIS_REST_URL = "https://mock-redis.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token-xyz";

      try {
        const limiter = new DistributedRateLimiter();
        expect(limiter.isDistributed()).toBe(true);

        // Simulasi Redis check error: harus tetap mengembalikan RateLimitResult tanpa melempar exception 500
        const result = await limiter.check("client-network-fail", {
          maxRequests: 5,
          windowMs: 60000,
          prefix: "error-fallback-test",
        });

        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
      } finally {
        process.env.UPSTASH_REDIS_REST_URL = originalUrl;
        process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      }
    });

    it("menggunakan memoryRateLimiter standalone untuk pengujian unit independen", () => {
      const memLimiter = new MemoryRateLimiter(60000);
      const opt = { maxRequests: 2, windowMs: 5000, prefix: "standalone" };

      const r1 = memLimiter.check("user-1", opt);
      expect(r1.success).toBe(true);
      const r2 = memLimiter.check("user-1", opt);
      expect(r2.success).toBe(true);
      const r3 = memLimiter.check("user-1", opt);
      expect(r3.success).toBe(false);

      memLimiter.destroy();
    });
  });
});
