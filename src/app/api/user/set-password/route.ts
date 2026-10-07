import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        password: true,
        google_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Format request tidak valid.",
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body;

    // Jika pengguna sudah memiliki password sebelumnya (misal ingin ganti password)
    const hasExistingPassword = Boolean(user.password);
    if (hasExistingPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Password saat ini wajib diisi.",
          },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password!
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Password saat ini tidak sesuai.",
          },
          { status: 400 }
        );
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Password baru tidak boleh sama dengan password saat ini.",
          },
          { status: 400 }
        );
      }
    }

    // Validasi Password Baru
    if (typeof newPassword !== "string" || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Password baru wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password minimal terdiri dari 8 karakter.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length > 72) {
      return NextResponse.json(
        {
          success: false,
          error: "Password maksimal terdiri dari 72 karakter.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Konfirmasi password baru tidak cocok.",
        },
        { status: 400 }
      );
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: hasExistingPassword
          ? "Password berhasil diperbarui."
          : "Password berhasil dibuat. Anda sekarang dapat login menggunakan email dan password.",
        hasPassword: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengatur password pengguna:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menyimpan password.",
      },
      { status: 500 }
    );
  }
}
