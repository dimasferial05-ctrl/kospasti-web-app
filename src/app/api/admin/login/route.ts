import { NextResponse } from "next/server";
import crypto from "crypto";

// In-memory rate limiting for failed login attempts
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 15 * 60 * 1000; // 15 menit

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "default_client";
}

function checkRateLimit(key: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (now > record.resetTime) {
    loginAttempts.delete(key);
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + LOCKOUT_PERIOD_MS });
  } else {
    record.count += 1;
  }
}

// Constant-time string comparison using sha256 digests to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientIdentifier(request);

    // Periksa rate limiting
    const { limited, retryAfterSeconds } = checkRateLimit(clientKey);
    if (limited) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak percobaan login gagal. Silakan coba lagi beberapa saat lagi.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;

    // Pastikan environment variables sudah dikonfigurasi
    if (!validEmail || !validPassword) {
      console.error(
        "ADMIN_EMAIL atau ADMIN_PASSWORD belum dikonfigurasi di environment variables."
      );
      return NextResponse.json(
        {
          success: false,
          error: "Konfigurasi autentikasi server belum lengkap.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = body?.email?.trim?.();
    const password = body?.password;

    if (!email || !password) {
      recordFailedAttempt(clientKey);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    const isEmailValid = safeCompare(email.toLowerCase(), validEmail.toLowerCase());
    const isPasswordValid = safeCompare(password, validPassword);

    if (!isEmailValid || !isPasswordValid) {
      recordFailedAttempt(clientKey);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // Login sukses: reset status percobaan untuk client ini
    loginAttempts.delete(clientKey);

    const response = NextResponse.json(
      {
        success: true,
        message: "Login admin berhasil.",
      },
      { status: 200 }
    );

    // Set secure HTTP-Only Cookie
    response.cookies.set({
      name: "admin_token",
      value: "kospasti_admin_authenticated",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 86400, // 1 day
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Gagal memproses login admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server.",
      },
      { status: 500 }
    );
  }
}

