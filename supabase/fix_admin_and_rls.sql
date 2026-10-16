-- ==============================================================================
-- SCRIPT PERBAIKAN: LOGIN ADMIN & ROW LEVEL SECURITY (RLS) SUPABASE CLOUD
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> Klik "Run"
-- ==============================================================================

-- 1. Bersihkan Kebijakan RLS Lama Yang Menyebabkan Infinite Recursion (Error 42P17)
DROP POLICY IF EXISTS "Isolasi Profil User" ON public.profiles;
DROP POLICY IF EXISTS "User Update Profil Sendiri" ON public.profiles;
DROP POLICY IF EXISTS "User Hanya Melihat Tiket Miliknya Atau Admin" ON public.b3_tickets;
DROP POLICY IF EXISTS "Admin dan Pemilik Dapat Update Tiket" ON public.b3_tickets;
DROP POLICY IF EXISTS "Akses Logbook TPS Admin dan Pelapor" ON public.tps_storage_logs;

-- 2. Buat Fungsi Cek Admin Tanpa Memicu Siklus Rekursif
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('verifikator_k3l', 'admin_tps')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Terapkan Kebijakan RLS yang Bersih & Aman
CREATE POLICY "Isolasi Profil User"
  ON public.profiles FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "User Update Profil Sendiri"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "User Hanya Melihat Tiket Miliknya Atau Admin"
  ON public.b3_tickets FOR SELECT TO authenticated
  USING (
    pelapor_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Admin dan Pemilik Dapat Update Tiket"
  ON public.b3_tickets FOR UPDATE TO authenticated
  USING (
    pelapor_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Akses Logbook TPS Admin dan Pelapor"
  ON public.tps_storage_logs FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.b3_tickets 
      WHERE b3_tickets.id = tps_storage_logs.ticket_id 
      AND b3_tickets.pelapor_id = auth.uid()
    )
  );

-- 4. Update Trigger handle_new_user Agar Aman Dari Konflik Email Duplikat
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Hapus profil lama jika email sama tapi id berbeda (mencegah conflict unique email)
  DELETE FROM public.profiles WHERE email = new.email AND id <> new.id;

  INSERT INTO public.profiles (
    id,
    email,
    nama_lengkap,
    nip_nim,
    nomor_wa,
    jenis_kelamin,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    jurusan,
    nama_lab,
    role
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'id_number', null),
    COALESCE(new.raw_user_meta_data->>'whatsapp', null),
    COALESCE(new.raw_user_meta_data->>'gender', null),
    COALESCE(new.raw_user_meta_data->>'birth_place', null),
    NULLIF(new.raw_user_meta_data->>'birth_date', '')::date,
    COALESCE(new.raw_user_meta_data->>'address', null),
    COALESCE(new.raw_user_meta_data->>'jurusan', null),
    COALESCE(new.raw_user_meta_data->>'lab', null),
    CASE 
      WHEN new.email = 'admin@polimdo.ac.id' THEN 'verifikator_k3l'::public.user_role
      WHEN new.email LIKE 'admin_tps%' THEN 'admin_tps'::public.user_role
      ELSE COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'unit_pelapor')
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nama_lengkap = COALESCE(EXCLUDED.nama_lengkap, public.profiles.nama_lengkap),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Buat / Reset Akun Resmi Admin K3L di auth.users & public.profiles
DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
BEGIN
  -- Bersihkan entri lama agar tidak duplikat
  DELETE FROM auth.users WHERE email = 'admin@polimdo.ac.id';
  DELETE FROM public.profiles WHERE email = 'admin@polimdo.ac.id';

  -- Buat user admin baru di auth.users dengan bcrypt cost 10
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    'admin@polimdo.ac.id',
    extensions.crypt('AdminK3L2026!', extensions.gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Petugas Admin K3L POLIMDO","id_number":"198501012010121001","role":"verifikator_k3l"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Buat profil admin di public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    nama_lengkap,
    nip_nim,
    role
  ) VALUES (
    v_admin_id,
    'admin@polimdo.ac.id',
    'Petugas Admin K3L POLIMDO',
    '198501012010121001',
    'verifikator_k3l'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'verifikator_k3l',
    nama_lengkap = 'Petugas Admin K3L POLIMDO';
END $$;

-- 6. Pastikan Akun Charlie Mamarimbing Tetap Sebagai unit_pelapor
UPDATE public.profiles
SET role = 'unit_pelapor'
WHERE email = 'charliemamarimbing11@gmail.com';
