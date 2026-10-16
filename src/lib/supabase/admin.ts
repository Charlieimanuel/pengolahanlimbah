import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gspnacfzvpdivndcpled.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjExMzY0MSwiZXhwIjoyMTA3Njg5NjQxfQ.38DQWdToJyMJ2c8MemP3K9jJVe8Axt96sZL5QfCgIWk";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    DEFAULT_SERVICE_ROLE_KEY;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
