import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  maxRequests: number; // Jumlah batas request maksimum
  windowMs: number; // Rentang waktu dalam milidetik (misal 60_000 untuk 1 menit)
  prefix?: string; // Prefix namespace (misal 'ai-search', 'auth')
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

export class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs = 5 * 60 * 1000) {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
      if (this.cleanupInterval?.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private getKey(identifier: string, prefix?: string): string {
    return prefix ? `${prefix}:${identifier}` : identifier;
  }

  /**
   * Mengecek kuota request dan menambah counter (sliding/fixed window).
   * Cocok untuk rate limiting endpoint umum (seperti AI search).
   */
  public check(identifier: string, options: RateLimitOptions): RateLimitResult {
    const key = this.getKey(identifier, options.prefix);
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now >= record.resetTime) {
      const resetTime = now + options.windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - 1),
        resetTime,
        retryAfterSeconds: 0,
      };
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      return {
        success: false,
        limit: options.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfterSeconds,
      };
    }

    record.count += 1;
    return {
      success: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - record.count),
      resetTime: record.resetTime,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Hanya mengecek apakah identifier sedang dalam kondisi terblokir.
   * Tidak menambah counter secara otomatis (berguna untuk auth brute-force).
   */
  public isBlocked(
    identifier: string,
    options: RateLimitOptions
  ): { blocked: boolean; retryAfterSeconds: number; resetTime: number } {
    const key = this.getKey(identifier, options.prefix);
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      return { blocked: false, retryAfterSeconds: 0, resetTime: 0 };
    }

    if (now >= record.resetTime) {
      this.store.delete(key);
      return { blocked: false, retryAfterSeconds: 0, resetTime: 0 };
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      return { blocked: true, retryAfterSeconds, resetTime: record.resetTime };
    }

    return { blocked: false, retryAfterSeconds: 0, resetTime: record.resetTime };
  }

  /**
   * Mencatat kegagalan (misalnya password salah pada endpoint auth).
   */
  public recordFailure(identifier: string, options: RateLimitOptions): RateLimitRecord {
    const key = this.getKey(identifier, options.prefix);
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now >= record.resetTime) {
      const newRecord = { count: 1, resetTime: now + options.windowMs };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count += 1;
    return record;
  }

  /**
   * Menghapus record identifier (misalnya saat login berhasil).
   */
  public reset(identifier: string, prefix?: string): void {
    const key = this.getKey(identifier, prefix);
    this.store.delete(key);
  }

  /**
   * Membersihkan semua record (berguna saat unit testing).
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Membersihkan record yang sudah melewati masa resetTime.
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Menghentikan interval pembersihan saat instance tidak digunakan lagi.
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * DistributedRateLimiter:
 * Menggunakan Upstash Redis via REST API (@upstash/redis & @upstash/ratelimit)
 * untuk rate limiting terdistribusi di lingkungan serverless multi-instance.
 * Jika kredensial Upstash belum dikonfigurasi, otomatis fallback ke MemoryRateLimiter.
 */
export class DistributedRateLimiter {
  private memoryFallback = new MemoryRateLimiter();
  private redisClient: Redis | null = null;
  private ratelimitInstances = new Map<string, Ratelimit>();

  constructor() {
    this.initRedis();
  }

  private initRedis(): void {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    if (url && token) {
      try {
        this.redisClient = new Redis({ url, token });
      } catch (error) {
        console.warn(
          "[RateLimiter] Gagal menginisialisasi Upstash Redis, beralih ke in-memory fallback:",
          error
        );
        this.redisClient = null;
      }
    } else {
      this.redisClient = null;
    }
  }

  public isDistributed(): boolean {
    return this.redisClient !== null;
  }

  /**
   * Mengecek kuota request dan menambah counter.
   */
  public async check(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    if (!this.redisClient) {
      return this.memoryFallback.check(identifier, options);
    }

    try {
      const prefix = options.prefix || "global";
      const cacheKey = `${prefix}:${options.maxRequests}:${options.windowMs}`;

      let limiter = this.ratelimitInstances.get(cacheKey);
      if (!limiter) {
        limiter = new Ratelimit({
          redis: this.redisClient,
          limiter: Ratelimit.slidingWindow(
            options.maxRequests,
            `${Math.ceil(options.windowMs / 1000)} s`
          ),
          prefix: `kospasti:${prefix}`,
          analytics: false,
        });
        this.ratelimitInstances.set(cacheKey, limiter);
      }

      const result = await limiter.limit(identifier);
      const now = Date.now();
      const retryAfterSeconds = result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - now) / 1000));

      return {
        success: result.success,
        limit: options.maxRequests,
        remaining: result.remaining,
        resetTime: result.reset,
        retryAfterSeconds,
      };
    } catch (error) {
      console.error("[RateLimiter] Redis check error, fallback ke in-memory:", error);
      return this.memoryFallback.check(identifier, options);
    }
  }

  /**
   * Memeriksa apakah identifier sedang terblokir (untuk login brute-force guard).
   */
  public async isBlocked(
    identifier: string,
    options: RateLimitOptions
  ): Promise<{ blocked: boolean; retryAfterSeconds: number; resetTime: number }> {
    if (!this.redisClient) {
      return this.memoryFallback.isBlocked(identifier, options);
    }

    try {
      const prefix = options.prefix || "auth";
      const key = `kospasti:${prefix}:fail:${identifier}`;
      const record = await this.redisClient.get<{ count: number; resetTime: number }>(key);

      if (!record) {
        return { blocked: false, retryAfterSeconds: 0, resetTime: 0 };
      }

      const now = Date.now();
      if (now >= record.resetTime) {
        await this.redisClient.del(key);
        return { blocked: false, retryAfterSeconds: 0, resetTime: 0 };
      }

      if (record.count >= options.maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        return { blocked: true, retryAfterSeconds, resetTime: record.resetTime };
      }

      return { blocked: false, retryAfterSeconds: 0, resetTime: record.resetTime };
    } catch (error) {
      console.error("[RateLimiter] Redis isBlocked error, fallback ke in-memory:", error);
      return this.memoryFallback.isBlocked(identifier, options);
    }
  }

  /**
   * Mencatat kegagalan percobaan login.
   */
  public async recordFailure(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitRecord> {
    if (!this.redisClient) {
      return this.memoryFallback.recordFailure(identifier, options);
    }

    try {
      const prefix = options.prefix || "auth";
      const key = `kospasti:${prefix}:fail:${identifier}`;
      const now = Date.now();
      const record = await this.redisClient.get<RateLimitRecord>(key);

      if (!record || now >= record.resetTime) {
        const newRecord: RateLimitRecord = { count: 1, resetTime: now + options.windowMs };
        const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
        await this.redisClient.set(key, newRecord, { ex: ttlSeconds });
        return newRecord;
      }

      const updatedRecord: RateLimitRecord = {
        count: record.count + 1,
        resetTime: record.resetTime,
      };
      const remainingTtlSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      await this.redisClient.set(key, updatedRecord, { ex: remainingTtlSeconds });
      return updatedRecord;
    } catch (error) {
      console.error("[RateLimiter] Redis recordFailure error, fallback ke in-memory:", error);
      return this.memoryFallback.recordFailure(identifier, options);
    }
  }

  /**
   * Menghapus catatan kegagalan saat login berhasil.
   */
  public async reset(identifier: string, prefix?: string): Promise<void> {
    if (!this.redisClient) {
      return this.memoryFallback.reset(identifier, prefix);
    }

    try {
      const pfx = prefix || "auth";
      const key = `kospasti:${pfx}:fail:${identifier}`;
      await this.redisClient.del(key);
    } catch (error) {
      console.error("[RateLimiter] Redis reset error, fallback ke in-memory:", error);
      this.memoryFallback.reset(identifier, prefix);
    }
  }

  public clear(): void {
    this.memoryFallback.clear();
    this.ratelimitInstances.clear();
  }

  public getMemoryFallback(): MemoryRateLimiter {
    return this.memoryFallback;
  }
}

/**
 * Ekstraksi IP klien secara aman dari request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Membuat dictionary header rate limit standar.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };

  if (result.retryAfterSeconds > 0) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Membuat response 429 Too Many Requests standar.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const message =
    customMessage ||
    `Terlalu banyak permintaan. Silakan coba lagi dalam ${result.retryAfterSeconds} detik.`;

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}

// Instance global untuk penggunaan lintas route (Distributed dengan In-Memory Fallback)
export const globalRateLimiter = new DistributedRateLimiter();

// Objek helper untuk pengujian atau backwards compatibility
export const userLoginAttempts = {
  clear: () => globalRateLimiter.clear(),
};
export const partnerLoginAttempts = {
  clear: () => globalRateLimiter.clear(),
};
export const loginAttempts = {
  clear: () => globalRateLimiter.clear(),
};
