import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID belum dikonfigurasi di environment variables.");
      return NextResponse.json(
        {
          success: false,
          error: "Google OAuth belum dikonfigurasi pada server.",
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    // Tentukan origin URL aplikasi
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
      request.nextUrl.origin ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}` : "http://localhost:3000");

    const redirectUri = `${origin}/api/auth/callback/google`;

    const googleOAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleOAuthUrl.searchParams.set("client_id", clientId);
    googleOAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleOAuthUrl.searchParams.set("response_type", "code");
    googleOAuthUrl.searchParams.set("scope", "openid email profile");
    googleOAuthUrl.searchParams.set("access_type", "offline");
    googleOAuthUrl.searchParams.set("prompt", "select_account");
    googleOAuthUrl.searchParams.set("state", callbackUrl);

    return NextResponse.redirect(googleOAuthUrl.toString());
  } catch (error) {
    console.error("Gagal menginisiasi Google OAuth:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menginisiasi login Google.",
      },
      { status: 500 }
    );
  }
}
