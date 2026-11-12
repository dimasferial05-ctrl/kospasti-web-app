import { cookies } from "next/headers";
import { verifyUserToken, verifyOwnerToken } from "@/lib/auth";

export interface NotificationActor {
  audience: "USER" | "OWNER";
  whereFilter: { user_id: string } | { owner_id: string };
}

/**
 * Mengidentifikasi aktor (User/Mahasiswa atau Owner/Mitra) dari cookie session
 * berdasarkan query parameter ?audience=OWNER|USER.
 */
export async function resolveNotificationActor(
  url: string
): Promise<NotificationActor | null> {
  const cookieStore = await cookies();
  const { searchParams } = new URL(url, "http://localhost");
  const audience =
    searchParams.get("audience")?.toUpperCase() === "OWNER" ? "OWNER" : "USER";

  if (audience === "OWNER") {
    const partnerToken = cookieStore.get("partner_token")?.value;
    if (!partnerToken) return null;
    const payload = await verifyOwnerToken(partnerToken);
    if (!payload?.ownerId) return null;
    return {
      audience: "OWNER",
      whereFilter: { owner_id: payload.ownerId },
    };
  }

  const userToken = cookieStore.get("user_token")?.value;
  if (!userToken) return null;
  const payload = await verifyUserToken(userToken);
  if (!payload?.userId) return null;
  return {
    audience: "USER",
    whereFilter: { user_id: payload.userId },
  };
}

