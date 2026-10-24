import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getValidServiceRoleKey } from "@/lib/supabase/admin";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gspnacfzvpdivndcpled.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbG...izMI";
const SERVICE_ROLE_KEY = getValidServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      nipNim,
      whatsapp,
      gender,
      birthPlace,
      birthDate,
      address,
      jurusan,
      prodi,
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    const adminClient = SERVICE_ROLE_KEY
      ? createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    const db = adminClient || supabase;

    // 1. Ambil unit_id jika prodi dipilih
    let matchedUnitId: string | null = null;
    if (prodi) {
      const { data: unitData } = await db
        .from("units")
        .select("id")
        .eq("nama_unit", prodi)
        .maybeSingle();

      if (unitData) {
        matchedUnitId = unitData.id;
      }
    }

    // 2. Update tabel public.profiles
    const updatePayload = {
      nama_lengkap: fullName.trim(),
      nip_nim: nipNim ? nipNim.trim() : null,
      nomor_wa: whatsapp ? whatsapp.trim() : null,
      jenis_kelamin: gender || null,
      tempat_lahir: birthPlace ? birthPlace.trim() : null,
      tanggal_lahir: birthDate || null,
      alamat: address ? address.trim() : null,
      jurusan: jurusan || null,
      unit_id: matchedUnitId,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: profileError } = await db
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("*, units:unit_id(nama_unit)")
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Gagal memperbarui profil: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 3. Update auth metadata jika adminClient tersedia
    if (adminClient) {
      try {
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata || {}),
            full_name: fullName.trim(),
            id_number: nipNim ? nipNim.trim() : null,
            whatsapp: whatsapp ? whatsapp.trim() : null,
            gender: gender || null,
            birth_place: birthPlace ? birthPlace.trim() : null,
            birth_date: birthDate || null,
            address: address ? address.trim() : null,
            jurusan: jurusan || null,
            prodi: prodi || null,
          },
        });
      } catch (metaErr) {
        console.warn("Gagal update user_metadata (non-blocking):", metaErr);
      }
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Profil berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
