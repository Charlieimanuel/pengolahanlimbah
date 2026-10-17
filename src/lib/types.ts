// ==============================================================================
// 1. TICKET & WASTE MANAGEMENT TYPES
// ==============================================================================

export type TicketStatus =
  | "draft"
  | "menunggu_verifikasi"
  | "terverifikasi"
  | "masuk_tps"
  | "ditolak"
  | "selesai";

export type WastePhase = "cair" | "padat" | "sludge" | "gas";

export interface TicketReporter {
  id?: string;
  nama_lengkap: string;
  nip_nim: string | null;
  email?: string | null;
  unit_kerja?: string | null;
}

export interface Ticket {
  id: string;
  pelapor_id: string;
  unit_id: string | null;
  nama_limbah: string;
  kode_limbah: string;
  fase: WastePhase;
  volume: number;
  satuan: string;
  jenis_kemasan: string;
  karakteristik_bahaya: string[];
  is_emergency: boolean;
  lokasi_pengambilan: string;
  patokan_lokasi?: string | null;
  deskripsi_sumber?: string | null;
  tanggal_dihasilkan: string;
  foto_limbah_url?: string[];
  status: TicketStatus;
  verifikator_id?: string | null;
  catatan_verifikasi?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at?: string;
  pelapor?: TicketReporter;
}

export interface CreateTicketPayload {
  id?: string;
  pelapor_id: string;
  unit_id?: string | null;
  nama_limbah: string;
  kode_limbah: string;
  fase: WastePhase;
  volume: number;
  satuan: string;
  jenis_kemasan: string;
  karakteristik_bahaya: string[];
  is_emergency: boolean;
  lokasi_pengambilan: string;
  patokan_lokasi?: string | null;
  deskripsi_sumber?: string | null;
  tanggal_dihasilkan: string;
  foto_limbah_url?: string[];
  status: TicketStatus;
}

export interface VerifyInspectionPayload {
  ticketId: string;
  storageDays: number;
  storageRack: string;
  verifiedByUserId?: string | null;
}

export interface RejectInspectionPayload {
  ticketId: string;
  rejectionReason: string;
  verifiedByUserId?: string | null;
}

// ==============================================================================
// 2. USER & AUTHENTICATION TYPES
// ==============================================================================

export type UserRole = "civitas" | "admin" | "petugas_k3l" | "superadmin";

export interface UserProfile {
  id: string;
  nama_lengkap: string;
  nip_nim: string | null;
  email: string | null;
  unit_id: string | null;
  role: UserRole | string;
  nama_lab?: string | null;
  jurusan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminProfile extends UserProfile {
  role: "admin" | "petugas_k3l" | "superadmin";
}

export interface AcademicUnit {
  id: string;
  nama_unit: string;
  kode_unit: string;
  fakultas_jurusan?: string;
}

// ==============================================================================
// 3. TPS STORAGE & LOGBOOK TYPES
// ==============================================================================

export interface TpsStorageLog {
  id?: string;
  ticket_id: string;
  tgl_masuk_tps: string;
  tgl_jatuh_tempo: string;
  posisi_rak_tps: string;
  status_neraca: "tersimpan" | "dikeluarkan" | "dimusnahkan";
  created_at?: string;
}

export interface TpsRackSlot {
  rackId: string;
  label: string;
  category: string;
  isAvailable: boolean;
}
