import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Buat objek response sukses
    const response = NextResponse.json(
      { success: true, message: "Berhasil keluar dari akun." },
      { status: 200 }
    );

    // "Hapus" cookie user_token dengan cara meng-set masa aktifnya (maxAge) menjadi 0
    // dan tanggal kedaluwarsa di masa lalu
    response.cookies.set({
      name: "user_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Gagal memproses logout pengguna:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pengeluaran sesi." },
      { status: 500 }
    );
  }
}
