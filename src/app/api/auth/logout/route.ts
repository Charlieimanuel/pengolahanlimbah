import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:8000";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3OTE5NTQ4NTksImV4cCI6MjEwNzMxNDg1OX0.00JekA2LQ8cpErmaGHJ_VrLVjwQBEch_Hsv4uHO0hy8";

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
