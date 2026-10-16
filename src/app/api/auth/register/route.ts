import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gspnacfzvpdivndcpled.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTM2NDEsImV4cCI6MjEwNzY4OTY0MX0.xqy-W8PG5i3Q3W8KQUQkjlO5kx3dC7UFW7RsRugizMI";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcG5hY2Z6dnBkaXZuZGNwbGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjExMzY0MSwiZXhwIjoyMTA3Njg5NjQxfQ.38DQWdToJyMJ2c8MemP3K9jJVe8Axt96sZL5QfCgIWk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      idNumber,
      whatsapp,
      gender,
      birthPlace,
      birthDate,
      address,
      jurusan,
      lab,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanIdNumber = idNumber ? idNumber.trim() : null;

    // JIKA TERDAPAT SERVICE_ROLE_KEY: Gunakan Admin API Supabase (Anti Rate-Limit & Auto-Confirm)
    if (SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Cek apakah NIM / NIP sudah terdaftar di profiles
      if (cleanIdNumber) {
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .ilike("nip_nim", cleanIdNumber)
          .maybeSingle();

        if (existingProfile) {
          return NextResponse.json(
            { error: "NIM / NIP ini sudah terdaftar dalam sistem." },
            { status: 400 }
          );
        }
      }

      // 2. Buat user langsung di auth.users dengan email terkonfirmasi (Tanpa limit email SMTP)
      const { data: newUserData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            id_number: cleanIdNumber,
            whatsapp: whatsapp || null,
            gender: gender || null,
            birth_place: birthPlace || null,
            birth_date: birthDate || null,
            address: address || null,
            jurusan: jurusan || null,
            lab: lab || null,
            role: "unit_pelapor",
          },
        });

      if (createError) {
        const errMsg = createError.message.toLowerCase();
        if (
          errMsg.includes("already been registered") ||
          errMsg.includes("already registered") ||
          errMsg.includes("unique")
        ) {
          return NextResponse.json(
            { error: "Email ini sudah terdaftar dalam sistem. Silakan langsung login." },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      const userId = newUserData.user.id;

      // 3. Pastikan profil pengguna tersimpan lengkap di tabel public.profiles
      await adminClient.from("profiles").upsert({
        id: userId,
        email: cleanEmail,
        nama_lengkap: fullName,
        nip_nim: cleanIdNumber,
        nomor_wa: whatsapp || null,
        jenis_kelamin: gender || null,
        tempat_lahir: birthPlace || null,
        tanggal_lahir: birthDate || null,
        alamat: address || null,
        jurusan: jurusan || null,
        nama_lab: lab || null,
        role: "unit_pelapor",
      });

      return NextResponse.json({ success: true, user: newUserData.user });
    }

    // FALLBACK: Menggunakan Supabase Client Standar
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() { },
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          id_number: cleanIdNumber,
          whatsapp,
          gender,
          birth_place: birthPlace,
          birth_date: birthDate,
          address,
          jurusan,
          lab,
          role: "unit_pelapor",
        },
      },
    });

    if (error) {
      let friendlyMsg = error.message;
      if (error.message.toLowerCase().includes("rate limit")) {
        friendlyMsg =
          "Batas pengiriman email Supabase tercapai. Silakan coba beberapa saat lagi atau hubungi administrator.";
      }
      return NextResponse.json({ error: friendlyMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
