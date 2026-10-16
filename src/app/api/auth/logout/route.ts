import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gspnacfzvpdivndcpled.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTM2NDEsImV4cCI6MjEwNzY4OTY0MX0.xqy-W8PG5i3Q3W8KQUQkjlO5kx3dC7UFW7RsRugizMI";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookiesToApply: { name: string; value: string; options?: any }[] = [];

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              cookiesToApply.push({ name, value, options });
            });
          } catch {
            // Can be ignored
          }
        },
      },
    });

    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });

    cookiesToApply.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // Clean up any remaining supabase session cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach((c) => {
      if (c.name.startsWith("sb-") || c.name.includes("auth-token")) {
        response.cookies.delete(c.name);
      }
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
