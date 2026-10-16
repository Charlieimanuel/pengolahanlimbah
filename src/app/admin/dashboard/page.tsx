"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  MapPin,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Calendar,
  Check,
} from "lucide-react";

interface TicketSummary {
  id: string;
  nama_limbah: string;
  kode_limbah: string;
  volume: number;
  satuan: string;
  lokasi_pengambilan: string;
  patokan_lokasi: string | null;
  karakteristik_bahaya: string[];
  is_emergency: boolean;
  status: string;
  tanggal_dihasilkan: string;
  foto_limbah_url: string[] | null;
  pelapor?: {
    nama_lengkap: string;
    nip_nim: string | null;
  };
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    emergency: 0,
    verified: 0,
    totalVolumeCair: 0,
    totalVolumePadat: 0,
  });

  const loadDashboardData = React.useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("b3_tickets")
        .select("*, profiles:pelapor_id(nama_lengkap, nip_nim)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: TicketSummary[] = data.map((t) => ({
          ...t,
          pelapor: t.profiles as any,
        }));
        setTickets(mapped);

        // Hitung statistik riil
        const pending = mapped.filter((t) => t.status === "menunggu_verifikasi");
        const emergency = mapped.filter((t) => t.is_emergency && t.status === "menunggu_verifikasi");
        const verified = mapped.filter(
          (t) => t.status === "terverifikasi" || t.status === "masuk_tps" || t.status === "selesai"
        );

        let volCair = 0;
        let volPadat = 0;

        mapped.forEach((t) => {
          const v = Number(t.volume) || 0;
          if (t.satuan?.toLowerCase().includes("kg")) {
            volPadat += v;
          } else {
            volCair += v;
          }
        });

        setStats({
          total: mapped.length,
          pending: pending.length,
          emergency: emergency.length,
          verified: verified.length,
          totalVolumeCair: volCair,
          totalVolumePadat: volPadat,
        });
      }
    } catch (err) {
      console.error("Gagal load data dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(true);

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 8000);

    const handleFocus = () => {
      loadDashboardData(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadDashboardData]);

  const emergencyTickets = tickets.filter(
    (t) => t.is_emergency && t.status === "menunggu_verifikasi"
  );
  const pendingTickets = tickets.filter((t) => t.status === "menunggu_verifikasi");

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER BANNER — Rich Forest Green Botanical Wallpaper
      ========================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-[#284533] text-white p-4 sm:p-7 shadow-sm border border-[#1e3426]">
        {/* Real Botanical Leaf Wallpaper Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 scale-105"
          style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
        />
        {/* Ambient forest green gradient to ensure perfect text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

        {/* Decorative Monstera Leaf Silhouette */}
        <div className="absolute -bottom-8 -right-6 pointer-events-none opacity-20 text-emerald-200 hidden sm:block">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 22" strokeWidth="1.5" />
            <path d="M12 4C14.5 4.5 17 6 18 8.5C18.5 9.7 18.2 11.2 17.5 12.2C16.8 13.2 15.5 13.8 14.5 14.5C13.5 15.2 12.8 16 12 17" fill="currentColor" fillOpacity="0.3" />
            <path d="M12 4C9.5 4.5 7 6 6 8.5C5.5 9.7 5.8 11.2 6.5 12.2C7.2 13.2 8.5 13.8 9.5 14.5C10.5 15.2 11.2 16 12 17" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/90 tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              COMMAND CENTER K3L POLIMDO
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Dashboard Pengawasan & Tanggap Darurat Limbah B3
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Pusat monitoring temuan limbah kampus, verifikasi kepatuhan PP No. 22/2021, dan kontrol logbook Tempat Penyimpanan Sementara (TPS).
            </p>
          </div>


        </div>
      </div>

      {/* =========================================================
          METRIC CARDS — 4 Key KPI Blocks
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Menunggu Verifikasi */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              ANTREAN VERIFIKASI
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.pending}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Laporan temuan baru belum diinspeksi
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Butuh tindakan
            </span>
            <Link href="/admin/verifikasi-tiket" className="text-[#284533] font-bold hover:underline">
              Periksa →
            </Link>
          </div>
        </div>

        {/* Metric 2: Alert Bahaya Darurat */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
              TEMUAN DARURAT (K3)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-red-700">
              {stats.emergency}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Wadah bocor / bahan beracun aktif
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px]">
            <span className="text-red-700 font-semibold">Prioritas Evakuasi 1</span>
            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
              Siaga K3
            </span>
          </div>
        </div>

        {/* Metric 3: Total Terverifikasi & TPS */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              DIAMANKAN DI TPS
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#284533]">
              {stats.verified}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {stats.totalVolumeCair.toFixed(1)} L Cair • {stats.totalVolumePadat.toFixed(1)} kg Padat
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Tercatat di neraca</span>
            <Link href="/admin/logbook-tps" className="text-[#284533] font-bold hover:underline">
              Buka TPS →
            </Link>
          </div>
        </div>

        {/* Metric 4: Kepatuhan Penanganan */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              KEPATUHAN PENANGANAN
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 100}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Standar baku mutu PP 22/2021
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#284533] h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 1: EMERGENCY LIVE ALERTS (Prioritas Penjemputan)
      ========================================================= */}
      {emergencyTickets.length > 0 && (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <h3 className="text-sm font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Peringatan Darurat: {emergencyTickets.length} Temuan Berbahaya Perlu Evakuasi Segera
              </h3>
            </div>
            <Link
              href="/admin/verifikasi-tiket"
              className="text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1"
            >
              Tangani Semua Antrean Darurat →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {emergencyTickets.slice(0, 2).map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl p-3.5 border border-red-200/80 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      {t.id}
                    </span>
                    <span className="text-[10px] text-slate-500">{t.tanggal_dihasilkan}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {t.nama_limbah}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate font-medium">{t.lokasi_pengambilan}</span>
                  </div>
                  {t.patokan_lokasi && (
                    <div className="text-[10px] text-slate-400 italic truncate">
                      Patokan: {t.patokan_lokasi}
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/verifikasi-tiket`}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shrink-0 transition active:scale-95 shadow-xs"
                >
                  Evakuasi
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          SECTION 2: ANTREAN TEMUAN TERBARU & CEPAT TANGGAP
      ========================================================= */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5ece6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#284533]"></span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Antrean Temuan Limbah Masuk (Menunggu Verifikasi)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Laporan yang baru diajukan oleh warga kampus yang membutuhkan verifikasi teknis dan penjemputan fisik ke TPS.
            </p>
          </div>

          <Link
            href="/admin/verifikasi-tiket"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dce8df] hover:bg-[#f4f7f5] text-xs font-semibold text-[#284533] transition self-start sm:self-auto"
          >
            <span>Buka Halaman Verifikasi Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingTickets.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Tidak Ada Antrean Temuan Baru
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Seluruh laporan temuan limbah di lingkungan kampus telah selesai diverifikasi dan diamankan oleh tim K3L.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5ece6]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
                  <th className="py-3 px-3.5">ID TIKET</th>
                  <th className="py-3 px-3.5">PELAPOR</th>
                  <th className="py-3 px-3.5">LOKASI & PATOKAN TEMUAN</th>
                  <th className="py-3 px-3.5">DUGAAN LIMBAH</th>
                  <th className="py-3 px-3.5">VOLUME</th>
                  <th className="py-3 px-3.5">STATUS</th>
                  <th className="py-3 px-3.5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ef]">
                {pendingTickets.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-[#f9fbf9] transition">
                    <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {t.is_emergency && (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                        )}
                        <span className={t.is_emergency ? "text-red-600" : "text-slate-800"}>
                          {t.id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {t.pelapor?.nama_lengkap || "Civitas Kampus"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {t.pelapor?.nip_nim ? `NIP/NIM: ${t.pelapor.nip_nim}` : "Pengguna Umum"}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 max-w-[200px]">
                      <div className="text-slate-900 font-medium truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span className="truncate">{t.lokasi_pengambilan}</span>
                      </div>
                      {t.patokan_lokasi && (
                        <div className="text-[10px] text-slate-500 italic truncate">
                          {t.patokan_lokasi}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{t.nama_limbah}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.kode_limbah}</div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {t.volume} {t.satuan}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Menunggu Verifikasi</span>
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/verifikasi-tiket`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#284533] hover:bg-[#1f3627] text-white text-[11px] font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspeksi</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          SECTION 3: PANDUAN CEPAT TIM K3L POLIMDO
      ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#e2eae4] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="text-xs font-bold text-slate-900">Validasi Jenis & Kode PP 22/2021</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Pastikan limbah terklasifikasi sesuai tabel Lampiran K PP 22/2021 (Asam, Pelarut, Sludge, atau Logam Berat) sebelum dimasukkan ke TPS.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e2eae4] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="text-xs font-bold text-slate-900">Perhatikan Masa Simpan TPS</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Limbah Kategori 1 wajib diserahkan ke transporter berizin dalam waktu maksimal 90 hari kalender sejak tanggal penerimaan di TPS.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e2eae4] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="text-xs font-bold text-slate-900">Sinkronisasi Dokumen Festronik</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Setiap pengangkutan limbah keluar kampus wajib mencatat nomor manifest elektronik KLHK (Festronik) dan mengunggah salinan BAST.
          </p>
        </div>
      </div>
    </div>
  );
}
