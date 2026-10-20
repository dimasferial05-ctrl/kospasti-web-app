import { NextRequest, NextResponse } from "next/server";

export function getValidAdminToken(): string {
  return process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
}

export function isValidAdminToken(token?: string | null): boolean {
  if (!token) return false;
  return token === getValidAdminToken();
}

export function isValidAdminRequest(request: NextRequest | Request): boolean {
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    const token = (request as NextRequest).cookies.get("admin_token")?.value;
    return isValidAdminToken(token);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
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
