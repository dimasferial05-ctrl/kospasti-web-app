import { NextRequest, NextResponse } from "next/server";

/**
 * Mengambil token autentikasi admin yang valid.
 * Pada lingkungan produksi, process.env.ADMIN_TOKEN wajib dikonfigurasi.
 */
export function getValidAdminToken(): string {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: ADMIN_TOKEN wajib dikonfigurasi di environment variables pada mode produksi!");
    }
    return "kospasti_admin_authenticated";
  }
  return token;
}

/**
 * Memvalidasi apakah token cookie admin yang dikirimkan cocok dengan token valid.
 * Pada lingkungan produksi, jika ADMIN_TOKEN tidak dikonfigurasi, autentikasi otomatis ditolak (fail-closed).
 */
export function isValidAdminToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const validToken = getValidAdminToken();
    return Boolean(validToken && token === validToken);
  } catch {
    return false;
  }
}

export function isValidAdminRequest(request: NextRequest | Request): boolean {
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    const token = (request as NextRequest).cookies.get("admin_token")?.value;
    return isValidAdminToken(token);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
  let token: string | null = null;
  if (match) {
    try {
      token = decodeURIComponent(match[1]);
    } catch {
      token = match[1];
    }
  }
  return isValidAdminToken(token);
}

export function createAdminUnauthorizedResponse(
  message: string = "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid."
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}
