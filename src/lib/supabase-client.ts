import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Mengambil instance Supabase Client untuk browser (Client-Side).
 * Menggunakan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      browserClient = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return browserClient;
    } catch (err) {
      console.warn("[Supabase Realtime] Gagal menginisialisasi browser client:", err);
      return null;
    }
  }

  return null;
}

/**
 * Bergabung ke Broadcast Channel Supabase Realtime untuk ruang obrolan tertentu.
 * Mengembalikan fungsi cleanup untuk unsubscribe saat komponen unmount.
 */
export function subscribeToChatRoom(
  roomId: string,
  onNewMessage: (message: any) => void
): () => void {
  const client = getSupabaseBrowserClient();
  if (!client || !roomId) {
    return () => {};
  }

  try {
    const channelName = `room:chat_${roomId}`;
    const channel = client.channel(channelName);

    channel
      .on("broadcast", { event: "new_message" }, (event) => {
        if (event?.payload) {
          onNewMessage(event.payload);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Terhubung ke real-time cluster
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch {
        // Abaikan error saat teardown channel
      }
    };
  } catch (err) {
    console.warn("[Supabase Realtime] Error saat subscribe ke room:", err);
    return () => {};
  }
}

/**
 * Mengirimkan pesan instan melalui Realtime Broadcast Channel ke partisipan lain di room.
 */
export async function broadcastChatMessage(roomId: string, message: any): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client || !roomId) return;

  try {
    const channelName = `room:chat_${roomId}`;
    const channel = client.channel(channelName);
    
    // Pastikan channel siap kirim
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: message,
    });
  } catch (err) {
    console.warn("[Supabase Realtime] Gagal mengirim broadcast chat:", err);
  }
}
