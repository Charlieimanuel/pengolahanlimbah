import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gspnacfzvpdivndcpled.supabase.co";

export function getValidServiceRoleKey(candidateKey?: string): string {
  const rawKey = candidateKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!cleanKey && process.env.NODE_ENV !== "production") {
    console.warn("Peringatan: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables.");
  }
  return cleanKey;
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseServiceKey = getValidServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
