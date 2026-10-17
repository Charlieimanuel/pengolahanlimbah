"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  ImageIcon,
  Loader2,
  User,
  Boxes,
  Calendar,
  Clock,
  Layers,
  Scale,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Maximize2,
  Check,
} from "lucide-react";
import { toast } from "@/lib/toast";

export interface TicketInspectionModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TicketDetail {
  id: string;
  nama_limbah: string;
  kode_limbah: string;
  volume: number;
  satuan: string;
  fase: string;
  jenis_kemasan: string;
  karakteristik_bahaya: string[];
  is_emergency: boolean;
  lokasi_pengambilan: string;
  patokan_lokasi?: string;
  deskripsi_sumber?: string;
  foto_limbah_url?: string[];
  status: string;
  catatan_verifikasi?: string;
  tanggal_dihasilkan: string;
  created_at?: string;
  pelapor?: {
    nama_lengkap: string;
    nip_nim: string | null;
    email: string | null;
    jurusan?: string | null;
  };
}

const KODE_LIMBAH_OPTIONS = [
  { code: "B105d", name: "Minyak Pelumas Bekas (Oli Bengkel/Mesin)" },
  { code: "B107d", name: "Aki / Baterai Asam Bekas" },
  { code: "B109d", name: "Limbah Elektronik Termasuk PCB & Komponen" },
  { code: "A102d", name: "Buangan Asam / Basa Kuat Laboratorium" },
  { code: "A108d", name: "Sludge Pengolahan Logam Berat & Elektroplating" },
  { code: "B305-1", name: "Pelarut Organik Bekas (Aseton, Etanol, Toluena)" },
  { code: "B321-4", name: "Reagen Kimia Kedaluwarsa / Sisa Analisis Lab" },
  { code: "A337-1", name: "Kain Majun, Sarung Tangan & Absorben Terkontaminasi" },
];

const RAK_TPS_OPTIONS = [
  { id: "Rak A-01", name: "Rak A-01 (Lemari Asam / Reagen Anorganik)", zone: "Kategori 1" },
  { id: "Rak A-02", name: "Rak A-02 (Ventilasi Khusus - Pelarut Flammable)", zone: "Kategori 1" },
  { id: "Rak B-01", name: "Rak B-01 (Sludge & Residu Padat Logam)", zone: "Kategori 2" },
  { id: "Zona Drum C-01", name: "Zona Drum C-01 (Oli / Pelumas Bekas Mesin)", zone: "Kategori 2" },
  { id: "Rak D-01", name: "Rak D-01 (E-Waste, PCB & Komponen Elektronik)", zone: "Kategori 2" },
  { id: "Rak D-02", name: "Rak D-02 (Baterai Bekas & Aki Kering/Basah)", zone: "Kategori 2" },
];

export default function TicketInspectionModal({
  ticketId,
  isOpen,
  onClose,
  onSuccess,
}: TicketInspectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"evakuasi" | "tolak">("evakuasi");
  const [mobileSection, setMobileSection] = useState<"detail" | "form">("detail");

  // Form states for inspection
  const [adjustedKode, setAdjustedKode] = useState("");
  const [adjustedVolume, setAdjustedVolume] = useState<number | string>("");
  const [adjustedSatuan, setAdjustedSatuan] = useState("Liter");
  const [selectedRak, setSelectedRak] = useState(RAK_TPS_OPTIONS[0].id);
  const [masaSimpanHari, setMasaSimpanHari] = useState<number>(90);
  const [catatanVerifikasi, setCatatanVerifikasi] = useState("");
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMobileSection("detail");
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !ticketId) {
      setTicket(null);
      return;
    }

    const cleanId = ticketId.replace("#", "").trim();

    async function fetchTicket() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("b3_tickets")
          .select("*, profiles:pelapor_id(nama_lengkap, nip_nim, email, jurusan)")
          .eq("id", cleanId)
          .maybeSingle();

        if (data && !error) {
          const detail: TicketDetail = {
            ...data,
            pelapor: data.profiles as any,
          };
          setTicket(detail);
          setAdjustedKode(detail.kode_limbah || "B105d");
          setAdjustedVolume(detail.volume || 1);
          setAdjustedSatuan(detail.satuan || "Liter");
          setCatatanVerifikasi(
            detail.catatan_verifikasi ||
              `Fisik limbah telah diinspeksi oleh K3L dan dievakuasi ke TPS B3 POLIMDO dalam kondisi aman.`
          );

          // Tentukan estimasi masa simpan otomatis berdasarkan jenis
          if (detail.kode_limbah?.startsWith("A") || detail.is_emergency) {
            setMasaSimpanHari(90);
          } else {
            setMasaSimpanHari(180);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil detail tiket inspeksi:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [isOpen, ticketId]);

  if (!isOpen || !ticketId) return null;

  // Calculate deadline date
  const now = new Date();
  const deadlineDate = new Date(now.getTime() + masaSimpanHari * 24 * 60 * 60 * 1000);
  const formattedDeadline = deadlineDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Normalize photo URLs
  const getPhotoUrls = (): string[] => {
    const raw = ticket?.foto_limbah_url || (ticket as any)?.foto_url || (ticket as any)?.foto_bukti_url;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((u) => {
          if (typeof u === "string") {
            try {
              if (u.startsWith("[") && u.endsWith("]")) {
                const parsed = JSON.parse(u);
                return Array.isArray(parsed) ? parsed[0] : u;
              }
            } catch {}
            return u.trim();
          }
          return "";
        })
        .filter((u): u is string => typeof u === "string" && u.length > 0);
    }
    if (typeof raw === "string" && raw.trim().length > 0) {
      try {
        if (raw.startsWith("[") && raw.endsWith("]")) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
          }
        }
      } catch {}
      return [raw.trim()];
    }
    return [];
  };

  const photoUrls = getPhotoUrls();

  const handleEvakuasiDanTerima = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    try {
      setSubmitting(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const verifikatorId = user?.id || null;

      // 1. Update status tiket menjadi 'masuk_tps'
      const { error: ticketError } = await supabase
        .from("b3_tickets")
        .update({
          status: "masuk_tps",
          kode_limbah: adjustedKode,
          volume: Number(adjustedVolume) || ticket.volume,
          satuan: adjustedSatuan,
          verifikator_id: verifikatorId,
          catatan_verifikasi: catatanVerifikasi,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (ticketError) throw ticketError;

      // 2. Insert record ke tps_storage_logs
      const { error: logError } = await supabase.from("tps_storage_logs").insert([
        {
          ticket_id: ticket.id,
          tgl_masuk_tps: new Date().toISOString(),
          tgl_jatuh_tempo: deadlineDate.toISOString(),
          posisi_rak_tps: selectedRak,
          status_neraca: "tersimpan",
        },
      ]);

      if (logError) {
        console.warn("Log TPS info:", logError.message);
      }

      toast.success(`Tiket #${ticket.id} Berhasil Diverifikasi!`, {
        description: `Limbah telah dijadwalkan evakuasi ke ${selectedRak} TPS POLIMDO.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal memproses verifikasi limbah:", err);
      toast.error("Gagal Memverifikasi Tiket", {
        description: err?.message || "Koneksi terputus ke database",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTolakLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!alasanPenolakan.trim()) {
      toast.warning("Alasan Penolakan Wajib Diisi", {
        description: "Mohon berikan alasan agar pelapor memahami tindakan yang perlu diambil.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("b3_tickets")
        .update({
          status: "ditolak",
          verifikator_id: user?.id || null,
          catatan_verifikasi: alasanPenolakan,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.info(`Tiket #${ticket.id} Telah Ditolak`, {
        description: "Catatan penolakan telah tersimpan dan diteruskan ke pelapor.",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal menolak tiket:", err);
      toast.error("Gagal Menolak Tiket", {
        description: err?.message || "Kesalahan koneksi database",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      {/* Lightbox Preview Foto Besar */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-110 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <button
            onClick={() => setPreviewPhotoUrl(null)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-white/80 hover:text-white p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <img
            src={previewPhotoUrl}
            alt="Bukti Foto Resolusi Penuh"
            className="max-w-[96vw] max-h-[80vh] sm:max-w-[92vw] sm:max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
          />
          <div className="mt-3 flex items-center gap-3">
            <a
              href={previewPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Buka Resolusi Asli</span>
            </a>
            <span className="text-slate-300 text-xs">Klik di mana saja untuk menutup</span>
          </div>
        </div>
      )}

      {/* Main Container Modal */}
      <div className="relative w-full max-w-5xl bg-white border border-[#e2eae4] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96dvh] sm:max-h-[92vh]">
        {/* Header Modal — Rich Forest Green Botanical Banner */}
        <div className="relative overflow-hidden bg-[#284533] text-white px-3.5 py-3 sm:px-6 sm:py-4.5 border-b border-[#1e3426] flex items-center justify-between shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 scale-105"
            style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-wider sm:tracking-widest text-emerald-300 font-bold uppercase">
                  Inspeksi & Verifikasi
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono bg-white/10 border border-white/20 text-white font-bold">
                  {ticket?.id || ticketId}
                </span>
                {ticket?.is_emergency && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-600/90 text-white animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    Kedaruratan
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight mt-0.5 truncate">
                {ticket ? ticket.nama_limbah : "Memuat Data Tiket..."}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Tabs (Hanya Muncul di Layar HP < lg) */}
        {ticket && !loading && (
          <div className="lg:hidden flex border-b border-[#e5ece6] bg-[#f8faf8] p-1.5 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSection("detail")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mobileSection === "detail"
                  ? "bg-[#284533] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-[#e5ece6] hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detail Temuan</span>
              {ticket.foto_limbah_url && ticket.foto_limbah_url.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileSection("form")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mobileSection === "form"
                  ? "bg-[#284533] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-[#e5ece6] hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Formulir K3L</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
            <Loader2 className="w-8 h-8 text-[#284533] animate-spin" />
            <p className="text-xs text-slate-500">Mengambil data tiket dan catatan fisik dari database...</p>
          </div>
        ) : !ticket ? (
          <div className="py-16 px-6 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Tiket tidak ditemukan atau telah dihapus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-[#e5ece6] flex-1">
            {/* SISI KIRI: Detail Laporan Temuan Pelapor (5 Kolom) */}
            <div
              className={`lg:col-span-5 p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4 bg-[#fbfcfb] overflow-y-auto ${
                mobileSection === "detail" ? "block" : "hidden lg:block"
              }`}
            >
              {/* Card Lokasi Temuan */}
              <div className="p-4 rounded-xl bg-white border border-[#e2eae4] shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  Lokasi Temuan di Kampus
                </div>
                <p className="text-sm font-bold text-slate-900">{ticket.lokasi_pengambilan}</p>
                {ticket.patokan_lokasi && (
                  <div className="text-xs text-slate-600 bg-[#f8faf8] px-3 py-1.5 rounded-lg border border-[#e2eae4] flex items-start gap-1.5">
                    <span className="font-semibold text-emerald-800 shrink-0">Patokan:</span>
                    <span>{ticket.patokan_lokasi}</span>
                  </div>
                )}
              </div>

              {/* Foto Bukti Limbah Temuan (Utama di Sisi Kiri) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#e2eae4] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    Bukti Visual Lapangan
                  </span>
                  {photoUrls.length > 0 ? (
                    <span className="text-[10px] text-slate-600 font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {photoUrls.length} Foto Terlampir
                    </span>
                  ) : null}
                </div>

                {photoUrls.length > 0 ? (
                  photoUrls.length === 1 ? (
                    <div
                      onClick={() => setPreviewPhotoUrl(photoUrls[0])}
                      className="group relative h-48 sm:h-56 rounded-xl overflow-hidden border border-[#dce8df] bg-slate-100 cursor-pointer shadow-xs hover:border-[#284533] transition-all"
                      title="Klik untuk memperbesar foto resolusi penuh"
                    >
                      <img
                        src={photoUrls[0]}
                        alt="Bukti visual temuan limbah"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Maximize2 className="w-4 h-4" />
                        <span>Klik untuk Memperbesar Foto</span>
                      </div>
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-medium backdrop-blur-xs">
                        🔍 Resolusi Penuh
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {photoUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewPhotoUrl(url)}
                          className="group relative h-28 sm:h-32 rounded-xl overflow-hidden border border-[#dce8df] bg-slate-100 cursor-pointer shadow-xs hover:border-[#284533] transition-all"
                          title="Klik untuk memperbesar foto"
                        >
                          <img
                            src={url}
                            alt={`Bukti visual ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                            <Maximize2 className="w-4 h-4" />
                            <span>Perbesar</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-[#dce8df] text-center bg-[#fbfcfb]">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Tidak ada lampiran foto dari pelapor</p>
                  </div>
                )}
              </div>

              {/* Data Pelapor */}
              <div className="p-4 rounded-xl bg-white border border-[#e2eae4] shadow-xs space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  <User className="w-4 h-4 text-emerald-700" />
                  Civitas Pelapor
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nama Pelapor:</span>
                  <span className="font-bold text-slate-900">{ticket.pelapor?.nama_lengkap || "Anonim"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">NIP / NIM:</span>
                  <span className="font-mono text-slate-800 font-semibold">{ticket.pelapor?.nip_nim || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Waktu Laporan:</span>
                  <span className="text-slate-700">
                    {ticket.tanggal_dihasilkan
                      ? new Date(ticket.tanggal_dihasilkan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Karakteristik & Kemasan */}
              <div className="p-4 rounded-xl bg-white border border-[#e2eae4] shadow-xs space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Karakteristik & Wadah Fisik
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#f8faf8] border border-[#e5ece6]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Bentuk / Fase</span>
                    <span className="font-bold text-slate-900 capitalize">{ticket.fase}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f8faf8] border border-[#e5ece6]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Kemasan Temuan</span>
                    <span className="font-bold text-slate-900">{ticket.jenis_kemasan}</span>
                  </div>
                </div>

                {/* Bahaya Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.isArray(ticket.karakteristik_bahaya) && ticket.karakteristik_bahaya.length > 0 ? (
                    ticket.karakteristik_bahaya.map((b, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-800"
                      >
                        ⚠️ {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Belum ada label bahaya spesifik</span>
                  )}
                </div>
              </div>

              {ticket.deskripsi_sumber && (
                <div className="p-3 rounded-xl bg-white border border-[#e2eae4] text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-0.5">Catatan Pelapor:</span>
                  {ticket.deskripsi_sumber}
                </div>
              )}

              {/* Tombol Lanjut ke Form di Layar HP */}
              <div className="lg:hidden pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setMobileSection("form")}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#284533] hover:bg-[#1e3426] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
                >
                  <span>Lanjut ke Formulir Keputusan K3L</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SISI KANAN: Formulir Verifikasi & Keputusan K3L (7 Kolom) */}
            <div
              className={`lg:col-span-7 p-3.5 sm:p-5 lg:p-6 flex flex-col justify-between space-y-4 sm:space-y-5 bg-white overflow-y-auto ${
                mobileSection === "form" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Quick summary for mobile with photo thumbnail */}
              <div className="lg:hidden p-2.5 rounded-xl bg-[#f4f8f5] border border-[#dce8df] flex items-center gap-2.5 text-xs">
                {photoUrls.length > 0 ? (
                  <div
                    onClick={() => setPreviewPhotoUrl(photoUrls[0])}
                    className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#dce8df] shrink-0 bg-slate-100 cursor-pointer hover:border-[#284533] transition"
                    title="Klik untuk memperbesar foto"
                  >
                    <img src={photoUrls[0]} alt="Bukti" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[9px] font-bold opacity-0 hover:opacity-100 transition-opacity">
                      🔍
                    </span>
                  </div>
                ) : null}
                <div className="truncate flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block font-semibold">Limbah Terpilih:</span>
                  <span className="font-bold text-slate-900 truncate block">{ticket.nama_limbah}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSection("detail")}
                  className="text-[11px] text-[#284533] font-bold underline shrink-0 cursor-pointer"
                >
                  Detail Lengkap
                </button>
              </div>

              {/* Tab Tindakan K3L */}
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex rounded-xl bg-[#f4f7f5] p-1 border border-[#dce8df] gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("evakuasi")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "evakuasi"
                        ? "bg-[#284533] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Terima & Evakuasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tolak")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "tolak"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Tolak Laporan</span>
                  </button>
                </div>

                {/* Pratinjau Foto Bukti Lapangan Langsung di Kolom Form */}
                {photoUrls.length > 0 && (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-[#f8faf8] border border-[#dce8df] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#284533]" />
                        <span>Foto Bukti Fisik Lapangan ({photoUrls.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Klik untuk memperbesar</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photoUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewPhotoUrl(url)}
                          className="group relative h-20 w-28 shrink-0 rounded-lg overflow-hidden border border-[#dce8df] bg-slate-100 cursor-pointer hover:border-[#284533] shadow-xs transition"
                          title="Klik untuk memperbesar foto bukti"
                        >
                          <img
                            src={url}
                            alt={`Bukti visual ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Maximize2 className="w-3 h-3" />
                            <span>Perbesar</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "evakuasi" ? (
                  <form id="form-evakuasi" onSubmit={handleEvakuasiDanTerima} className="space-y-3 sm:space-y-3.5">
                    {/* 1. Klasifikasi Kode Limbah PP 22/2021 */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Kode Limbah Resmi (PP No. 22/2021)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Koreksi bila perlu</span>
                      </label>
                      <select
                        value={adjustedKode}
                        onChange={(e) => {
                          setAdjustedKode(e.target.value);
                          if (e.target.value.startsWith("A")) {
                            setMasaSimpanHari(90);
                          } else {
                            setMasaSimpanHari(180);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none focus:ring-1 focus:ring-[#284533]"
                      >
                        {KODE_LIMBAH_OPTIONS.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} - {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Timbangan Riil Lapangan (Volume & Satuan) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-[#284533]" />
                          Volume Riil / Timbangan
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={adjustedVolume}
                          onChange={(e) => setAdjustedVolume(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                          placeholder="Contoh: 5.25"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Satuan Ukur</label>
                        <select
                          value={adjustedSatuan}
                          onChange={(e) => setAdjustedSatuan(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                        >
                          <option value="Liter">Liter (Volume Cairan)</option>
                          <option value="Kilogram">Kilogram (Padatan / Sludge)</option>
                          <option value="Drum (200L)">Drum (200 L)</option>
                          <option value="Jeriken (20L)">Jeriken (20 L)</option>
                          <option value="Unit">Unit (E-Waste / Baterai)</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Penempatan Posisi Rak di Gedung TPS POLIMDO */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-[#284533]" />
                        Alokasi Rak & Zona Simpan TPS
                      </label>
                      <select
                        value={selectedRak}
                        onChange={(e) => setSelectedRak(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                      >
                        {RAK_TPS_OPTIONS.map((rak) => (
                          <option key={rak.id} value={rak.id}>
                            {rak.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Durasi Masa Simpan & Perhitungan Jatuh Tempo PP 22/2021 */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2eae4] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#284533]" />
                          Batas Maksimal Masa Simpan
                        </span>
                        <span className="text-[#284533] font-mono font-bold">{masaSimpanHari} Hari</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {[
                          { days: 90, label: "90 Hari", desc: "Kat. 1" },
                          { days: 180, label: "180 Hari", desc: "Kat. 2 Spesifik" },
                          { days: 365, label: "365 Hari", desc: "Kat. 2 Umum" },
                        ].map((m) => (
                          <button
                            key={m.days}
                            type="button"
                            onClick={() => setMasaSimpanHari(m.days)}
                            className={`p-1.5 sm:p-2 rounded-xl text-center border transition-all cursor-pointer ${
                              masaSimpanHari === m.days
                                ? "bg-[#eaf4ed] border-[#284533] text-[#284533] font-bold shadow-xs"
                                : "bg-white border-[#e5ece6] text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span className="block text-[11px] sm:text-xs font-bold">{m.label}</span>
                            <span className="block text-[8px] sm:text-[9px] text-slate-500 truncate">{m.desc}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 border-t border-[#e5ece6]">
                        <span>Estimasi Batas Angkut (Jatuh Tempo):</span>
                        <span className="font-bold text-[#284533] underline">{formattedDeadline}</span>
                      </div>
                    </div>

                    {/* 5. Catatan Verifikator K3L */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#284533]" />
                        Catatan Verifikasi & Berita Lapangan
                      </label>
                      <textarea
                        rows={2}
                        value={catatanVerifikasi}
                        onChange={(e) => setCatatanVerifikasi(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                        placeholder="Tuliskan kondisi segel kemasan, label hazard yang ditempel, atau personil yang mengangkut..."
                      />
                    </div>
                  </form>
                ) : (
                  /* Form Penolakan */
                  <form id="form-tolak" onSubmit={handleTolakLaporan} className="space-y-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
                      <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Peringatan Penolakan Tiket
                      </div>
                      <p className="text-xs text-red-800 leading-relaxed">
                        Laporan temuan limbah yang ditolak tidak akan dibukukan ke dalam Logbook TPS & Neraca B3 POLIMDO.
                        Pelapor akan menerima notifikasi alasan penolakan pada portal riwayat tiketnya.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        Alasan Penolakan Resmi <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={alasanPenolakan}
                        onChange={(e) => setAlasanPenolakan(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-red-300 text-slate-900 text-xs sm:text-sm focus:border-red-600 focus:outline-none placeholder:text-slate-400"
                        placeholder="Contoh: Setelah tim K3L melakukan survei ke Ruang Lab Kimia 2, jeriken tersebut berisi air suling non-B3, bukan larutan asam pekat..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Bukan limbah B3 (sampah domestik/umum)",
                        "Lokasi fisik tidak ditemukan saat tim survei",
                        "Limbah telah diamankan petugas unit terkait",
                        "Data pelaporan tidak valid/duplikat",
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAlasanPenolakan(preset)}
                          className="px-2.5 py-1 rounded-lg text-[10px] bg-[#f8faf8] border border-[#dce8df] text-slate-700 hover:bg-[#edf3ef] transition cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </form>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 sm:pt-4 border-t border-[#e5ece6] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-white sticky bottom-0 z-10 pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#dce8df] text-slate-700 hover:bg-[#f8faf8] text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50 text-center"
                >
                  Batal
                </button>

                {activeTab === "evakuasi" ? (
                  <button
                    type="submit"
                    form="form-evakuasi"
                    disabled={submitting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#284533] hover:bg-[#1e3527] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membukukan ke TPS...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Evakuasi & Terima ke TPS</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="form-tolak"
                    disabled={submitting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Penolakan...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Tolak Laporan Temuan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
