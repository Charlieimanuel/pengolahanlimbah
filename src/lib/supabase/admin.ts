import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gspnacfzvpdivndcpled.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjExMzY0MSwiZXhwIjoyMTA3Njg5NjQxfQ.38DQWdToJyMJ2c8MemP3K9jJVe8Axt96sZL5QfCgIWk";

export function getValidServiceRoleKey(candidateKey?: string): string {
  if (candidateKey) {
    const cleanKey = candidateKey.trim().replace(/^["']|["']$/g, "");
    try {
      const parts = cleanKey.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (payload.role === "service_role" || payload.role === "supabase_admin") {
          return cleanKey;
        }
      }
    } catch {
      // jika parsing gagal, fallback
    }
  }
  return DEFAULT_SERVICE_ROLE_KEY;
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
