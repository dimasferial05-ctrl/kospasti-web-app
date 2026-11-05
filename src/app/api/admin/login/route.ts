import { NextResponse } from "next/server";
import crypto from "crypto";
import { getValidAdminToken } from "@/lib/admin-auth";
import { globalRateLimiter, getClientIp } from "@/lib/rate-limiter";

const RATE_LIMIT_OPTIONS = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 menit
  prefix: "admin-login",
};

// Constant-time string comparison using sha256 digests to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientIp(request);

    // 1. Periksa rate limiting
    const blockStatus = globalRateLimiter.isBlocked(clientKey, RATE_LIMIT_OPTIONS);
    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak percobaan login gagal. Silakan coba lagi beberapa saat lagi.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(blockStatus.retryAfterSeconds),
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
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
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
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // Login sukses: reset status percobaan untuk client ini
    globalRateLimiter.reset(clientKey, RATE_LIMIT_OPTIONS.prefix);

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
      value: getValidAdminToken(),
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
