import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Menginisialisasi Supabase Admin Client dengan Service Role Key.
 * Digunakan secara eksklusif di server-side (API Routes/Server Actions)
 * untuk bypass Row Level Security (RLS) saat operasi upload dan delete media.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Pada environment unit test (kecuali explicitly diaktifkan), kembalikan null untuk memakai fallback lokal fs
  if (process.env.NODE_ENV === "test" && process.env.USE_SUPABASE_IN_TEST !== "true") {
    return null;
  }

  if (supabaseUrl && supabaseServiceRoleKey) {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return null;
}

export const supabaseAdmin = getSupabaseAdmin();
