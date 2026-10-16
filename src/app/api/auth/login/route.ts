import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:8000";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3OTE5NTQ4NTksImV4cCI6MjEwNzMxNDg1OX0.00JekA2LQ8cpErmaGHJ_VrLVjwQBEch_Hsv4uHO0hy8";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc5MTk1NDg1OSwiZXhwIjoyMTA3MzE0ODU5fQ.WJVqbSOYuXiar0WSEiNXz8vHCx0gSw_eexZPUeXFLPY";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "NIP/NIM/Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    let cleanIdentifier = (identifier || "").trim();
    let targetEmail = cleanIdentifier;

    // Jika input bukan format email (misal NIM/NIP atau keyword 'admin'/'admin_tps'), lookup email
    if (!targetEmail.includes("@")) {
      if (cleanIdentifier.toLowerCase() === "admin") {
        targetEmail = "admin@polimdo.ac.id";
      } else if (
        cleanIdentifier.toLowerCase() === "admin_tps" ||
        cleanIdentifier.toLowerCase() === "admintps" ||
        cleanIdentifier.toLowerCase() === "tps"
      ) {
        targetEmail = "admin_tps@polimdo.ac.id";
      } else {
        const adminClient = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: profileData, error: lookupError } = await adminClient
          .from("profiles")
          .select("email")
          .ilike("nip_nim", cleanIdentifier)
          .maybeSingle();

        if (lookupError || !profileData?.email) {
          return NextResponse.json(
            { error: "NIP/NIM atau Email tidak terdaftar dalam sistem." },
            { status: 400 }
          );
        }
        targetEmail = profileData.email;
      }
    }

    targetEmail = targetEmail.toLowerCase().trim();

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "Email/NIP atau kata sandi tidak sesuai."
          : error.message;
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Ambil role dari tabel profiles menggunakan token sesi user yang baru login (aman dari isu RLS)
    let role = data.user.user_metadata?.role;
    if (data.session?.access_token) {
      try {
        const authClient = createSupabaseAdmin(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          },
        });
        const { data: userProfile } = await authClient
          .from("profiles")
          .select("id, role, nama_lengkap")
          .eq("id", data.user.id)
          .maybeSingle();

        if (userProfile?.role) {
          role = userProfile.role;
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
          .select("id, role, nama_lengkap")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role;
        }
      } catch {
        // Abaikan jika gagal
      }
    }

    // Penyesuaian khusus untuk akun Admin K3L dan Admin TPS
    if (
      targetEmail.toLowerCase() === "admin@polimdo.ac.id" ||
      cleanIdentifier.toLowerCase() === "admin"
    ) {
      role = "verifikator_k3l";
    }

    if (
      targetEmail.toLowerCase().includes("admin_tps") ||
      targetEmail.toLowerCase().includes("admintps") ||
      cleanIdentifier.toLowerCase() === "admin_tps" ||
      cleanIdentifier.toLowerCase() === "tps" ||
      targetEmail.toLowerCase().startsWith("tps@")
    ) {
      if (role !== "verifikator_k3l") {
        role = "admin_tps";
      }
    }

    role = role || "unit_pelapor";
    const redirectUrl =
      role === "verifikator_k3l" || role === "admin_tps"
        ? "/admin/dashboard"
        : "/user/riwayat-tiket";

    const response = NextResponse.json({
      success: true,
      user: data.user,
      role,
      redirectUrl,
    });
    cookiesToApply.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal masuk ke sistem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
