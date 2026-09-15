import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email?.trim?.();
    const password = body?.password;

    const validEmail = process.env.ADMIN_EMAIL || "adminkospasti@gmail.com";
    const validPassword = process.env.ADMIN_PASSWORD || "kospasti123";

    if (!email || !password || email !== validEmail || password !== validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
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
