"use client";

import React, { useState, useEffect } from "react";
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

interface AdminTicketInspectionModalProps {
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

export default function AdminTicketInspectionModal({
  ticketId,
  isOpen,
  onClose,
  onSuccess,
}: AdminTicketInspectionModalProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"evakuasi" | "tolak">("evakuasi");

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

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal memproses verifikasi limbah:", err);
      alert(`Terjadi kesalahan saat memverifikasi: ${err?.message || "Koneksi terputus"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTolakLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!alasanPenolakan.trim()) {
      alert("Mohon berikan alasan penolakan agar pelapor memahami tindakan yang perlu diambil.");
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

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal menolak tiket:", err);
      alert(`Gagal menolak laporan: ${err?.message || "Kesalahan database"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Lightbox Preview Foto Besar */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <button
            onClick={() => setPreviewPhotoUrl(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewPhotoUrl}
            alt="Bukti Foto Resolusi Penuh"
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
          />
          <p className="mt-3 text-slate-300 text-xs sm:text-sm">Klik di mana saja untuk menutup pratinjau</p>
        </div>
      )}

      {/* Main Container Modal */}
      <div className="relative w-full max-w-5xl bg-white border border-[#e2eae4] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Modal — Rich Forest Green Botanical Banner */}
        <div className="relative overflow-hidden bg-[#284533] text-white px-6 py-5 border-b border-[#1e3426] flex items-center justify-between">
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 scale-105"
            style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-emerald-300 font-bold uppercase">
                  Inspeksi & Verifikasi K3L
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 border border-white/20 text-white font-bold">
                  {ticket?.id || ticketId}
                </span>
                {ticket?.is_emergency && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-white" />
                    Kedaruratan Tinggi
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {ticket ? ticket.nama_limbah : "Memuat Data Tiket..."}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-4 bg-[#fbfcfb] overflow-y-auto">
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

              {/* Foto Bukti Limbah Temuan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#284533]" />
                    Bukti Visual Lapangan
                  </span>
                  {ticket.foto_limbah_url && ticket.foto_limbah_url.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-normal">{ticket.foto_limbah_url.length} Gambar</span>
                  )}
                </div>

                {ticket.foto_limbah_url && ticket.foto_limbah_url.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {ticket.foto_limbah_url.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewPhotoUrl(url)}
                        className="group relative h-28 rounded-xl overflow-hidden border border-[#dce8df] bg-slate-100 cursor-pointer shadow-xs hover:border-[#284533] transition-all"
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
                ) : (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-[#dce8df] text-center bg-white">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Tidak ada lampiran foto dari pelapor</p>
                  </div>
                )}
              </div>

              {ticket.deskripsi_sumber && (
                <div className="p-3 rounded-xl bg-white border border-[#e2eae4] text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-0.5">Catatan Pelapor:</span>
                  {ticket.deskripsi_sumber}
                </div>
              )}
            </div>

            {/* SISI KANAN: Formulir Verifikasi & Keputusan K3L (7 Kolom) */}
            <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-white">
              {/* Tab Tindakan K3L */}
              <div className="space-y-4">
                <div className="flex rounded-xl bg-[#f4f7f5] p-1 border border-[#dce8df]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("evakuasi")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "evakuasi"
                        ? "bg-[#284533] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Terima & Evakuasi ke TPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tolak")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "tolak"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Tolak Laporan / Bukan B3
                  </button>
                </div>

                {activeTab === "evakuasi" ? (
                  <form id="form-evakuasi" onSubmit={handleEvakuasiDanTerima} className="space-y-3.5">
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
                    <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2eae4] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#284533]" />
                          Batas Maksimal Masa Simpan
                        </span>
                        <span className="text-[#284533] font-mono font-bold">{masaSimpanHari} Hari</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { days: 90, label: "90 Hari", desc: "Kat. 1 / Bahaya" },
                          { days: 180, label: "180 Hari", desc: "Kat. 2 Spesifik" },
                          { days: 365, label: "365 Hari", desc: "Kat. 2 Umum (<50kg)" },
                        ].map((m) => (
                          <button
                            key={m.days}
                            type="button"
                            onClick={() => setMasaSimpanHari(m.days)}
                            className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                              masaSimpanHari === m.days
                                ? "bg-[#eaf4ed] border-[#284533] text-[#284533] font-bold shadow-xs"
                                : "bg-white border-[#e5ece6] text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span className="block text-xs font-bold">{m.label}</span>
                            <span className="block text-[9px] text-slate-500">{m.desc}</span>
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
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
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
              <div className="pt-4 border-t border-[#e5ece6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-[#dce8df] text-slate-700 hover:bg-[#f8faf8] text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>

                {activeTab === "evakuasi" ? (
                  <button
                    type="submit"
                    form="form-evakuasi"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-[#284533] hover:bg-[#1e3527] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
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
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
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
    </div>
  );
}
