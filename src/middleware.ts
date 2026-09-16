import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get("admin_token")?.value;
  const userToken = request.cookies.get("user_token")?.value;

  // 1. Pengecualian rute login Admin
  if (pathname === "/api/admin/login" || pathname === "/admin/login") {
    // Jika admin sudah login dan mencoba mengakses halaman login UI admin, arahkan ke dasbor admin
    if (pathname === "/admin/login" && adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 2. Proteksi Admin
  if (!adminToken) {
    // Proteksi endpoint API Admin
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi admin tidak valid atau telah berakhir.",
        },
        { status: 401 }
      );
    }

    // Proteksi halaman UI Admin
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // 3. Logika User: Pengguna yang sudah login tidak boleh mengakses /login atau /register
  if ((pathname === "/login" || pathname === "/register") && userToken) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl && callbackUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Logika User: Proteksi Halaman Khusus Pengguna (Profil/Pesanan/Checkout)
  const protectedUserRoutes = ["/profil", "/pesanan", "/checkout"];
  const isProtectedUserRoute = protectedUserRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedUserRoute && !userToken) {
    const currentPath = request.nextUrl.pathname;
    const currentQuery = request.nextUrl.search;
    const callbackUrl = encodeURIComponent(currentPath + currentQuery);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
    "/profil/:path*",
    "/pesanan/:path*",
    "/checkout/:path*",
  ],
};

