import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout admin berhasil.",
      },
      { status: 200 }
    );

    response.cookies.delete("admin_token");

    return response;
  } catch (error) {
    console.error("Gagal memproses logout admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server.",
      },
      { status: 500 }
    );
  }
}
