import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface UserTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

/**
 * Mengambil kunci rahasia JWT dengan pengamanan ketat.
 * Pada lingkungan produksi (NODE_ENV === "production"), wajib ada process.env.JWT_SECRET.
 * Pada lingkungan dev/test, diperbolehkan fallback untuk kemudahan DX.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET wajib dikonfigurasi di environment variables pada mode produksi!");
    }
    return "kospasti-user-jwt-secret-key-min-32-chars-secure-2026";
  }
  return secret;
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

/**
 * Menandatangani token JWT untuk sesi pengguna (berlaku 7 hari).
 */
export async function signUserToken(payload: {
  userId: string;
  email: string;
  name: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    whatsapp: payload.whatsapp ?? null,
    avatar: payload.avatar ?? null,
    bio: payload.bio ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

/**
 * Memverifikasi token JWT sesi pengguna. Mengembalikan payload jika valid, atau null jika tidak valid / kedaluwarsa.
 */
export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as UserTokenPayload;
  } catch {
    return null;
  }
}

export interface OwnerTokenPayload extends JWTPayload {
  ownerId: string;
  email?: string | null;
  name: string;
  whatsapp_number: string;
  role: "OWNER";
}

/**
 * Menandatangani token JWT untuk sesi Mitra/Owner (berlaku 7 hari).
 */
export async function signOwnerToken(payload: {
  ownerId: string;
  email?: string | null;
  name: string;
  whatsapp_number: string;
}): Promise<string> {
  return new SignJWT({
    ownerId: payload.ownerId,
    email: payload.email ?? null,
    name: payload.name,
    whatsapp_number: payload.whatsapp_number,
    role: "OWNER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

/**
 * Memverifikasi token JWT sesi Mitra/Owner. Mengembalikan payload jika valid, atau null jika tidak valid / kedaluwarsa.
 */
export async function verifyOwnerToken(token: string): Promise<OwnerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if ((payload as OwnerTokenPayload).role !== "OWNER") {
      return null;
    }
    return payload as OwnerTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Memvalidasi apakah path tujuan redirect aman (relative path internal lokal).
 * Mencegah celah Open Redirect melalui protocol-relative URL (//attacker.com atau /\\attacker.com).
 */
export function isSafeRedirectPath(url?: string | null): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  return url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\");
}

/**
 * Aturan kekuatan kata sandi mitra:
 * Minimal 8 karakter, mengandung setidaknya 1 huruf besar, 1 huruf kecil, dan 1 angka.
 */
export const PARTNER_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PARTNER_PASSWORD_ERROR_MESSAGE =
  "Password harus minimal 8 karakter dan mengandung setidaknya 1 huruf besar, 1 huruf kecil, dan 1 angka.";

export function isValidPartnerPassword(password: unknown): boolean {
  if (typeof password !== "string") return false;
  return PARTNER_PASSWORD_REGEX.test(password);
}

/**
 * Menghasilkan state token acak (nonce) untuk proteksi OAuth CSRF dan mengemasnya bersama callbackUrl.
 */
export function createOAuthState(callbackUrl: string = "/"): { state: string; nonce: string } {
  const nonce = crypto.randomUUID();
  const safeCallback = isSafeRedirectPath(callbackUrl) ? callbackUrl : "/";
  const payload = JSON.stringify({ nonce, callbackUrl: safeCallback });
  const state = Buffer.from(payload, "utf-8").toString("base64url");
  return { state, nonce };
}

/**
 * Membaca parameter state dari Google OAuth callback, mengekstrak nonce dan callbackUrl.
 * Mendukung format base64url JSON serta fallback aman untuk kompatibilitas.
 */
export function parseOAuthState(stateParam?: string | null): { nonce: string | null; callbackUrl: string } {
  if (!stateParam || typeof stateParam !== "string") {
    return { nonce: null, callbackUrl: "/" };
  }

  // 1. Coba dekode format standar Base64URL JSON
  try {
    const decoded = Buffer.from(stateParam, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") {
      const nonce = typeof parsed.nonce === "string" && parsed.nonce.trim() ? parsed.nonce.trim() : null;
      const callbackUrl = isSafeRedirectPath(parsed.callbackUrl) ? (parsed.callbackUrl as string) : "/";
      return { nonce, callbackUrl };
    }
  } catch {
    // Abaikan jika bukan format Base64URL JSON
  }

  // 2. Fallback format delimiter (misal: "nonce:callbackUrl")
  if (stateParam.includes(":")) {
    const [noncePart, ...rest] = stateParam.split(":");
    const rawCallback = rest.join(":");
    let decodedCallback = "/";
    try {
      decodedCallback = decodeURIComponent(rawCallback);
    } catch {
      decodedCallback = rawCallback;
    }
    const callbackUrl = isSafeRedirectPath(decodedCallback) ? decodedCallback : "/";
    return { nonce: noncePart?.trim() || null, callbackUrl };
  }

  // 3. Fallback format legacy (string path langsung tanpa nonce)
  const legacyCallback = isSafeRedirectPath(stateParam) ? stateParam : "/";
  return { nonce: null, callbackUrl: legacyCallback };
}

