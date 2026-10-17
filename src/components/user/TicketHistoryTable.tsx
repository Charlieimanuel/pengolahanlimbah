"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Loader2,
  FileText,
  Boxes,
  Truck,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

export interface TicketItem {
  id: string;
  isEmergency: boolean;
  tanggal: string;
  senyawa: string;
  kode: string;
  volume: string;
  bentuk: string;
  wadah: string;
  lokasi: string;
  patokan?: string;
  bahaya: { label: string; color: string }[];
  status: string;
  statusBadge: string;
  statusIcon: React.ElementType;
  catatan: string;
  verifikator: string;
  actionType: string;
}

export interface TicketHistoryTableProps {
  onSelectTicket?: (ticketId: string) => void;
  onStatsLoaded?: (stats: { total: number; pending: number; verified: number; volumeSummary: string }) => void;
}

export default function TicketHistoryTable({
  onSelectTicket,
  onStatsLoaded,
}: TicketHistoryTableProps) {
  const [selectedTab, setSelectedTab] = useState("Semua Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbTickets, setDbTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    nama_lengkap: string;
    nip_nim: string | null;
  } | null>(null);

  const onStatsLoadedRef = useRef(onStatsLoaded);
  useEffect(() => {
    onStatsLoadedRef.current = onStatsLoaded;
  }, [onStatsLoaded]);

  // Fungsi pemanggil data dari Supabase — KHUSUS TIKET MILIK USER TERSEBUT
  const fetchData = React.useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const supabase = createClient();

      // Ambil user yang sedang aktif login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDbTickets([]);
        if (onStatsLoadedRef.current) {
          onStatsLoadedRef.current({
            total: 0,
            pending: 0,
            verified: 0,
            volumeSummary: "0 L / Kg",
          });
        }
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nama_lengkap, nip_nim")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
      }

      // Ambil riwayat tiket EKSKLUSIF hanya untuk user yang login (pelapor_id = user.id)
      const { data, error } = await supabase
        .from("b3_tickets")
        .select(`
          *,
          verifikator:verifikator_id(id, nama_lengkap, nip_nim, role),
          tps_storage_logs(posisi_rak_tps, status_neraca, nama_transporter, nomor_festronik, tgl_masuk_tps, tgl_jatuh_tempo, tgl_pengeluaran)
        `)
        .eq("pelapor_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        let totalVol = 0;
        const mapped: TicketItem[] = data.map((item: any) => {
          totalVol += Number(item.volume) || 0;
          const isTps = item.status === "masuk_tps";
            const isDispatched = item.status === "diangkut_pihak3";
            const isVerified = item.status === "terverifikasi" || item.status === "selesai";
            const isDraft = item.status === "draft";
            const isRejected = item.status === "ditolak";

            let statusText = "Menunggu Verifikasi";
            let statusBadge = "bg-amber-50 text-amber-800 border-amber-200";
            let statusIcon = Clock;

            if (isTps) {
              statusText = "Masuk TPS POLIMDO";
              statusBadge = "bg-[#eaf4ed] text-[#244b32] border-[#cbe4d4]";
              statusIcon = Boxes;
            } else if (isDispatched) {
              statusText = "Diangkut Pihak-3 (Festronik)";
              statusBadge = "bg-blue-50 text-blue-800 border-blue-200";
              statusIcon = Truck;
            } else if (isVerified) {
              statusText = "Terverifikasi & Tercatat";
              statusBadge = "bg-[#eaf4ed] text-[#244b32] border-[#cbe4d4]";
              statusIcon = CheckCircle2;
            } else if (isDraft) {
              statusText = "Draft Tersimpan";
              statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
              statusIcon = Clock;
            } else if (isRejected) {
              statusText = "Ditolak K3L";
              statusBadge = "bg-red-50 text-red-800 border-red-200";
              statusIcon = AlertTriangle;
            }

            const bahayaList = Array.isArray(item.karakteristik_bahaya)
              ? item.karakteristik_bahaya.map((b: string) => ({
                  label: b,
                  color:
                    b.toLowerCase().includes("toksik") ||
                    b.toLowerCase().includes("korosif")
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-amber-50 text-amber-800 border-amber-200",
                }))
              : [];

            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : item.tanggal_dihasilkan;

            // Logika verifikator & catatan
            const verifikatorName =
              item.verifikator?.nama_lengkap ||
              (item.verifikator_id ? "Petugas K3L POLIMDO" : "Menunggu Pemeriksaan Tim K3L");

            const tpsLog = Array.isArray(item.tps_storage_logs) && item.tps_storage_logs.length > 0
              ? item.tps_storage_logs[0]
              : null;

            let noteText = item.deskripsi_sumber
              ? `*${item.deskripsi_sumber}`
              : `*Lokasi: ${item.lokasi_pengambilan}${item.patokan_lokasi ? ` (${item.patokan_lokasi})` : ""}`;

            if (isTps && tpsLog?.posisi_rak_tps) {
              noteText = `*Tersimpan di TPS (${tpsLog.posisi_rak_tps})${item.catatan_verifikasi ? ` • ${item.catatan_verifikasi}` : ""}`;
            } else if (isDispatched && tpsLog?.nomor_festronik) {
              noteText = `*Festronik: ${tpsLog.nomor_festronik} • ${tpsLog.nama_transporter || "Transporter Berizin"}`;
            } else if (isRejected && item.catatan_verifikasi) {
              noteText = `*Catatan Penolakan: ${item.catatan_verifikasi}`;
            } else if (item.catatan_verifikasi) {
              noteText = `*Catatan K3L: ${item.catatan_verifikasi}`;
            }

            return {
              id: item.id.startsWith("#") ? item.id : `#${item.id}`,
              isEmergency: item.is_emergency || false,
              tanggal: dateStr,
              senyawa: item.nama_limbah,
              kode: item.kode_limbah,
              volume: `${item.volume} ${item.satuan}`,
              bentuk:
                item.fase ? item.fase.charAt(0).toUpperCase() + item.fase.slice(1) : "Cair",
              wadah: item.jenis_kemasan,
              lokasi: item.lokasi_pengambilan,
              patokan: item.patokan_lokasi || undefined,
              bahaya:
                bahayaList.length > 0
                  ? bahayaList
                  : [
                      {
                        label: "Temuan Lapangan",
                        color: "bg-[#eaf4ed] text-[#244b32] border-[#cbe4d4]",
                      },
                    ],
              status: statusText,
              statusBadge: statusBadge,
              statusIcon: statusIcon,
              catatan: noteText,
              verifikator: verifikatorName,
              actionType: "detail",
            };
          });

          setDbTickets(mapped);

          // Laporkan statistik ke parent
          if (onStatsLoadedRef.current) {
            const pCount = mapped.filter((t) => t.status === "Menunggu Verifikasi").length;
            const vCount = mapped.filter((t) => t.status === "Terverifikasi & Tercatat").length;
            onStatsLoadedRef.current({
              total: mapped.length,
              pending: pCount,
              verified: vCount,
              volumeSummary: `${totalVol.toFixed(1)} Unit/Volume Tercatat`,
            });
          }
        } else {
          // Jika DB kosong untuk user ini, laporkan statistik 0
          setDbTickets([]);
          if (onStatsLoadedRef.current) {
            onStatsLoadedRef.current({
              total: 0,
              pending: 0,
              verified: 0,
              volumeSummary: "0 L / Kg Tercatat",
            });
          }
        }
      } catch (err) {
        console.error("Gagal memuat tiket dari database:", err);
      } finally {
        setLoading(false);
      }
    }, []);

  // Efek inisialisasi + Auto-Sync berkala (real-time polling setiap 10 detik dan saat tab fokus)
  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 10000);

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchData]);

  // Hanya tiket riil milik akun user yang login
  const allTickets = dbTickets;

  // Hitung jumlah dinamis tiap status
  const tabCounts = {
    all: allTickets.length,
    pending: allTickets.filter((t) => t.status.toLowerCase().includes("menunggu")).length,
    tps: allTickets.filter((t) => t.status === "Masuk TPS POLIMDO" || t.status === "Terverifikasi & Tercatat").length,
    dispatched: allTickets.filter((t) => t.status.toLowerCase().includes("diangkut")).length,
    rejected: allTickets.filter((t) => t.status.toLowerCase().includes("ditolak")).length,
    draft: allTickets.filter((t) => t.status.toLowerCase().includes("draft")).length,
  };

  const filteredTickets = allTickets.filter((t) => {
    const matchQuery =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.senyawa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.verifikator.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === "Semua Status") return matchQuery;
    if (selectedTab === "Menunggu Verifikasi") return matchQuery && t.status.toLowerCase().includes("menunggu");
    if (selectedTab === "Masuk TPS POLIMDO") return matchQuery && (t.status === "Masuk TPS POLIMDO" || t.status === "Terverifikasi & Tercatat");
    if (selectedTab === "Diangkut Pihak-3") return matchQuery && t.status.toLowerCase().includes("diangkut");
    if (selectedTab === "Ditolak K3L") return matchQuery && t.status.toLowerCase().includes("ditolak");
    if (selectedTab === "Draft Tersimpan") return matchQuery && t.status.toLowerCase().includes("draft");
    return matchQuery;
  });

  return (
    <section
      id="riwayat-section"
      className="bg-white border border-[#e2eae4] rounded-2xl p-3.5 sm:p-6 shadow-xs space-y-4 sm:space-y-5"
    >
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#284533]"></span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Log Riwayat Pelaporan Temuan Limbah B3
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar laporan temuan limbah di lingkungan kampus dan pemantauan tindak lanjut evakuasi tim K3L
            {userProfile?.nama_lengkap ? ` • Pelapor: ${userProfile.nama_lengkap}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tiket, senyawa, lokasi..."
              className="w-full bg-[#f8faf8] border border-[#dce8df] rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#284533] transition"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            className="p-2 border border-[#dce8df] rounded-xl hover:bg-[#f4f8f5] text-slate-600 transition cursor-pointer shrink-0"
            title="Segarkan Data Tiket"
          >
            <RefreshCw className={`w-4 h-4 text-[#284533] ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            className="p-2 border border-[#dce8df] rounded-xl hover:bg-[#f4f8f5] text-slate-600 transition cursor-pointer shrink-0"
            title="Filter Lanjutan"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#284533]" />
          </button>
        </div>
      </div>

      {/* Filter Tabs — Dinamis dari Database */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 pt-0.5 border-b border-[#e5ece6] scrollbar-none sm:flex-wrap">
        {[
          { name: "Semua Status", count: tabCounts.all },
          { name: "Menunggu Verifikasi", count: tabCounts.pending },
          { name: "Masuk TPS POLIMDO", count: tabCounts.tps },
          { name: "Diangkut Pihak-3", count: tabCounts.dispatched },
          { name: "Ditolak K3L", count: tabCounts.rejected },
          { name: "Draft Tersimpan", count: tabCounts.draft },
        ].map((tab) => (
          <button
            key={tab.name}
            onClick={() => setSelectedTab(tab.name)}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 ${
              selectedTab === tab.name
                ? "bg-[#284533] text-white shadow-xs"
                : "bg-[#f2f6f3] text-slate-600 hover:bg-[#e4ede7] hover:text-slate-900"
            }`}
          >
            {tab.name} ({tab.count})
          </button>
        ))}
      </div>

      {/* Loading Indicator — hanya tampil saat inisialisasi awal (jika data belum ada) */}
      {loading && dbTickets.length === 0 && (
        <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#284533]" />
          <span>Menyinkronkan data riwayat dari database...</span>
        </div>
      )}

      {/* ===================== MOBILE CARD LIST (< md) ===================== */}
      <div className="md:hidden space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Laporan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Anda belum memiliki laporan limbah B3. Laporan yang Anda buat akan tercatat khusus pada akun Anda.
              </p>
            </div>
            <Link
              href="/user/laporan-baru"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#284533] text-white font-bold text-xs hover:bg-[#1f3627] transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Laporan Baru</span>
            </Link>
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              className="border border-[#e2eae4] rounded-2xl p-3.5 sm:p-4 space-y-3 bg-[#fcfdfc] shadow-2xs"
            >
              {/* Row 1: ID + Status */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {t.isEmergency && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                  )}
                  <span
                    className={`font-mono font-bold text-sm ${
                      t.isEmergency ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {t.id}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${t.statusBadge}`}
                >
                  <t.statusIcon className="w-3 h-3" />
                  <span>{t.status}</span>
                </span>
              </div>

              {/* Row 2: Lokasi Temuan */}
              <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 text-xs">
                <div className="text-[9px] font-bold text-emerald-800 uppercase mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>Lokasi Ditemukan</span>
                </div>
                <div className="font-semibold text-slate-900">{t.lokasi}</div>
                {t.patokan && (
                  <div className="text-[10px] text-slate-500 mt-0.5 italic">
                    Patokan: {t.patokan}
                  </div>
                )}
              </div>

              {/* Row 3: Senyawa + Volume */}
              <div className="text-xs">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                  Jenis Limbah & Volume
                </div>
                <div className="font-bold text-slate-900">{t.senyawa}</div>
                <div className="text-slate-500 mt-0.5">
                  {t.volume} • {t.bentuk} • {t.wadah} • {t.kode}
                </div>
              </div>

              {/* Row 4: Bahaya tags */}
              <div className="flex flex-wrap gap-1.5">
                {t.bahaya.map((b, idx) => (
                  <span
                    key={idx}
                    className={`text-[9px] font-medium px-2 py-0.5 rounded-md border ${b.color}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>

              {/* Row 5: Catatan + Aksi */}
              <div className="flex items-end justify-between gap-2 pt-2 border-t border-[#e5ece6]">
                <div className="text-[11px] text-slate-600 italic leading-tight flex-1 min-w-0 pr-1">
                  {t.catatan}
                </div>
                <button
                  onClick={() => onSelectTicket && onSelectTicket(t.id)}
                  className="bg-[#284533] hover:bg-[#1f3627] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shrink-0 active:scale-95 shadow-xs"
                >
                  Detail
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================== DESKTOP TABLE (>= md) ===================== */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[#e5ece6]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
              <th className="py-3 px-3.5">NO. TIKET</th>
              <th className="py-3 px-3.5">WAKTU & LOKASI TEMUAN</th>
              <th className="py-3 px-3.5">DUGAAN JENIS & KODE</th>
              <th className="py-3 px-3.5">VOLUME & BENTUK</th>
              <th className="py-3 px-3.5">STATUS PENANGANAN K3L</th>
              <th className="py-3 px-3.5">CATATAN TEMUAN</th>
              <th className="py-3 px-3.5 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3ef]">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-700" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Laporan Temuan</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Anda belum memiliki laporan limbah B3 yang diajukan. Laporan yang Anda buat akan tercatat secara eksklusif pada akun Anda.
                    </p>
                    <Link
                      href="/user/laporan-baru"
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#284533] text-white font-bold text-xs hover:bg-[#1f3627] transition shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Buat Laporan Temuan Sekarang</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
              <tr key={t.id} className="hover:bg-[#f9fbf9] transition">
                {/* NO. LAPORAN */}
                <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {t.isEmergency && (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    )}
                    <span className={t.isEmergency ? "text-red-600 font-black" : "text-slate-800"}>
                      {t.id}
                    </span>
                  </div>
                </td>

                {/* TANGGAL & LOKASI */}
                <td className="py-3 px-3.5 max-w-[200px]">
                  <div className="text-slate-800 font-medium whitespace-nowrap">{t.tanggal}</div>
                  <div className="text-[11px] text-emerald-800 flex items-center gap-1 mt-0.5 truncate font-medium" title={t.lokasi}>
                    <MapPin className="w-3 h-3 shrink-0 text-emerald-700" />
                    <span className="truncate">{t.lokasi}</span>
                  </div>
                </td>

                {/* JENIS & KODE */}
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900">{t.senyawa}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.kode}</div>
                </td>

                {/* BENTUK & VOLUME */}
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900">{t.volume}</div>
                  <div className="text-[10px] text-slate-500">
                    {t.bentuk} • {t.wadah}
                  </div>
                </td>

                {/* STATUS */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${t.statusBadge}`}
                  >
                    <t.statusIcon className="w-3 h-3" />
                    <span>{t.status}</span>
                  </span>
                </td>

                {/* CATATAN */}
                <td className="py-3 px-3.5 text-slate-600 max-w-xs">
                  <div className="text-[11px] leading-tight text-slate-700 italic truncate" title={t.catatan}>
                    {t.catatan}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    PIC: {t.verifikator}
                  </div>
                </td>

                {/* AKSI */}
                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => onSelectTicket && onSelectTicket(t.id)}
                    className="bg-[#284533] hover:bg-[#1f3627] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Detail Tiket
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#e5ece6] text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{filteredTickets.length}</span> dari{" "}
          <span className="font-bold text-slate-800">{allTickets.length}</span> laporan temuan limbah di database
        </div>

        <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Tersinkronisasi dengan Database Supabase</span>
        </div>
      </div>
    </section>
  );
}
