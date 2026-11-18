import { NextRequest, NextResponse } from "next/server";
import { isSafeRedirectPath, createOAuthState } from "@/lib/auth";

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
    const rawCallback = searchParams.get("callbackUrl");
    const callbackUrl = isSafeRedirectPath(rawCallback) ? (rawCallback as string) : "/";

    // Buat state nonce acak kriptografis (Mitigasi OAuth CSRF - RFC 6749 Section 10.12)
    const { state, nonce } = createOAuthState(callbackUrl);

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
    googleOAuthUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(googleOAuthUrl.toString());

    // Pasang cookie oauth_state HttpOnly yang aman (TTL: 10 menit)
    response.cookies.set({
      name: "oauth_state",
      value: nonce,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60, // 10 menit
      sameSite: "lax",
    });

    return response;
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
