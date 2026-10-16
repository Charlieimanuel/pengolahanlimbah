"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Boxes,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Upload,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  QrCode,
  Tag,
  Check,
} from "lucide-react";

interface TpsLogItem {
  id: string;
  ticket_id: string;
  tgl_masuk_tps: string;
  tgl_jatuh_tempo: string;
  posisi_rak_tps: string | null;
  tgl_pengeluaran: string | null;
  nama_transporter: string | null;
  nomor_festronik: string | null;
  dokumen_bast_url: string | null;
  status_neraca: string;
  ticket?: {
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
    status: string;
  };
}

export default function AdminLogbookTpsPage() {
  const [logs, setLogs] = useState<TpsLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRakFilter, setSelectedRakFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"tersimpan" | "dikeluarkan" | "all">("tersimpan");

  // Modal Pengeluaran / Angkut Pihak ke-3
  const [activeDispatchItem, setActiveDispatchItem] = useState<TpsLogItem | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [transporterName, setTransporterName] = useState("PT Wastec International");
  const [nomorFestronik, setNomorFestronik] = useState("");
  const [tglPengeluaran, setTglPengeluaran] = useState(new Date().toISOString().split("T")[0]);
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  // Modal Label Fisik Simpan B3
  const [activeLabelItem, setActiveLabelItem] = useState<TpsLogItem | null>(null);

  const fetchTpsLogs = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("tps_storage_logs")
        .select(`
          id,
          ticket_id,
          tgl_masuk_tps,
          tgl_jatuh_tempo,
          posisi_rak_tps,
          tgl_pengeluaran,
          nama_transporter,
          nomor_festronik,
          dokumen_bast_url,
          status_neraca,
          b3_tickets (
            id,
            nama_limbah,
            kode_limbah,
            volume,
            satuan,
            fase,
            jenis_kemasan,
            karakteristik_bahaya,
            is_emergency,
            lokasi_pengambilan,
            status
          )
        `)
        .order("tgl_masuk_tps", { ascending: false });

      if (data && !error) {
        const mapped: TpsLogItem[] = data.map((item: any) => ({
          ...item,
          ticket: item.b3_tickets,
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.error("Gagal mengambil logbook TPS:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTpsLogs();
  }, []);

  // Hitung metrik kepatuhan
  const metrics = useMemo(() => {
    const activeStored = logs.filter((l) => l.status_neraca === "tersimpan");
    const dispatched = logs.filter((l) => l.status_neraca === "dikeluarkan");

    let totalCair = 0;
    let totalPadat = 0;
    let nearExpiryCount = 0;
    let expiredCount = 0;

    const now = new Date().getTime();

    activeStored.forEach((l) => {
      const vol = Number(l.ticket?.volume) || 0;
      if (l.ticket?.satuan?.toLowerCase().includes("kg")) {
        totalPadat += vol;
      } else {
        totalCair += vol;
      }

      if (l.tgl_jatuh_tempo) {
        const due = new Date(l.tgl_jatuh_tempo).getTime();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 15) {
          nearExpiryCount++;
        }
      }
    });

    return {
      totalStored: activeStored.length,
      dispatchedCount: dispatched.length,
      totalCair: totalCair.toFixed(1),
      totalPadat: totalPadat.toFixed(1),
      nearExpiryCount,
      expiredCount,
    };
  }, [logs]);

  // Unique Raks
  const rackOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.posisi_rak_tps) set.add(l.posisi_rak_tps);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // 1. Status Filter
      if (statusFilter !== "all" && l.status_neraca !== statusFilter) return false;

      // 2. Rak Filter
      if (selectedRakFilter !== "all" && l.posisi_rak_tps !== selectedRakFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTicket = l.ticket_id?.toLowerCase().includes(q);
        const matchNama = l.ticket?.nama_limbah?.toLowerCase().includes(q);
        const matchKode = l.ticket?.kode_limbah?.toLowerCase().includes(q);
        const matchRak = l.posisi_rak_tps?.toLowerCase().includes(q);
        const matchFestronik = l.nomor_festronik?.toLowerCase().includes(q);
        if (!matchTicket && !matchNama && !matchKode && !matchRak && !matchFestronik) {
          return false;
        }
      }

      return true;
    });
  }, [logs, statusFilter, selectedRakFilter, searchQuery]);

  // Handle Submit Pengeluaran / Angkut
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchItem) return;

    try {
      setSubmittingDispatch(true);
      const supabase = createClient();

      // 1. Update tps_storage_logs
      const { error: logError } = await supabase
        .from("tps_storage_logs")
        .update({
          tgl_pengeluaran: new Date(tglPengeluaran).toISOString(),
          nama_transporter: transporterName,
          nomor_festronik: nomorFestronik || `FES-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status_neraca: "dikeluarkan",
        })
        .eq("id", activeDispatchItem.id);

      if (logError) throw logError;

      // 2. Update status tiket menjadi 'diangkut_pihak3'
      const { error: ticketError } = await supabase
        .from("b3_tickets")
        .update({
          status: "diangkut_pihak3",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeDispatchItem.ticket_id);

      if (ticketError) throw ticketError;

      setIsDispatchModalOpen(false);
      setActiveDispatchItem(null);
      fetchTpsLogs();
    } catch (err: any) {
      console.error("Gagal memproses pengeluaran TPS:", err);
      alert(`Gagal menyimpan pengeluaran: ${err?.message || "Kesalahan database"}`);
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Helper Countdown Days
  const getCountdownInfo = (dueDateStr: string, statusNeraca: string) => {
    if (statusNeraca === "dikeluarkan") {
      return {
        label: "Sudah Diangkut",
        days: 0,
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        barColor: "bg-emerald-600",
        percent: 100,
      };
    }

    const now = new Date().getTime();
    const due = new Date(dueDateStr).getTime();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)} Hari!`,
        days: diffDays,
        badgeClass: "bg-red-50 text-red-700 border-red-200 animate-pulse font-bold",
        barColor: "bg-red-600",
        percent: 100,
      };
    }

    if (diffDays <= 15) {
      return {
        label: `Tersisa ${diffDays} Hari`,
        days: diffDays,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
        barColor: "bg-amber-500",
        percent: 85,
      };
    }

    return {
      label: `Aman (${diffDays} Hari)`,
      days: diffDays,
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      barColor: "bg-[#284533]",
      percent: Math.max(10, Math.min(75, 100 - (diffDays / 90) * 100)),
    };
  };

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
              STANDAR PP NO. 22 TAHUN 2021
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Logbook TPS & Kontrol Masa Simpan
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Inventarisasi limbah fisik di Gedung TPS POLIMDO, pengawasan batas 90/180/365 hari, dan pengeluaran ke transporter berizin.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={fetchTpsLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/15 text-xs font-semibold text-white backdrop-blur-xs transition cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-300" : ""}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          METRIC CARDS — 4 Key KPI Blocks
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              LIMBAH AKTIF DI TPS
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#284533]">
              {metrics.totalStored}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Wadah limbah fisik tersimpan</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Status simpan</span>
            <span className="text-[#284533] font-bold">Gedung TPS</span>
          </div>
        </div>

        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              MASA SIMPAN KRITIS
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {metrics.nearExpiryCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">&lt; 15 Hari jatuh tempo angkut</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-amber-800">
            <span>Perlu penjadwalan</span>
            <span className="font-semibold">Transporter</span>
          </div>
        </div>

        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
              LEWAT BATAS TEMPO
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-red-700">
              {metrics.expiredCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Segera evakuasi ke transporter!</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-red-700">
            <span>Melebihi PP 22/2021</span>
            <span className="font-bold">Prioritas</span>
          </div>
        </div>

        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              TOTAL VOLUME SIMPAN
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {metrics.totalCair} L / {metrics.totalPadat} kg
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Akumulasi aktif limbah B3</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Tercatat neraca</span>
            <span className="text-[#284533] font-bold">{metrics.dispatchedCount} Diangkut</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN TABLE CARD — White Card with Clean Design
      ========================================================= */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-[#e5ece6] bg-white flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID tiket, nama limbah di TPS, nomor festronik, atau rak simpan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#284533] focus:ring-1 focus:ring-[#284533]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex rounded-xl bg-[#f8faf8] p-1 border border-[#dce8df] text-xs">
              <button
                onClick={() => setStatusFilter("tersimpan")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === "tersimpan" ? "bg-white text-[#284533] shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tersimpan di TPS
              </button>
              <button
                onClick={() => setStatusFilter("dikeluarkan")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === "dikeluarkan" ? "bg-white text-[#284533] shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sudah Diangkut
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === "all" ? "bg-white text-[#284533] shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
            </div>

            {/* Filter Rak */}
            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={selectedRakFilter}
                onChange={(e) => setSelectedRakFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Posisi Rak</option>
                {rackOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#284533] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat logbook inventaris TPS...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak ada catatan limbah di TPS</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada limbah yang dibukukan ke logbook ini atau filter tidak menemukan hasil.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
                  <th className="py-3 px-3.5">WADAH & ID TIKET</th>
                  <th className="py-3 px-3.5">NAMA LIMBAH & KODE</th>
                  <th className="py-3 px-3.5">VOLUME RIIL</th>
                  <th className="py-3 px-3.5">POSISI RAK TPS</th>
                  <th className="py-3 px-3.5">TGL MASUK TPS</th>
                  <th className="py-3 px-3.5">KONTROL JATUH TEMPO</th>
                  <th className="py-3 px-3.5 text-right">AKSI & FESTRONIK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ef]">
                {filteredLogs.map((log) => {
                  const countdown = getCountdownInfo(log.tgl_jatuh_tempo, log.status_neraca);
                  const isStored = log.status_neraca === "tersimpan";

                  return (
                    <tr key={log.id} className="hover:bg-[#f9fbf9] transition">
                      {/* Ticket ID & Label Button */}
                      <td className="py-3.5 px-3.5 font-mono">
                        <div className="font-bold text-[#284533] flex items-center gap-1.5">
                          <span>{log.ticket_id}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {log.ticket?.jenis_kemasan || "Wadah B3"}
                        </div>
                        <button
                          onClick={() => setActiveLabelItem(log)}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f4f7f5] hover:bg-[#e8efea] text-[#284533] border border-[#dce8df] transition cursor-pointer"
                        >
                          <Tag className="w-3 h-3" />
                          Label B3
                        </button>
                      </td>

                      {/* Spesifikasi Limbah */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 text-sm">{log.ticket?.nama_limbah || "-"}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#f4f7f5] border border-[#dce8df] text-[#284533] font-bold">
                            {log.ticket?.kode_limbah || "-"}
                          </span>
                          <span className="capitalize text-[11px] text-slate-500">
                            ({log.ticket?.fase || "cair"})
                          </span>
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {log.ticket?.volume} {log.ticket?.satuan}
                      </td>

                      {/* Posisi Rak */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f4f7f5] border border-[#dce8df] text-[#284533]">
                          {log.posisi_rak_tps || "Rak Umum TPS"}
                        </span>
                      </td>

                      {/* Tgl Masuk */}
                      <td className="py-3.5 px-3.5 text-slate-700 font-mono whitespace-nowrap">
                        {log.tgl_masuk_tps
                          ? new Date(log.tgl_masuk_tps).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>

                      {/* Countdown Jatuh Tempo */}
                      <td className="py-3.5 px-3.5 min-w-[180px]">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${countdown.badgeClass}`}>
                            {countdown.label}
                          </span>
                          <span className="text-slate-500">
                            {log.tgl_jatuh_tempo
                              ? new Date(log.tgl_jatuh_tempo).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#edf3ef] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${countdown.barColor}`}
                            style={{ width: `${countdown.percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Aksi / Status Festronik */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        {isStored ? (
                          <button
                            onClick={() => {
                              setActiveDispatchItem(log);
                              setIsDispatchModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs inline-flex items-center gap-1.5 ml-auto shadow-xs transition cursor-pointer active:scale-95"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Angkut Pihak-3</span>
                          </button>
                        ) : (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold block">
                              Festronik: {log.nomor_festronik || "FES-KLHK"}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {log.nama_transporter || "Transporter"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL ANGKUT PIHAK KE-3 (PENGELUARAN TPS & FESTRONIK) */}
      {isDispatchModalOpen && activeDispatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-[#e2eae4] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5ece6] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Serah Terima ke Transporter Berizin</h3>
                  <p className="text-xs text-slate-500">
                    Tiket: <span className="font-mono text-[#284533] font-bold">{activeDispatchItem.ticket_id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e5ece6] text-xs text-slate-800 space-y-1">
                <div className="font-bold text-slate-900">{activeDispatchItem.ticket?.nama_limbah}</div>
                <div className="text-slate-500">
                  Volume: {activeDispatchItem.ticket?.volume} {activeDispatchItem.ticket?.satuan} • Posisi:{" "}
                  {activeDispatchItem.posisi_rak_tps}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Transporter Berizin (KLHK)</label>
                <select
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                >
                  <option value="PT Wastec International">PT Wastec International (Izin: 09.32/KLHK/2022)</option>
                  <option value="PT Prasadha Pamunah Limbah Industri (PPLI)">
                    PT Prasadha Pamunah Limbah Industri (PPLI)
                  </option>
                  <option value="PT Harapan Global Mandiri">PT Harapan Global Mandiri</option>
                  <option value="PT Mitra Hijau Asia">PT Mitra Hijau Asia</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Nomor Manifest Festronik (KLHK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomorFestronik}
                  onChange={(e) => setNomorFestronik(e.target.value)}
                  placeholder="Contoh: FES-2026-X992 atau scan barcode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tanggal Pengangkutan</label>
                <input
                  type="date"
                  required
                  value={tglPengeluaran}
                  onChange={(e) => setTglPengeluaran(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm focus:border-[#284533] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e5ece6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  disabled={submittingDispatch}
                  className="px-4 py-2.5 rounded-xl border border-[#dce8df] text-slate-700 text-xs font-semibold hover:bg-[#f8faf8] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDispatch}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submittingDispatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Konfirmasi Pengeluaran TPS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT LABEL B3 STANDAR PP 22/2021 */}
      {activeLabelItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-[#e2eae4] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ece6] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#284533]" />
                <h3 className="text-base font-bold text-slate-900">Label Simpan Fisik Wadah B3</h3>
              </div>
              <button
                onClick={() => setActiveLabelItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simbol Fisik Stiker Label B3 */}
            <div className="p-4 rounded-xl bg-white text-slate-950 font-sans shadow-xs border-2 border-yellow-400 space-y-3">
              <div className="bg-yellow-400 text-slate-950 font-extrabold text-center py-1 rounded text-xs tracking-wider uppercase">
                PERINGATAN! LIMBAH B3
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Nomor Registrasi TPS</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{activeLabelItem.ticket_id}</span>
                </div>
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Nama Limbah B3:</span>
                  <span className="font-bold text-slate-900">{activeLabelItem.ticket?.nama_limbah}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kode Limbah:</span>
                    <span className="font-mono font-bold text-slate-900">{activeLabelItem.ticket?.kode_limbah}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Volume:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeLabelItem.ticket?.volume} {activeLabelItem.ticket?.satuan}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tgl Masuk TPS:</span>
                    <span className="font-mono text-slate-800">
                      {activeLabelItem.tgl_masuk_tps ? new Date(activeLabelItem.tgl_masuk_tps).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-red-600 font-bold block">Batas Simpan:</span>
                    <span className="font-mono font-bold text-red-700">
                      {activeLabelItem.tgl_jatuh_tempo ? new Date(activeLabelItem.tgl_jatuh_tempo).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block">Posisi Rak Penyimpanan:</span>
                  <span className="font-semibold text-emerald-800">{activeLabelItem.posisi_rak_tps || "Rak TPS"}</span>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 text-center border-t pt-1 font-mono">
                POLITEKNIK NEGERI MANADO • TIM K3L & TPS B3
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#284533] hover:bg-[#1e3527] text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Cetak Stiker Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
