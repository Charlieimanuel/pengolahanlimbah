"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  ImageIcon,
  Loader2,
  User,
  Boxes,
  Truck,
  Calendar,
  AlertCircle,
  FileCheck,
  Maximize2,
} from "lucide-react";

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
}

interface DbTicketDetail {
  id: string;
  nama_limbah: string;
  kode_limbah: string;
  volume: number;
  satuan: string;
  fase: string;
  jenis_kemasan: string;
  karakteristik_bahaya: string[];
  lokasi_pengambilan: string;
  patokan_lokasi?: string;
  deskripsi_sumber?: string;
  foto_limbah_url?: string[];
  status: string;
  catatan_verifikasi?: string;
  verified_at?: string;
  created_at?: string;
  pelapor?: {
    nama_lengkap: string;
    nip_nim: string;
    email: string;
    nama_lab?: string;
  };
  verifikator?: {
    nama_lengkap: string;
    nip_nim: string;
    role?: string;
  };
  tps_storage_logs?: Array<{
    posisi_rak_tps: string | null;
    status_neraca: string;
    nama_transporter: string | null;
    nomor_festronik: string | null;
    tgl_masuk_tps: string;
    tgl_jatuh_tempo: string;
    tgl_pengeluaran: string | null;
  }>;
}

export default function TicketDetailModal({
  ticketId,
  onClose,
}: TicketDetailModalProps) {
  const [detail, setDetail] = useState<DbTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setDetail(null);
      return;
    }

    const cleanId = ticketId.replace("#", "").trim();

    async function loadDetail() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("b3_tickets")
          .select(`
            *,
            pelapor:pelapor_id(nama_lengkap, nip_nim, email, nama_lab),
            verifikator:verifikator_id(nama_lengkap, nip_nim, role),
            tps_storage_logs(posisi_rak_tps, status_neraca, nama_transporter, nomor_festronik, tgl_masuk_tps, tgl_jatuh_tempo, tgl_pengeluaran)
          `)
          .eq("id", cleanId)
          .maybeSingle();

        if (data && !error) {
          setDetail({
            ...data,
            pelapor: data.pelapor as any,
            verifikator: data.verifikator as any,
            tps_storage_logs: data.tps_storage_logs as any,
          });
        } else {
          setDetail(null);
        }
      } catch (err) {
        console.error("Gagal load detail tiket dari database:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [ticketId]);

  if (!ticketId) return null;

  const isFromDb = detail !== null;
  const statusStr = detail?.status || "menunggu_verifikasi";

  const isTps = statusStr === "masuk_tps";
  const isDispatched = statusStr === "diangkut_pihak3";
  const isVerified = isTps || isDispatched || statusStr === "terverifikasi" || statusStr === "selesai";
  const isRejected = statusStr === "ditolak";
  const isDraft = statusStr === "draft";

  const tpsLog = detail?.tps_storage_logs?.[0] || null;

  const rawPhotos = detail?.foto_limbah_url;
  const photoUrls: string[] = Array.isArray(rawPhotos)
    ? rawPhotos.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : typeof rawPhotos === "string" && (rawPhotos as string).trim().length > 0
    ? [(rawPhotos as string).trim()]
    : [];

  const getStatusBadge = () => {
    if (isTps) {
      return {
        label: "Masuk TPS POLIMDO",
        className: "bg-[#eaf4ed] text-[#244b32] border-[#cbe4d4]",
      };
    }
    if (isDispatched) {
      return {
        label: "Diangkut Pihak-3 (Festronik)",
        className: "bg-blue-50 text-blue-800 border-blue-200",
      };
    }
    if (isRejected) {
      return {
        label: "Ditolak Petugas K3L",
        className: "bg-red-50 text-red-800 border-red-200",
      };
    }
    if (isVerified) {
      return {
        label: "Terverifikasi & Tercatat",
        className: "bg-[#eaf4ed] text-[#244b32] border-[#cbe4d4]",
      };
    }
    if (isDraft) {
      return {
        label: "Draft Tersimpan",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    return {
      label: "Menunggu Verifikasi K3L",
      className: "bg-amber-50 text-amber-800 border-amber-200",
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      {/* Lightbox Preview Foto Resolusi Penuh */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <button
            onClick={() => setPreviewPhotoUrl(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition"
            title="Tutup Pratinjau"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewPhotoUrl}
            alt="Bukti Foto Resolusi Penuh"
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
          />
          <div className="mt-3 flex items-center gap-3">
            <a
              href={previewPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Buka di Tab Baru</span>
            </a>
            <span className="text-slate-300 text-xs">Klik di mana saja untuk menutup</span>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#e2eae4] animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5ece6]">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-base font-mono font-bold text-slate-900">
              {ticketId.startsWith("#") ? ticketId : `#${ticketId}`}
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-[#f4f8f5] transition cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#284533]" />
            <span className="text-xs">Memuat detail dari database Supabase...</span>
          </div>
        ) : !detail ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Laporan Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Anda tidak memiliki hak akses untuk melihat data laporan ini, atau tiket belum tersimpan di database.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#284533] text-white text-xs font-bold hover:bg-[#1f3627] transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            {/* Alert Status Khusus: Ditolak atau TPS */}
            {isRejected && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Laporan Ditolak Tim K3L</span>
                </div>
                <p className="text-[11px] text-red-700 leading-snug">
                  {detail?.catatan_verifikasi || "Laporan tidak memenuhi kriteria verifikasi fisik limbah B3 kampus."}
                </p>
              </div>
            )}

            {isTps && tpsLog && (
              <div className="p-3 rounded-xl bg-[#eaf4ed] border border-[#cbe4d4] text-xs text-[#244b32] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#284533] shrink-0" />
                  <span>Limbah Telah Tersimpan di TPS B3 POLIMDO</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2 pt-1">
                  <span>
                    Penempatan: <strong className="text-slate-900">{tpsLog.posisi_rak_tps || "Rak Kategori Khusus"}</strong>
                  </span>
                  {tpsLog.tgl_jatuh_tempo && (
                    <span className="text-amber-800 font-medium">
                      Batas Simpan: {new Date(tpsLog.tgl_jatuh_tempo).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isDispatched && tpsLog && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Telah Diangkut Pihak ke-3 (Manifest Festronik)</span>
                </div>
                <div className="text-[11px] text-blue-700 pt-1 space-y-0.5">
                  <div>Transporter: <strong>{tpsLog.nama_transporter || "PT Wastec International"}</strong></div>
                  <div>No. Festronik KLHK: <strong className="font-mono">{tpsLog.nomor_festronik || "FES-KLHK-2026-001"}</strong></div>
                </div>
              </div>
            )}

            {/* Spesifikasi Limbah */}
            <div className="bg-[#f8faf8] p-3.5 rounded-xl border border-[#e2eae4] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    DUGAAN / JENIS LIMBAH
                  </span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {detail ? detail.nama_limbah : "Asam Sulfat (H₂SO₄)"}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-800 font-semibold mt-0.5">
                    {detail ? detail.kode_limbah : "Kode: B105d"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    VOLUME FISIK
                  </span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {detail ? `${detail.volume} ${detail.satuan}` : "15 Liter"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Fase: {detail ? detail.fase : "Cair"}
                  </div>
                </div>
              </div>

              {/* Bahaya & Wadah */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {detail && Array.isArray(detail.karakteristik_bahaya) ? (
                    detail.karakteristik_bahaya.map((b, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      Korosif
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Wadah: <span className="font-bold text-slate-800">{detail ? detail.jenis_kemasan : "Jerigen 20L"}</span>
                </div>
              </div>
            </div>

            {/* Info Grid: Lokasi, Pelapor, dan Verifikator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-[#fbfcfb] p-3 sm:p-3.5 rounded-xl border border-[#e2eae4] text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>Lokasi Ditemukan</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {detail ? detail.lokasi_pengambilan : "Gedung Kuliah Terpadu, Lt. 1"}
                </div>
                {detail?.patokan_lokasi && (
                  <div className="text-[10px] text-slate-500 mt-0.5 italic">
                    Patokan: {detail.patokan_lokasi}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-700" />
                  <span>Identitas Pelapor</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {detail?.pelapor?.nama_lengkap || "Civitas POLIMDO"}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {detail?.pelapor?.nip_nim ? `NIP/NIM: ${detail.pelapor.nip_nim}` : "Pengguna Terdaftar"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Verifikator K3L</div>
                <div className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#284533]" />
                  <span>
                    {detail?.verifikator?.nama_lengkap
                      ? detail.verifikator.nama_lengkap
                      : isVerified
                      ? "Petugas K3L POLIMDO"
                      : isRejected
                      ? "Petugas Pengawas K3L"
                      : "Dalam Antrean Verifikasi"}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Standar Kepatuhan</div>
                <div className="font-semibold text-[#244b32] mt-0.5 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#244b32]" />
                  <span>PP RI No. 22/2021</span>
                </div>
              </div>
            </div>

            {/* Foto Bukti Temuan jika ada */}
            {photoUrls.length > 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <ImageIcon className="w-3.5 h-3.5 text-[#284533]" />
                    <span>Foto Bukti Fisik Temuan</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {photoUrls.length} Foto
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {photoUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewPhotoUrl(url)}
                      className="group relative h-28 rounded-xl overflow-hidden border border-[#dce8df] bg-slate-100 cursor-pointer shadow-xs hover:border-[#284533] transition-all"
                    >
                      <img
                        src={url}
                        alt={`Bukti temuan ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                        <Maximize2 className="w-4 h-4" />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-[#dce8df] text-center bg-slate-50/50">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                  <ImageIcon className="w-4 h-4 text-slate-300" />
                  <span>Tidak ada lampiran foto bukti fisik</span>
                </div>
              </div>
            )}

            {/* 4-Stage Timeline Status Pelaporan */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ALUR SIKLUS HIDUP LIMBAH B3 KAMPUS
              </div>
              <div className="space-y-2 text-xs">
                {/* Tahap 1: Laporan Temuan */}
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#eaf4ed] border border-[#cbe4d4]">
                  <CheckCircle2 className="w-4 h-4 text-[#244b32] shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">1. Laporan Temuan Dikirim</span>
                    <span className="text-[11px] text-slate-500 block">
                      Tersimpan di database pelaporan temuan POLIMDO
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#244b32]">Selesai</span>
                </div>

                {/* Tahap 2: Verifikasi Fisik & Timbangan K3L */}
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                    isRejected
                      ? "bg-red-50 border-red-200"
                      : isVerified
                      ? "bg-[#eaf4ed] border-[#cbe4d4]"
                      : "bg-amber-50/70 border-amber-200"
                  }`}
                >
                  {isRejected ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  ) : isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-[#244b32] shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                  )}
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">
                      2. Verifikasi & Penimbangan K3L
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isRejected
                        ? "Laporan ditolak oleh petugas verifikator K3L"
                        : isVerified
                        ? `Diverifikasi oleh ${detail?.verifikator?.nama_lengkap || "Petugas K3L POLIMDO"}`
                        : "Dalam antrean verifikasi & tim tanggap darurat menuju lokasi"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isRejected ? "text-red-700" : isVerified ? "text-[#244b32]" : "text-amber-800"
                    }`}
                  >
                    {isRejected ? "Ditolak" : isVerified ? "Selesai" : "Sedang Berjalan"}
                  </span>
                </div>

                {/* Tahap 3: Penyimpanan TPS & Neraca */}
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                    isTps || isDispatched
                      ? "bg-[#eaf4ed] border-[#cbe4d4]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {isTps || isDispatched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#244b32] shrink-0" />
                  ) : (
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span
                      className={`font-bold ${
                        isTps || isDispatched ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      3. Penyimpanan TPS & Neraca B3
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isTps || isDispatched
                        ? `Dicatat di neraca TPS (${tpsLog?.posisi_rak_tps || "Rak Khusus"})`
                        : "Menunggu penimbangan dan verifikasi TPS"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isTps || isDispatched ? "text-[#244b32]" : "text-slate-400"
                    }`}
                  >
                    {isTps || isDispatched ? "Tercatat" : "Pending"}
                  </span>
                </div>

                {/* Tahap 4: Pengangkutan Festronik KLHK Pihak-3 */}
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                    isDispatched
                      ? "bg-blue-50 border-blue-200"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {isDispatched ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span
                      className={`font-bold ${
                        isDispatched ? "text-blue-900" : "text-slate-500"
                      }`}
                    >
                      4. Pengangkutan Berizin Festronik
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isDispatched
                        ? `Diangkut oleh ${tpsLog?.nama_transporter || "Transporter"} (${tpsLog?.nomor_festronik || "Festronik KLHK"})`
                        : "Dijadwalkan saat pengangkutan periodik TPS"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isDispatched ? "text-blue-800" : "text-slate-400"
                    }`}
                  >
                    {isDispatched ? "Selesai" : "Terjadwal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Tambahan */}
            {(detail?.deskripsi_sumber || detail?.catatan_verifikasi) && (
              <div className="bg-[#fbfcfb] p-3 rounded-xl border border-[#e2eae4] text-xs space-y-1.5">
                {detail.deskripsi_sumber && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Catatan Pelapor</div>
                    <div className="text-slate-700 italic">{detail.deskripsi_sumber}</div>
                  </div>
                )}
                {detail.catatan_verifikasi && (
                  <div className="pt-1.5 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Catatan Verifikator K3L</div>
                    <div className="text-slate-700 font-medium">{detail.catatan_verifikasi}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#e5ece6] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#284533] hover:bg-[#1f3627] text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </>
);
}
