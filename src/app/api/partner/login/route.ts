import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signOwnerToken } from "@/lib/auth";

// In-memory rate limiting untuk percobaan login gagal
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const partnerLoginAttempts = new Map<string, RateLimitRecord>();
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
  const record = partnerLoginAttempts.get(key);

  if (!record) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (now > record.resetTime) {
    partnerLoginAttempts.delete(key);
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
  const record = partnerLoginAttempts.get(key);

  if (!record || now > record.resetTime) {
    partnerLoginAttempts.set(key, { count: 1, resetTime: now + LOCKOUT_PERIOD_MS });
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
      recordFailedAttempt(clientKey);
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
      recordFailedAttempt(clientKey);
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
      recordFailedAttempt(clientKey);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // 5. Login sukses: bersihkan failed attempts
    partnerLoginAttempts.delete(clientKey);

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
