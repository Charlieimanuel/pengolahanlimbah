import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:8000";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc5MTk1NDg1OSwiZXhwIjoyMTA3MzE0ODU5fQ.WJVqbSOYuXiar0WSEiNXz8vHCx0gSw_eexZPUeXFLPY";

async function setupAccounts() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Menghubungkan ke Supabase Admin API...");

  // 1. Akun Admin Utama Baru: admin@polimdo.ac.id
  const adminEmail = "admin@polimdo.ac.id";
  const adminPass = "AdminK3L2026!";
  const adminNip = "198501012010121001";
  const adminName = "Petugas K3L POLIMDO";

  // Cek apakah admin@polimdo.ac.id sudah ada
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existingAdmin = userList?.users?.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  let adminUserId = "";
  if (existingAdmin) {
    adminUserId = existingAdmin.id;
    console.log("Akun admin sudah ada, memperbarui kata sandi...");
    await adminClient.auth.admin.updateUserById(adminUserId, {
      password: adminPass,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        id_number: adminNip,
        role: "verifikator_k3l",
        nama_lab: "Unit K3L POLIMDO",
      },
    });
  } else {
    console.log("Membuat akun admin baru...");
    const { data: newAdmin, error: createError } =
      await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPass,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          id_number: adminNip,
          role: "verifikator_k3l",
          nama_lab: "Unit K3L POLIMDO",
        },
      });

    if (createError) {
      console.error("Gagal buat akun admin:", createError.message);
      return;
    }
    adminUserId = newAdmin.user.id;
  }

  // Pastikan profile admin di public.profiles ber-role 'verifikator_k3l'
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: adminUserId,
    email: adminEmail,
    nama_lengkap: adminName,
    nip_nim: adminNip,
    role: "verifikator_k3l",
    nama_lab: "Unit K3L POLIMDO",
    jurusan: "Pusat Keselamatan Kerja (K3L)",
  });

  if (profileError) {
    console.warn("Update profile admin:", profileError.message);
  } else {
    console.log("Profil admin berhasil diset sebagai verifikator_k3l!");
  }

  // 2. Perbarui juga akun charliemamarimbing11@gmail.com ke kata sandi yang sama
  const existingCharlie = userList?.users?.find(
    (u) => u.email?.toLowerCase() === "charliemamarimbing11@gmail.com"
  );
  if (existingCharlie) {
    console.log("Memperbarui kata sandi charliemamarimbing11@gmail.com...");
    await adminClient.auth.admin.updateUserById(existingCharlie.id, {
      password: adminPass,
      email_confirm: true,
    });
    await adminClient.from("profiles").update({ role: "verifikator_k3l" }).eq("id", existingCharlie.id);
  }

  // 3. Perbarui juga akun pelapor mamarimbinglie@gmail.com ke kata sandi terstandar
  const existingPelapor = userList?.users?.find(
    (u) => u.email?.toLowerCase() === "mamarimbinglie@gmail.com"
  );
  if (existingPelapor) {
    console.log("Memperbarui kata sandi mamarimbinglie@gmail.com ke 'UserPelapor2026!'...");
    await adminClient.auth.admin.updateUserById(existingPelapor.id, {
      password: "UserPelapor2026!",
      email_confirm: true,
    });
  }

  console.log("\n==========================================");
  console.log("DATA AKUN BERHASIL DIBUAT & DISINKRONKAN:");
  console.log("1. AKUN ADMIN K3L:");
  console.log("   - Email: " + adminEmail);
  console.log("   - NIP: " + adminNip);
  console.log("   - Kata Sandi: " + adminPass);
  console.log("   - Tujuan Login: /admin/dashboard");
  console.log("\n2. AKUN ADMIN CADANGAN:");
  console.log("   - Email: charliemamarimbing11@gmail.com (NIP: 23024199)");
  console.log("   - Kata Sandi: " + adminPass);
  console.log("   - Tujuan Login: /admin/dashboard");
  console.log("\n3. AKUN CIVITAS PELAPOR:");
  console.log("   - Email: mamarimbinglie@gmail.com (NIM: 2302222)");
  console.log("   - Kata Sandi: UserPelapor2026!");
  console.log("   - Tujuan Login: /user/riwayat-tiket");
  console.log("==========================================");
}

setupAccounts().catch(console.error);
