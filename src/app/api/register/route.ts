import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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

    const name = body.name?.trim?.();
    const email = body.email?.trim?.()?.toLowerCase?.();
    const password = body.password;
    const whatsapp = body.whatsapp?.trim?.() || null;

    // 1. Validasi field wajib
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama lengkap, email, dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 2. Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format alamat email tidak valid.",
        },
        { status: 400 }
      );
    }

    // 3. Validasi panjang password
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password minimal terdiri dari 8 karakter.",
        },
        { status: 400 }
      );
    }

    // 4. Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email sudah terdaftar.",
        },
        { status: 400 }
      );
    }

    // 5. Hash password menggunakan bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Simpan pengguna baru ke database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        whatsapp,
      },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran akun berhasil.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal memproses registrasi akun:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mendaftar.",
      },
      { status: 500 }
    );
  }
}
