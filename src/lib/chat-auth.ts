import { NextRequest } from "next/server";
import { verifyUserToken, verifyOwnerToken } from "@/lib/auth";

export interface ChatActor {
  type: "USER" | "OWNER";
  id: string; // userId atau ownerId
  name: string;
  avatar?: string | null;
}

/**
 * Mengekstrak aktor pengirim obrolan (Mahasiswa/User atau Pemilik/Owner) dari request cookie atau authorization header.
 */
export async function getChatActorFromRequest(
  request: NextRequest,
  preferredRole?: "USER" | "OWNER"
): Promise<ChatActor | null> {
  // 1. Jika ada preferensi spesifik USER (misal dari halaman publik kos)
  if (preferredRole === "USER") {
    const userToken = request.cookies.get("user_token")?.value;
    if (userToken) {
      const userPayload = await verifyUserToken(userToken);
      if (userPayload) {
        return {
          type: "USER",
          id: userPayload.userId,
          name: userPayload.name,
          avatar: userPayload.avatar,
        };
      }
    }
  }

  // 2. Jika ada preferensi spesifik OWNER (misal dari portal dashboard mitra)
  if (preferredRole === "OWNER") {
    const partnerToken = request.cookies.get("partner_token")?.value;
    if (partnerToken) {
      const ownerPayload = await verifyOwnerToken(partnerToken);
      if (ownerPayload) {
        return {
          type: "OWNER",
          id: ownerPayload.ownerId,
          name: ownerPayload.name,
        };
      }
    }
  }

  // 3. Default: Periksa user_token terlebih dahulu (pencari kos/mahasiswa)
  const userToken = request.cookies.get("user_token")?.value;
  if (userToken) {
    const userPayload = await verifyUserToken(userToken);
    if (userPayload) {
      return {
        type: "USER",
        id: userPayload.userId,
        name: userPayload.name,
        avatar: userPayload.avatar,
      };
    }
  }

  // 4. Periksa cookie partner_token (Mitra Pemilik Kos)
  const partnerToken = request.cookies.get("partner_token")?.value;
  if (partnerToken) {
    const ownerPayload = await verifyOwnerToken(partnerToken);
    if (ownerPayload) {
      return {
        type: "OWNER",
        id: ownerPayload.ownerId,
        name: ownerPayload.name,
      };
    }
  }

  // 5. Fallback: Periksa Authorization Bearer token (jika ada)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    // Coba sebagai user terlebih dahulu
    const userPayload = await verifyUserToken(token);
    if (userPayload) {
      return {
        type: "USER",
        id: userPayload.userId,
        name: userPayload.name,
        avatar: userPayload.avatar,
      };
    }

    // Coba sebagai owner
    const ownerPayload = await verifyOwnerToken(token);
    if (ownerPayload) {
      return {
        type: "OWNER",
        id: ownerPayload.ownerId,
        name: ownerPayload.name,
      };
    }
  }

  return null;
}

/**
 * Masking nama atau nomor kontak untuk menjaga privasi sebelum transaksi selesai.
 * Contoh: "Budi Santoso" -> "Budi S. (Penyewa Terverifikasi)"
 * Nomor WhatsApp tidak dimunculkan sama sekali di antarmuka chat publik.
 */
export function maskContactName(name: string, type: "USER" | "OWNER", propertyName?: string): string {
  if (type === "OWNER") {
    return propertyName ? `Pengelola ${propertyName}` : `Pengelola Kos (${name})`;
  }

  const parts = (name || "").trim().split(/\s+/);
  if (parts.length <= 1) {
    return `${parts[0] || "Penyewa"} (Penyewa)`;
  }
  return `${parts[0]} ${parts[1][0]}. (Penyewa)`;
}
