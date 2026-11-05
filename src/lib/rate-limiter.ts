import { NextResponse } from "next/server";

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

// Instance global untuk penggunaan lintas route
export const globalRateLimiter = new MemoryRateLimiter();

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
