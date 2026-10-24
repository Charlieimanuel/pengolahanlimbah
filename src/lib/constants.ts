// ==============================================================================
// 1. APPLICATION ROUTE CONSTANTS
// ==============================================================================

export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/daftar",
  FORGOT_PASSWORD: "/lupa-sandi",

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    TICKET_VERIFICATION: "/admin/verifikasi-tiket",
    TPS_LOGBOOK: "/admin/logbook-tps",
    WASTE_BALANCE: "/admin/neraca-limbah",
    USERS: "/admin/pengguna",
    EXPORT_REPORTS: "/admin/laporan-ekspor",
  },

  USER: {
    NEW_REPORT: "/user/laporan-baru",
    TICKET_HISTORY: "/user/riwayat-tiket",
    SOP_GUIDE: "/user/panduan-sop",
    UNIT_PROFILE: "/user/profil-unit",
  },
} as const;

export type AppRoute = typeof APP_ROUTES;

// ==============================================================================
// 2. K3 SAFETY & WASTE PARAMETERS
// ==============================================================================

export const K3_HAZARD_TYPES = [
  "Mudah Menyala (Flammable)",
  "Beracun (Toksik)",
  "Korosif (Corrosive)",
  "Reaktif (Reactive)",
  "Infeksius (Infectious)",
  "Campuran Berbahaya",
] as const;

export const WASTE_STORAGE_LIMITS = [
  { days: 90, label: "90 Hari", desc: "Kat. 1 / Bahaya Tinggi", category: "Kategori 1" },
  { days: 180, label: "180 Hari", desc: "Kat. 2 Sumber Spesifik", category: "Kategori 2 Spesifik" },
  { days: 365, label: "365 Hari", desc: "Kat. 2 Umum (<50 kg/hari)", category: "Kategori 2 Umum" },
] as const;

export const WASTE_PACKAGING_TYPES = [
  "Jeriken HDPE Tertutup Rapat",
  "Drum Logam Bertutup Ring",
  "Botol Kaca Gelap (Amber)",
  "Plastik Tebal Double Seal",
  "Box Safety Khusus B3",
] as const;

// ==============================================================================
// 3. JURUSAN & PROGRAM STUDI POLIMDO
// ==============================================================================

export const PRODI_BY_JURUSAN: Record<string, string[]> = {
  "Teknik Elektro": [
    "D4 Teknik Informatika",
    "D4 Teknik Listrik",
    "D3 Teknik Listrik",
    "D3 Teknik Komputer",
  ],
  "Teknik Mesin": [
    "D4 Teknologi Rekayasa Mekatronika",
    "D4 Teknik Mesin Produksi dan Perawatan",
    "D3 Teknik Mesin",
  ],
  "Teknik Sipil": [
    "D4 Konstruksi Bangunan Gedung",
    "D4 Teknik Jalan Jembatan",
    "D3 Teknik Sipil",
    "D3 Rekayasa Perawatan & Restorasi Bangunan Gedung",
  ],
  "Akuntansi": [
    "D4 Akuntansi Keuangan",
    "D4 Akuntansi Perpajakan",
    "D3 Akuntansi",
  ],
  "Administrasi Bisnis": [
    "D4 Manajemen Bisnis",
    "D3 Manajemen Pemasaran",
    "D3 Administrasi Bisnis",
  ],
  "Pariwisata": [
    "D4 Manajemen Perhotelan",
    "D4 Global Tourism Management",
    "D3 Pariwisata",
    "D3 Underwater Ecotourism",
    "D3 Usaha Perjalanan Wisata",
  ],
};

export const LIST_JURUSAN = Object.keys(PRODI_BY_JURUSAN);
