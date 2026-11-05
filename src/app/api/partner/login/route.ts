import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signOwnerToken } from "@/lib/auth";
import { globalRateLimiter, getClientIp } from "@/lib/rate-limiter";

const RATE_LIMIT_OPTIONS = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 menit
  prefix: "partner-login",
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
          error: "Email dan password wajib diisi.",
        },
        { status: 401 }
      );
    }

    // 3. Cari owner berdasarkan email
    const owner = await prisma.owner.findUnique({
      where: { email },
    });

    if (!owner) {
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 4. Verifikasi apakah pemilik memiliki password (jika hanya terdaftar via nomor WhatsApp admin)
    if (!owner.password) {
      globalRateLimiter.recordFailure(clientKey, RATE_LIMIT_OPTIONS);
      return NextResponse.json(
        {
          success: false,
          error:
            "Akun ini terdaftar melalui program kemitraan konvensional via WhatsApp. Silakan hubungi Admin atau perbarui kata sandi.",
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, owner.password);
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

    // 5. Login sukses: bersihkan failed attempts
    globalRateLimiter.reset(clientKey, RATE_LIMIT_OPTIONS.prefix);

    const sessionToken = await signOwnerToken({
      ownerId: owner.id,
      email: owner.email,
      name: owner.name,
      whatsapp_number: owner.whatsapp_number,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login mitra berhasil.",
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          whatsapp_number: owner.whatsapp_number,
        },
      },
      { status: 200 }
    );

    // 6. Pasang Secure HTTP-Only Cookie
    response.cookies.set({
      name: "partner_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Gagal memproses login mitra:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat login mitra.",
      },
      { status: 500 }
    );
  }
}
