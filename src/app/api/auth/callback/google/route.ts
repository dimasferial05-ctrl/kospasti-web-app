import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUserToken, parseOAuthState } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    request.nextUrl.origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}` : "http://localhost:3000");

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const rawState = searchParams.get("state");
    const error = searchParams.get("error");

    // Jika pengguna membatalkan otorisasi di Google
    if (error) {
      console.warn("Google OAuth ditolak atau error:", error);
      const res = NextResponse.redirect(new URL("/login?error=oauth_cancelled", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    if (!code) {
      const res = NextResponse.redirect(new URL("/login?error=missing_code", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    // 0. Validasi State Nonce (Pencegahan OAuth CSRF - RFC 6749 Section 10.12)
    const oauthCookieNonce = request.cookies.get("oauth_state")?.value;
    const { nonce: stateNonce, callbackUrl: targetPath } = parseOAuthState(rawState);

    if (!oauthCookieNonce || !stateNonce || oauthCookieNonce !== stateNonce) {
      console.warn("OAuth CSRF Terdeteksi: State nonce tidak cocok atau cookie oauth_state tidak ditemukan.");
      const res = NextResponse.redirect(new URL("/login?error=invalid_state", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum dikonfigurasi.");
      const res = NextResponse.redirect(new URL("/login?error=server_configuration", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    const redirectUri = `${origin}/api/auth/callback/google`;

    // 1. Tukarkan authorization code dengan access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);

    if (!tokenResponse.ok || !tokenData?.access_token) {
      console.error("Gagal menukar token Google OAuth:", tokenData);
      const res = NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    // 2. Ambil informasi profil pengguna dari Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json().catch(() => null);

    if (!userResponse.ok || !googleUser?.email) {
      console.error("Gagal mengambil profil user dari Google:", googleUser);
      const res = NextResponse.redirect(new URL("/login?error=oauth_profile_failed", origin));
      res.cookies.delete("oauth_state");
      return res;
    }

    const email = googleUser.email.toLowerCase().trim();

    // 3. Cari pengguna yang sudah ada berdasarkan email atau google_id
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { google_id: googleUser.id }],
      },
    });

    if (user) {
      // Perbarui google_id dan sinkronkan avatar jika ada dari Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          google_id: googleUser.id,
          avatar: googleUser.picture || user.avatar || null,
        },
      });
    } else {
      // Buat akun pengguna baru
      user = await prisma.user.create({
        data: {
          name: googleUser.name || email.split("@")[0] || "Pengguna Google",
          email,
          google_id: googleUser.id,
          avatar: googleUser.picture || null,
        },
      });
    }

    // 4. Buat sesi token JWT (berlaku 7 hari)
    const sessionToken = await signUserToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
      avatar: user.avatar,
      bio: user.bio,
    });

    // 5. Tentukan tujuan redirect yang telah divalidasi dan aman
    const redirectTarget = new URL(targetPath, origin);

    const response = NextResponse.redirect(redirectTarget);

    // Hapus cookie oauth_state setelah berhasil digunakan (Single-use / Anti-Replay)
    response.cookies.delete("oauth_state");

    // 6. Pasang Secure HTTP-Only Cookie
    response.cookies.set({
      name: "user_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error pada callback Google OAuth:", error);
    const res = NextResponse.redirect(new URL("/login?error=internal_server_error", origin));
    res.cookies.delete("oauth_state");
    return res;
  }
}
