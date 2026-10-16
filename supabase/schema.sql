-- ==============================================================================
-- SISTEM INFORMASI MANAJEMEN PENGELOLAAN LIMBAH B3 (SIM-LB3) POLIMDO
-- SKEMA LENGKAP UNIVERSAL POSTGRESQL (SUPABASE CLOUD / DOCKER ON-PREMISE)
-- STANDAR PP NO. 22 TAHUN 2021 & PERMEN LHK
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SETUP SCHEMAS & EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS public;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Roles bawaan (Hanya dibuat jika belum ada di Docker, di-skip aman di Supabase Cloud)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 2. SETUP AUTH FUNCTIONS & AUTH.USERS TABLE (AMAN UNTUK CLOUD MAUPUN DOCKER)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    aud varchar(255) NULL DEFAULT 'authenticated',
    role varchar(255) NULL DEFAULT 'authenticated',
    email varchar(255) UNIQUE,
    encrypted_password varchar(255) NULL,
    email_confirmed_at timestamptz NULL DEFAULT now(),
    invited_at timestamptz NULL,
    confirmation_token varchar(255) NOT NULL DEFAULT '',
    confirmation_sent_at timestamptz NULL,
    recovery_token varchar(255) NOT NULL DEFAULT '',
    recovery_sent_at timestamptz NULL,
    email_change_token_new varchar(255) NOT NULL DEFAULT '',
    email_change varchar(255) NOT NULL DEFAULT '',
    email_change_sent_at timestamptz NULL,
    last_sign_in_at timestamptz NULL,
    raw_app_meta_data jsonb NULL DEFAULT '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data jsonb NULL DEFAULT '{}'::jsonb,
    is_super_admin bool NULL DEFAULT false,
    created_at timestamptz NULL DEFAULT now(),
    updated_at timestamptz NULL DEFAULT now(),
    phone text NULL DEFAULT NULL UNIQUE,
    phone_confirmed_at timestamptz NULL,
    phone_change text NOT NULL DEFAULT '',
    phone_change_token varchar(255) NOT NULL DEFAULT '',
    phone_change_sent_at timestamptz NULL,
    confirmed_at timestamptz NULL DEFAULT now(),
    email_change_token_current varchar(255) NOT NULL DEFAULT '',
    email_change_confirm_status smallint NULL DEFAULT 0,
    banned_until timestamptz NULL,
    reauthentication_token varchar(255) NOT NULL DEFAULT '',
    reauthentication_sent_at timestamptz NULL,
    is_sso_user bool NOT NULL DEFAULT false,
    deleted_at timestamptz NULL,
    is_anonymous bool NOT NULL DEFAULT false
  );
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  CREATE OR REPLACE FUNCTION auth.uid() 
  RETURNS uuid AS $func$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid;
  $func$ LANGUAGE sql STABLE;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  CREATE OR REPLACE FUNCTION auth.role() 
  RETURNS text AS $func$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text;
  $func$ LANGUAGE sql STABLE;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 3. ENUM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('unit_pelapor', 'verifikator_k3l', 'admin_tps', 'transporter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'draft', 
    'menunggu_verifikasi', 
    'terverifikasi', 
    'ditolak', 
    'masuk_tps', 
    'diangkut_pihak3', 
    'selesai'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE waste_phase AS ENUM ('cair', 'padat', 'sludge', 'gas');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 4. TABEL-TABEL UTAMA (PUBLIC SCHEMA)
-- ------------------------------------------------------------------------------

-- 4.1 Tabel Unit Penghasil (Jurusan, Prodi, Lab & Bengkel)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_unit VARCHAR(100) NOT NULL UNIQUE,
  jurusan VARCHAR(100) NOT NULL,
  penanggung_jawab VARCHAR(100),
  kontak_darurat VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Tabel Profil Pengguna (Sinkron dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  nama_lengkap VARCHAR(150) NOT NULL,
  nip_nim VARCHAR(50) UNIQUE,
  nomor_wa VARCHAR(25),
  jenis_kelamin VARCHAR(20),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  alamat TEXT,
  jurusan VARCHAR(100),
  nama_lab VARCHAR(100),
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'unit_pelapor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Tabel Tiket Laporan Limbah B3 (PP 22/2021)
CREATE TABLE IF NOT EXISTS public.b3_tickets (
  id VARCHAR(30) PRIMARY KEY, -- Format: 'B3-2026-001'
  pelapor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id),
  
  -- Spesifikasi Limbah PP 22/2021
  nama_limbah VARCHAR(200) NOT NULL,
  kode_limbah VARCHAR(50) NOT NULL, -- Contoh: 'B105d', 'A106b'
  fase waste_phase NOT NULL,
  volume NUMERIC(10, 2) NOT NULL,
  satuan VARCHAR(20) NOT NULL DEFAULT 'Liter',
  jenis_kemasan VARCHAR(100) NOT NULL,
  karakteristik_bahaya JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Kedaruratan & Lokasi Fisik
  is_emergency BOOLEAN DEFAULT FALSE,
  deskripsi_sumber TEXT,
  lokasi_pengambilan TEXT NOT NULL,
  patokan_lokasi TEXT,
  tanggal_dihasilkan DATE NOT NULL,
  
  -- Bukti Visual & Dokumen
  foto_limbah_url TEXT[],
  msds_pdf_url TEXT,
  
  -- Status & Verifikasi K3L
  status ticket_status NOT NULL DEFAULT 'menunggu_verifikasi',
  verifikator_id UUID REFERENCES public.profiles(id),
  catatan_verifikasi TEXT,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Tabel Logbook TPS & Neraca Masa Simpan (90/180/365 Hari)
CREATE TABLE IF NOT EXISTS public.tps_storage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(30) NOT NULL REFERENCES public.b3_tickets(id) ON DELETE CASCADE,
  tgl_masuk_tps TIMESTAMPTZ DEFAULT NOW(),
  tgl_jatuh_tempo TIMESTAMPTZ NOT NULL, -- Deadline batas masa simpan TPS
  posisi_rak_tps VARCHAR(50),
  tgl_pengeluaran TIMESTAMPTZ,
  nama_transporter VARCHAR(100),
  nomor_festronik VARCHAR(100),
  dokumen_bast_url TEXT,
  status_neraca VARCHAR(50) DEFAULT 'tersimpan'
);

-- 4.5 Tabel Kode OTP Pemulihan Kata Sandi
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: AUTO CREATE PROFILE SAAT USER REGISTER DI AUTH.USERS
-- ------------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) & POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b3_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tps_storage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- 6.1 Policies Units
DROP POLICY IF EXISTS "Semua user dapat melihat data unit" ON public.units;
-- 6.1 Helper Function: Cek Admin Tanpa Rekursi RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('verifikator_k3l', 'admin_tps')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6.2 Policies Units
CREATE POLICY "Semua user dapat melihat data unit"
  ON public.units FOR SELECT TO authenticated, anon
  USING (true);

-- 6.3 Policies Profiles (Strict Isolation: Hanya data profil sendiri, petugas verifikator, atau admin)
DROP POLICY IF EXISTS "Isolasi Profil User" ON public.profiles;
CREATE POLICY "Isolasi Profil User"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR role IN ('verifikator_k3l', 'admin_tps') 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "User Update Profil Sendiri" ON public.profiles;
CREATE POLICY "User Update Profil Sendiri"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 6.4 Policies Tiket B3
DROP POLICY IF EXISTS "User Hanya Melihat Tiket Miliknya Atau Admin" ON public.b3_tickets;
CREATE POLICY "User Hanya Melihat Tiket Miliknya Atau Admin"
  ON public.b3_tickets FOR SELECT TO authenticated
  USING (
    pelapor_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "User Hanya Membuat Tiket Atas Namanya" ON public.b3_tickets;
CREATE POLICY "User Hanya Membuat Tiket Atas Namanya"
  ON public.b3_tickets FOR INSERT TO authenticated
  WITH CHECK (pelapor_id = auth.uid());

DROP POLICY IF EXISTS "Admin dan Pemilik Dapat Update Tiket" ON public.b3_tickets;
CREATE POLICY "Admin dan Pemilik Dapat Update Tiket"
  ON public.b3_tickets FOR UPDATE TO authenticated
  USING (
    pelapor_id = auth.uid() 
    OR public.is_admin()
  );

-- 6.5 Policies TPS Logs
DROP POLICY IF EXISTS "Akses Logbook TPS Admin dan Pelapor" ON public.tps_storage_logs;
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

-- 6.5 Policies OTP Password Reset
DROP POLICY IF EXISTS "Akses Bebas OTP Pemulihan Sandi" ON public.password_reset_otps;
CREATE POLICY "Akses Bebas OTP Pemulihan Sandi"
  ON public.password_reset_otps FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);

-- Berikan izin akses penuh ke role service
DO $$ BEGIN
  GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated, anon;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;
  GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, authenticated, anon;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 7. MASTER DATA: JURUSAN, PROGRAM STUDI, & LABORATORIUM POLIMDO
-- ------------------------------------------------------------------------------
INSERT INTO public.units (nama_unit, jurusan, penanggung_jawab, kontak_darurat)
VALUES 
  -- Teknik Elektro
  ('D4 Teknik Informatika', 'Teknik Elektro', 'Koordinator Prodi D4 TI', '08114300001'),
  ('D4 Teknik Listrik', 'Teknik Elektro', 'Koordinator Prodi D4 TL', '08114300002'),
  ('D3 Teknik Listrik', 'Teknik Elektro', 'Koordinator Prodi D3 TL', '08114300003'),
  ('D3 Teknik Komputer', 'Teknik Elektro', 'Koordinator Prodi D3 TK', '08114300004'),

  -- Teknik Mesin
  ('D4 Teknologi Rekayasa Mekatronika', 'Teknik Mesin', 'Koordinator Prodi D4 TRM', '08114300005'),
  ('D4 Teknik Mesin Produksi dan Perawatan', 'Teknik Mesin', 'Koordinator Prodi D4 TMPP', '08114300006'),
  ('D3 Teknik Mesin', 'Teknik Mesin', 'Koordinator Prodi D3 TM', '08114300007'),

  -- Teknik Sipil
  ('D4 Konstruksi Bangunan Gedung', 'Teknik Sipil', 'Koordinator Prodi D4 KBG', '08114300008'),
  ('D4 Teknik Jalan Jembatan', 'Teknik Sipil', 'Koordinator Prodi D4 TJJ', '08114300009'),
  ('D3 Teknik Sipil', 'Teknik Sipil', 'Koordinator Prodi D3 TS', '08114300010'),
  ('D3 Rekayasa Perawatan & Restorasi Bangunan Gedung', 'Teknik Sipil', 'Koordinator Prodi D3 RPRBG', '08114300011'),

  -- Akuntansi
  ('D4 Akuntansi Keuangan', 'Akuntansi', 'Koordinator Prodi D4 AK', '08114300012'),
  ('D4 Akuntansi Perpajakan', 'Akuntansi', 'Koordinator Prodi D4 AP', '08114300013'),
  ('D3 Akuntansi', 'Akuntansi', 'Koordinator Prodi D3 AK', '08114300014'),

  -- Administrasi Bisnis
  ('D4 Manajemen Bisnis', 'Administrasi Bisnis', 'Koordinator Prodi D4 MB', '08114300015'),
  ('D3 Manajemen Pemasaran', 'Administrasi Bisnis', 'Koordinator Prodi D3 MP', '08114300016'),
  ('D3 Administrasi Bisnis', 'Administrasi Bisnis', 'Koordinator Prodi D3 AB', '08114300017'),

  -- Pariwisata
  ('D4 Manajemen Perhotelan', 'Pariwisata', 'Koordinator Prodi D4 MPH', '08114300018'),
  ('D4 Global Tourism Management', 'Pariwisata', 'Koordinator Prodi D4 GTM', '08114300019'),
  ('D3 Pariwisata', 'Pariwisata', 'Koordinator Prodi D3 PAR', '08114300020'),
  ('D3 Underwater Ecotourism', 'Pariwisata', 'Koordinator Prodi D3 UWE', '08114300021'),
  ('D3 Usaha Perjalanan Wisata', 'Pariwisata', 'Koordinator Prodi D3 UPW', '08114300022'),

  -- Laboratorium / Bengkel Kerja Penghasil Limbah B3
  ('Lab Kimia Terapan & Uji Bahan', 'Teknik Sipil', 'Kepala Lab Kimia Terapan', '08114300030'),
  ('Lab Uji Tanah & Material Sipil', 'Teknik Sipil', 'Kepala Lab Uji Tanah', '08114300031'),
  ('Lab Mesin & Otomotif', 'Teknik Mesin', 'Kepala Lab Otomotif', '08114300032'),
  ('Bengkel Fabrikasi & Pengelasan', 'Teknik Mesin', 'Kepala Bengkel Fabrikasi', '08114300033'),
  ('Lab Teknik Elektro', 'Teknik Elektro', 'Kepala Lab Elektro', '08114300034'),
  ('Lab Komputer & Jaringan', 'Teknik Elektro', 'Kepala Lab Komputer', '08114300035'),
  ('Lab Lingkungan & Kualitas Air', 'UPT K3L', 'Kepala Lab Lingkungan', '08114300036'),
  ('TPS B3 Terpadu', 'UPT K3L', 'Petugas Pengelola TPS B3', '08114300037')
ON CONFLICT (nama_unit) DO UPDATE 
SET 
  jurusan = EXCLUDED.jurusan,
  penanggung_jawab = EXCLUDED.penanggung_jawab,
  kontak_darurat = EXCLUDED.kontak_darurat;

-- ------------------------------------------------------------------------------
-- 8. SEED DATA AKUN RESMI (ADMIN K3L, ADMIN TPS, & LABORAN PELAPOR)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_tps_id   UUID := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_user_id  UUID := 'a0000000-0000-0000-0000-000000000003'::uuid;
  v_unit_kimia_id UUID;
BEGIN

  SELECT id INTO v_unit_kimia_id FROM public.units WHERE nama_unit = 'Lab Kimia Terapan & Uji Bahan' LIMIT 1;

  -- 8.1 AKUN ADMIN UTAMA K3L: admin@polimdo.ac.id / AdminK3L2026!
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@polimdo.ac.id') THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('AdminK3L2026!', gen_salt('bf', 10)),
      email_confirmed_at = NOW(),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      raw_user_meta_data = '{"full_name":"Petugas Admin K3L POLIMDO","id_number":"198501012010121001","role":"verifikator_k3l"}'::jsonb
    WHERE email = 'admin@polimdo.ac.id';

    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@polimdo.ac.id';
  ELSE
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_admin_id,
      'admin@polimdo.ac.id',
      crypt('AdminK3L2026!', gen_salt('bf', 10)),
      NOW(),
      '{"full_name":"Petugas Admin K3L POLIMDO","id_number":"198501012010121001","role":"verifikator_k3l"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      'authenticated',
      'authenticated',
      '', '', '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, email, nama_lengkap, nip_nim, role, nama_lab, jurusan, nomor_wa
  ) VALUES (
    v_admin_id,
    'admin@polimdo.ac.id',
    'Petugas Admin K3L POLIMDO',
    '198501012010121001',
    'verifikator_k3l',
    'Unit K3L POLIMDO',
    'UPT K3L',
    '08114301111'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'verifikator_k3l',
    email = EXCLUDED.email,
    nama_lengkap = EXCLUDED.nama_lengkap,
    nip_nim = EXCLUDED.nip_nim,
    nama_lab = EXCLUDED.nama_lab,
    jurusan = EXCLUDED.jurusan;

  -- 8.2 AKUN ADMIN PENGELOLA TPS: admin_tps@polimdo.ac.id / AdminTPS2026!
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin_tps@polimdo.ac.id') THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('AdminTPS2026!', gen_salt('bf', 10)),
      email_confirmed_at = NOW(),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      raw_user_meta_data = '{"full_name":"Petugas Pengelola TPS B3","id_number":"198804152014041002","role":"admin_tps"}'::jsonb
    WHERE email = 'admin_tps@polimdo.ac.id';

    SELECT id INTO v_tps_id FROM auth.users WHERE email = 'admin_tps@polimdo.ac.id';
  ELSE
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_tps_id,
      'admin_tps@polimdo.ac.id',
      crypt('AdminTPS2026!', gen_salt('bf', 10)),
      NOW(),
      '{"full_name":"Petugas Pengelola TPS B3","id_number":"198804152014041002","role":"admin_tps"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      'authenticated',
      'authenticated',
      '', '', '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, email, nama_lengkap, nip_nim, role, nama_lab, jurusan, nomor_wa
  ) VALUES (
    v_tps_id,
    'admin_tps@polimdo.ac.id',
    'Petugas Pengelola TPS B3',
    '198804152014041002',
    'admin_tps',
    'TPS B3 Terpadu POLIMDO',
    'UPT K3L',
    '08114302222'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin_tps',
    email = EXCLUDED.email,
    nama_lengkap = EXCLUDED.nama_lengkap,
    nip_nim = EXCLUDED.nip_nim,
    nama_lab = EXCLUDED.nama_lab,
    jurusan = EXCLUDED.jurusan;

  -- 8.3 AKUN LABORAN PELAPOR: laboran@polimdo.ac.id / Pelapor2026!
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'laboran@polimdo.ac.id') THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Pelapor2026!', gen_salt('bf', 10)),
      email_confirmed_at = NOW(),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      raw_user_meta_data = '{"full_name":"Laboran Kimia Terapan","id_number":"199207222019032005","role":"unit_pelapor"}'::jsonb
    WHERE email = 'laboran@polimdo.ac.id';

    SELECT id INTO v_user_id FROM auth.users WHERE email = 'laboran@polimdo.ac.id';
  ELSE
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_user_id,
      'laboran@polimdo.ac.id',
      crypt('Pelapor2026!', gen_salt('bf', 10)),
      NOW(),
      '{"full_name":"Laboran Kimia Terapan","id_number":"199207222019032005","role":"unit_pelapor"}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      'authenticated',
      'authenticated',
      '', '', '', ''
    );
  END IF;

  INSERT INTO public.profiles (
    id, email, nama_lengkap, nip_nim, role, nama_lab, jurusan, unit_id, nomor_wa
  ) VALUES (
    v_user_id,
    'laboran@polimdo.ac.id',
    'Laboran Kimia Terapan',
    '199207222019032005',
    'unit_pelapor',
    'Lab Kimia Terapan & Uji Bahan',
    'Teknik Sipil',
    v_unit_kimia_id,
    '08114303333'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'unit_pelapor',
    email = EXCLUDED.email,
    nama_lengkap = EXCLUDED.nama_lengkap,
    nip_nim = EXCLUDED.nip_nim,
    nama_lab = EXCLUDED.nama_lab,
    jurusan = EXCLUDED.jurusan,
    unit_id = EXCLUDED.unit_id;

  -- ----------------------------------------------------------------------------
  -- 8.4 SEED CONTOH TIKET PELAPORAN B3 (SIAP DISPLAY DI DASHBOARD)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.b3_tickets (
    id, pelapor_id, unit_id, nama_limbah, kode_limbah, fase, volume, satuan, 
    jenis_kemasan, karakteristik_bahaya, lokasi_pengambilan, patokan_lokasi, 
    tanggal_dihasilkan, status, verifikator_id, catatan_verifikasi, verified_at
  ) VALUES 
    (
      'B3-2026-001',
      v_user_id,
      v_unit_kimia_id,
      'Oli Bekas Mesin & Pelumas Hidrolik',
      'B105d',
      'cair',
      45.00,
      'Liter',
      'Drum Logam 50L',
      '["Mudah Menyala", "Beracun"]'::jsonb,
      'Bengkel Mesin & Fabrikasi Gedung C Lt. 1',
      'Dekat mesin bubut presisi',
      CURRENT_DATE - INTERVAL '6 days',
      'masuk_tps',
      v_admin_id,
      'Kemasan tersegel rapi dan berlabel simbol bahaya standar KLHK.',
      NOW() - INTERVAL '5 days'
    ),
    (
      'B3-2026-002',
      v_user_id,
      v_unit_kimia_id,
      'Asam Sulfat & Residu Reagen Praktikum',
      'A106b',
      'cair',
      15.50,
      'Liter',
      'Jeriken HDPE Khusus Asam B3',
      '["Korosif", "Beracun"]'::jsonb,
      'Lab Kimia Terapan & Uji Bahan Lt. 2',
      'Lemari asam kimia room 204',
      CURRENT_DATE - INTERVAL '2 days',
      'menunggu_verifikasi',
      NULL,
      NULL,
      NULL
    ),
    (
      'B3-2026-003',
      v_user_id,
      v_unit_kimia_id,
      'Sludge IPAL Terpadu Kampus',
      'B351-1',
      'sludge',
      85.00,
      'Kg',
      'Jumbo Bag HDPE Bertutup',
      '["Beracun"]'::jsonb,
      'Instalasi Pengolahan Air Limbah Terpadu',
      'Bak sedimentasi tahap 2',
      CURRENT_DATE - INTERVAL '10 days',
      'terverifikasi',
      v_admin_id,
      'Telah diverifikasi sesuai baku mutu lingkungan.',
      NOW() - INTERVAL '8 days'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 8.5 SEED LOGBOOK TPS
  INSERT INTO public.tps_storage_logs (
    ticket_id, tgl_masuk_tps, tgl_jatuh_tempo, posisi_rak_tps, status_neraca
  ) VALUES (
    'B3-2026-001',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '85 days', -- 90 hari batas simpan
    'Zona Cairan Mudah Menyala - Rak A2',
    'tersimpan'
  )
  ON CONFLICT DO NOTHING;

END $$;
