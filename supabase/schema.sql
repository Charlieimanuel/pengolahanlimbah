-- ==============================================================================
-- SISTEM PENGELOLAAN LIMBAH B3 POLIMDO (STANDAR PP NO. 22 TAHUN 2021)
-- SKEMA DATABASE SUPABASE: AUTH, PROFILES & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. ENUM DEFINITIONS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('unit_pelapor', 'verifikator_k3l', 'admin_tps', 'transporter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE waste_phase AS ENUM ('cair', 'padat', 'sludge', 'gas');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABEL UNIT PENGHASIL (Lab Kimia, Bengkel Mesin, Workshop Elektro, dsb.)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_unit VARCHAR(100) NOT NULL UNIQUE,
  jurusan VARCHAR(100) NOT NULL,
  penanggung_jawab VARCHAR(100),
  kontak_darurat VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PROFIL PENGGUNA (Tersinkronisasi dengan auth.users)
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

-- 4. TABEL TIKET LAPORAN LIMBAH B3
CREATE TABLE IF NOT EXISTS public.b3_tickets (
  id VARCHAR(30) PRIMARY KEY, -- Format: 'B3-2026-001'
  pelapor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id),
  
  -- Spesifikasi Limbah PP 22/2021
  nama_limbah VARCHAR(200) NOT NULL,
  kode_limbah VARCHAR(50) NOT NULL, -- Contoh: 'B105d'
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

-- 5. TABEL LOGBOOK TPS & NERACA LIMBAH (Masa Simpan 90/180/365 Hari)
CREATE TABLE IF NOT EXISTS public.tps_storage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(30) NOT NULL REFERENCES public.b3_tickets(id) ON DELETE CASCADE,
  tgl_masuk_tps TIMESTAMPTZ DEFAULT NOW(),
  tgl_jatuh_tempo TIMESTAMPTZ NOT NULL, -- Deadline batas masa simpan
  posisi_rak_tps VARCHAR(50),
  tgl_pengeluaran TIMESTAMPTZ,
  nama_transporter VARCHAR(100),
  nomor_festronik VARCHAR(100),
  dokumen_bast_url TEXT,
  status_neraca VARCHAR(50) DEFAULT 'tersimpan'
);

-- ==============================================================================
-- TRIGGER: AUTO CREATE PROFILE SAAT USER REGISTER DI AUTH.USERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'id_number', null),
    COALESCE(new.raw_user_meta_data->>'whatsapp', null),
    COALESCE(new.raw_user_meta_data->>'gender', null),
    COALESCE(new.raw_user_meta_data->>'birth_place', null),
    NULLIF(new.raw_user_meta_data->>'birth_date', '')::date,
    COALESCE(new.raw_user_meta_data->>'address', null),
    COALESCE(new.raw_user_meta_data->>'jurusan', null),
    COALESCE(new.raw_user_meta_data->>'lab', null),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'unit_pelapor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNGSI BANTUAN LOGIN NIP / NIM (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_email_by_nip(p_identifier TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE nip_nim = p_identifier OR email = p_identifier
  LIMIT 1;
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - ISOLASI DATA TIAP USER
-- ==============================================================================
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b3_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tps_storage_logs ENABLE ROW LEVEL SECURITY;

-- Policy Units
DROP POLICY IF EXISTS "Semua user terotentikasi dapat melihat unit" ON public.units;
CREATE POLICY "Semua user terotentikasi dapat melihat unit"
  ON public.units FOR SELECT TO authenticated USING (true);

-- Policy Profiles:
-- 1. User hanya dapat membaca profilnya sendiri
-- 2. Verifikator K3L dan Admin TPS dapat melihat semua profil untuk kebutuhan verifikasi
DROP POLICY IF EXISTS "Isolasi Profil User" ON public.profiles;
CREATE POLICY "Isolasi Profil User"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('verifikator_k3l', 'admin_tps')
  );

DROP POLICY IF EXISTS "User Update Profil Sendiri" ON public.profiles;
CREATE POLICY "User Update Profil Sendiri"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Policy Tiket B3 (ATURAN UTAMA: TIAP USER HANYA MELIHAT DATANYA SENDIRI):
DROP POLICY IF EXISTS "User Hanya Melihat Tiket Miliknya" ON public.b3_tickets;
CREATE POLICY "User Hanya Melihat Tiket Miliknya"
  ON public.b3_tickets FOR SELECT TO authenticated
  USING (
    pelapor_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('verifikator_k3l', 'admin_tps')
  );

DROP POLICY IF EXISTS "User Hanya Membuat Tiket Atas Namanya" ON public.b3_tickets;
CREATE POLICY "User Hanya Membuat Tiket Atas Namanya"
  ON public.b3_tickets FOR INSERT TO authenticated
  WITH CHECK (pelapor_id = auth.uid());

DROP POLICY IF EXISTS "User Update Tiket Draft / K3L Update Status" ON public.b3_tickets;
CREATE POLICY "User Update Tiket Draft / K3L Update Status"
  ON public.b3_tickets FOR UPDATE TO authenticated
  USING (
    (pelapor_id = auth.uid() AND status = 'draft')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('verifikator_k3l', 'admin_tps')
  );

-- Policy Logbook TPS & Neraca:
DROP POLICY IF EXISTS "Akses tps_storage_logs untuk K3L dan TPS" ON public.tps_storage_logs;
CREATE POLICY "Akses tps_storage_logs untuk K3L dan TPS" ON public.tps_storage_logs
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('verifikator_k3l', 'admin_tps')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('verifikator_k3l', 'admin_tps')
  );

DROP POLICY IF EXISTS "Pelapor dapat membaca log TPS miliknya" ON public.tps_storage_logs;
CREATE POLICY "Pelapor dapat membaca log TPS miliknya" ON public.tps_storage_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.b3_tickets 
      WHERE b3_tickets.id = tps_storage_logs.ticket_id 
      AND b3_tickets.pelapor_id = auth.uid()
    )
  );

-- Master Data Jurusan dan Ruang Lab / Bengkel / Prodi POLIMDO
INSERT INTO public.units (nama_unit, jurusan)
VALUES 
  -- Teknik Elektro
  ('D4 Teknik Informatika', 'Teknik Elektro'),
  ('D4 Teknik Listrik', 'Teknik Elektro'),
  ('D3 Teknik Listrik', 'Teknik Elektro'),
  ('D3 Teknik Komputer', 'Teknik Elektro'),

  -- Teknik Mesin
  ('D4 Teknologi Rekayasa Mekatronika', 'Teknik Mesin'),
  ('D4 Teknik Mesin Produksi dan Perawatan', 'Teknik Mesin'),

  -- Teknik Sipil
  ('D3 Rekayasa Perawatan & Restorasi Bangunan Gedung', 'Teknik Sipil'),
  ('D4 Konstruksi Bangunan Gedung', 'Teknik Sipil'),
  ('D4 Teknik Jalan Jembatan', 'Teknik Sipil'),
  ('D3 Teknik Sipil', 'Teknik Sipil'),

  -- Akuntansi
  ('D4 Akuntansi Keuangan', 'Akuntansi'),
  ('D4 Akuntansi Perpajakan', 'Akuntansi'),
  ('D3 Akuntansi', 'Akuntansi'),

  -- Administrasi Bisnis
  ('D4 Manajemen Bisnis', 'Administrasi Bisnis'),
  ('D3 Manajemen Pemasaran', 'Administrasi Bisnis'),
  ('D3 Administrasi Bisnis', 'Administrasi Bisnis'),

  -- Pariwisata
  ('D4 Manajemen Perhotelan', 'Pariwisata'),
  ('D4 Global Tourism Management', 'Pariwisata'),
  ('D3 Pariwisata', 'Pariwisata'),
  ('D3 Underwater Ecotourism', 'Pariwisata'),
  ('D3 Usaha Perjalanan Wisata', 'Pariwisata')
ON CONFLICT (nama_unit) DO UPDATE 
SET jurusan = EXCLUDED.jurusan;

-- Tabel Kode OTP Pemulihan Kata Sandi
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.password_reset_otps TO anon, authenticated, service_role;

