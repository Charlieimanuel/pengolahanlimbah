import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gspnacfzvpdivndcpled.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTM2NDEsImV4cCI6MjEwNzY4OTY0MX0.xqy-W8PG5i3Q3W8KQUQkjlO5kx3dC7UFW7RsRugizMI";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
