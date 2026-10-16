import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOwnerToken } from "@/lib/auth";

async function getPartnerToken(request?: NextRequest): Promise<string | undefined> {
  let token: string | undefined;
  if (request && "cookies" in request) {
    token = request.cookies.get("partner_token")?.value;
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("partner_token")?.value;
    } catch {
      // outside request store scope
    }
  }
  return token;
}

/**
 * PUT: Mengubah kata sandi akun portal mitra
 */
export async function PUT(request: NextRequest) {
  try {
    const partnerToken = await getPartnerToken(request);

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Format data request tidak valid." },
        { status: 400 }
      );
    }

    const { current_password, new_password, confirm_password } = body;

    if (!new_password || typeof new_password !== "string") {
      return NextResponse.json(
        { success: false, error: "Kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Kata sandi baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    if (new_password !== confirm_password) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi kata sandi baru tidak cocok." },
        { status: 400 }
      );
    }

    // Ambil akun mitra beserta password saat ini
    const owner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
      select: { id: true, password: true },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: "Data mitra tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika akun sudah memiliki password, wajib verifikasi current_password
    if (owner.password) {
      if (!current_password || typeof current_password !== "string") {
        return NextResponse.json(
          { success: false, error: "Kata sandi saat ini wajib diisi." },
          { status: 400 }
        );
      }

      const isCurrentValid = await bcrypt.compare(current_password, owner.password);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: "Kata sandi saat ini salah." },
          { status: 400 }
        );
      }
    }

    // Hash kata sandi baru
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Simpan ke database
    await prisma.owner.update({
      where: { id: payload.ownerId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { success: true, message: "Kata sandi berhasil diperbarui." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengubah kata sandi mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memperbarui kata sandi." },
      { status: 500 }
    );
  }
}
