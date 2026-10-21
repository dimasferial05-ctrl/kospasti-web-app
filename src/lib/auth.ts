import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface UserTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || "kospasti-user-jwt-secret-key-min-32-chars-secure-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

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
    .sign(secretKey);
}

/**
 * Memverifikasi token JWT sesi pengguna. Mengembalikan payload jika valid, atau null jika tidak valid / kedaluwarsa.
 */
export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
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
    .sign(secretKey);
}

/**
 * Memverifikasi token JWT sesi Mitra/Owner. Mengembalikan payload jika valid, atau null jika tidak valid / kedaluwarsa.
 */
export async function verifyOwnerToken(token: string): Promise<OwnerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
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

