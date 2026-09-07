import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const pin = body?.pin;

    const validPin = process.env.ADMIN_PIN || "778899";

    if (!pin || pin !== validPin) {
      return NextResponse.json(
        {
          success: false,
          error: "PIN salah. Akses ditolak.",
        },
        { status: 401 }
      );
    }

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
      value: "kospasti_admin_authenticated",
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
