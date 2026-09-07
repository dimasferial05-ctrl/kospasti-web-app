import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get("admin_token")?.value;

  // Pengecualian rute login
  if (pathname === "/api/admin/login" || pathname === "/admin/login") {
    // Jika sudah login dan mencoba mengakses halaman login UI, arahkan ke dasbor admin
    if (pathname === "/admin/login" && adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Jika tidak memiliki cookie admin_token
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
