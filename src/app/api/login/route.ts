import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/auth";
import { globalRateLimiter, getClientIp } from "@/lib/rate-limiter";

const RATE_LIMIT_OPTIONS = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 menit
  prefix: "user-login",
};

function getClientIdentifier(request: Request, email?: string): string {
  const ip = getClientIp(request);
  return email ? `${ip}_${email.trim().toLowerCase()}` : ip;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email?.trim?.()?.toLowerCase?.();
    const password = body?.password;

    const clientKey = getClientIdentifier(request, email);

    // 1. Periksa rate limit
    const blockStatus = globalRateLimiter.isBlocked(clientKey, RATE_LIMIT_OPTIONS);
    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${blockStatus.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(blockStatus.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Validasi input
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

    // 3. Cari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 4. Verifikasi kecocokan password dengan hash di database
    if (!user.password) {
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error: "Akun ini terdaftar menggunakan Google. Silakan masuk dengan tombol Masuk dengan Google.",
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 5. Login sukses: hapus riwayat percobaan gagal
    globalRateLimiter.reset(clientKey, RATE_LIMIT_OPTIONS.prefix);

    const sessionToken = await signUserToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          whatsapp: user.whatsapp,
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
