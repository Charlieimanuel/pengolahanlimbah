import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getValidServiceRoleKey } from "@/lib/supabase/admin";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gspnacfzvpdivndcpled.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTM2NDEsImV4cCI6MjEwNzY4OTY0MX0.xqy-W8PG5i3Q3W8KQUQkjlO5kx3dC7UFW7RsRugizMI";
const SERVICE_ROLE_KEY = getValidServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Ambil user yang sedang aktif
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Proteksi Halaman Admin (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cek role user dari database profiles atau metadata resmi
    let role = user.user_metadata?.role;
    if (user.email?.toLowerCase() === "admin@polimdo.ac.id") {
      role = "admin_tps";
    }

    try {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (myProfile?.role) {
        role = myProfile.role;
      }
    } catch {
      // Abaikan jika gagal
    }

    if (!role) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          const authClient = createSupabaseAdmin(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
              headers: {
                Authorization: `Bearer ${sessionData.session.access_token}`,
              },
            },
          });
          const { data: myProfile } = await authClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (myProfile?.role) {
            role = myProfile.role;
          }
        }
      } catch {
        // Abaikan jika gagal
      }
    }

    if (!role) {
      try {
        const adminClient = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role;
        }
      } catch {
        // Gunakan role dari metadata jika query gagal
      }
    }

    // Hanya verifikator_k3l dan admin_tps yang berhak mengakses /admin
    if (role !== "verifikator_k3l" && role !== "admin_tps") {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/user/riwayat-tiket"
      deniedUrl.searchParams.set("unauthorized", "admin_only");
      return NextResponse.redirect(deniedUrl);
    }
  }

  // 2. Proteksi Halaman Pelapor / User (/user/*)
  if (pathname.startsWith("/user")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
  ],
};
