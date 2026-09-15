import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface UserTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "kospasti-user-jwt-secret-key-min-32-chars-secure-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Menandatangani token JWT untuk sesi pengguna (berlaku 7 hari).
 */
export async function signUserToken(payload: { userId: string; email: string; name: string }): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
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
