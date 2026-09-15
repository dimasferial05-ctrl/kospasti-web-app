import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/auth";

// In-memory rate limiting untuk percobaan login gagal
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const userLoginAttempts = new Map<string, RateLimitRecord>();
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
  const record = userLoginAttempts.get(key);

  if (!record) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (now > record.resetTime) {
    userLoginAttempts.delete(key);
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
  const record = userLoginAttempts.get(key);

  if (!record || now > record.resetTime) {
    userLoginAttempts.set(key, { count: 1, resetTime: now + LOCKOUT_PERIOD_MS });
  } else {
    record.count += 1;
  }
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientIdentifier(request);

    // 1. Periksa rate limit
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

    const body = await request.json().catch(() => null);
    const email = body?.email?.trim?.()?.toLowerCase?.();
    const password = body?.password;

    // 2. Validasi input
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

    // 3. Cari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      recordFailedAttempt(clientKey);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 4. Verifikasi kecocokan password dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(clientKey);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 5. Login sukses: hapus riwayat percobaan gagal
    userLoginAttempts.delete(clientKey);

    const sessionToken = await signUserToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // 6. Pasang Secure HTTP-Only Cookie
    response.cookies.set({
      name: "user_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Gagal memproses login pengguna:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat login.",
      },
      { status: 500 }
    );
  }
}
