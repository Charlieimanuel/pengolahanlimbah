"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import TicketInspectionModal from "@/components/admin/TicketInspectionModal";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Check,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface AdminTicketItem {
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
  status: string;
  tanggal_dihasilkan: string;
  created_at: string;
  catatan_verifikasi?: string;
  foto_limbah_url?: string[];
  pelapor?: {
    nama_lengkap: string;
    nip_nim: string | null;
  };
}

type TabFilter = "semua" | "menunggu_verifikasi" | "darurat" | "masuk_tps" | "ditolak";

export default function AdminVerifikasiTiketPage() {
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("menunggu_verifikasi");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // State Dropdown Filter Status
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Outside click listener untuk menutup dropdown filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // State Modal Inspeksi
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTickets = React.useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("b3_tickets")
        .select("*, profiles:pelapor_id(nama_lengkap, nip_nim)")
        .order("is_emergency", { ascending: false })
        .order("created_at", { ascending: false });

      if (data && !error) {
        const mapped: AdminTicketItem[] = data.map((t) => ({
          ...t,
          pelapor: t.profiles as any,
        }));
        setTickets(mapped);
      }
    } catch (err) {
      console.error("Gagal mengambil data tiket verifikasi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(true);

    const interval = setInterval(() => {
      fetchTickets(false);
    }, 8000);

    const handleFocus = () => {
      fetchTickets(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchTickets]);

  // Hitung jumlah untuk tab & filter
  const counts = useMemo(() => {
    return {
      semua: tickets.length,
      menunggu: tickets.filter((t) => t.status === "menunggu_verifikasi").length,
      darurat: tickets.filter((t) => t.is_emergency && t.status === "menunggu_verifikasi").length,
      masuk_tps: tickets.filter((t) => t.status === "masuk_tps" || t.status === "terverifikasi").length,
      ditolak: tickets.filter((t) => t.status === "ditolak").length,
    };
  }, [tickets]);

  // Konfigurasi opsi filter status
  const statusFilterOptions = useMemo(
    () => [
      {
        id: "menunggu_verifikasi" as TabFilter,
        label: "Menunggu Inspeksi",
        count: counts.menunggu,
        dotColor: "bg-amber-500",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      },
      {
        id: "darurat" as TabFilter,
        label: "🚨 Kedaruratan Tinggi",
        count: counts.darurat,
        dotColor: "bg-red-500",
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        isEmergency: true,
      },
      {
        id: "masuk_tps" as TabFilter,
        label: "Masuk TPS POLIMDO",
        count: counts.masuk_tps,
        dotColor: "bg-emerald-600",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      },
      {
        id: "ditolak" as TabFilter,
        label: "Ditolak / Invalid",
        count: counts.ditolak,
        dotColor: "bg-rose-500",
        badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      },
      {
        id: "semua" as TabFilter,
        label: "Semua Riwayat Tiket",
        count: counts.semua,
        dotColor: "bg-slate-400",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      },
    ],
    [counts]
  );

  const activeFilterOption = useMemo(
    () => statusFilterOptions.find((opt) => opt.id === activeTab) || statusFilterOptions[0],
    [statusFilterOptions, activeTab]
  );

  // Unique list lokasi untuk filter
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.lokasi_pengambilan) set.add(t.lokasi_pengambilan.trim());
    });
    return Array.from(set);
  }, [tickets]);

  // Filter list tiket berdasarkan tab, search, dan lokasi
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Tab filter
      if (activeTab === "menunggu_verifikasi" && t.status !== "menunggu_verifikasi") return false;
      if (activeTab === "darurat" && !(t.is_emergency && t.status === "menunggu_verifikasi")) return false;
      if (activeTab === "masuk_tps" && t.status !== "masuk_tps" && t.status !== "terverifikasi") return false;
      if (activeTab === "ditolak" && t.status !== "ditolak") return false;

      // 2. Lokasi filter
      if (selectedLocation !== "all" && t.lokasi_pengambilan !== selectedLocation) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id?.toLowerCase().includes(q);
        const matchLimbah = t.nama_limbah?.toLowerCase().includes(q);
        const matchKode = t.kode_limbah?.toLowerCase().includes(q);
        const matchLokasi = t.lokasi_pengambilan?.toLowerCase().includes(q);
        const matchPelapor = t.pelapor?.nama_lengkap?.toLowerCase().includes(q);
        if (!matchId && !matchLimbah && !matchKode && !matchLokasi && !matchPelapor) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, activeTab, selectedLocation, searchQuery]);

  const openInspection = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  const closeInspection = () => {
    setIsModalOpen(false);
    setSelectedTicketId(null);
  };

  const getStatusBadge = (status: string, isEmergency: boolean) => {
    if (status === "menunggu_verifikasi") {
      if (isEmergency) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>Kedaruratan Tinggi</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Menunggu Verifikasi</span>
        </span>
      );
    }

    if (status === "masuk_tps" || status === "terverifikasi") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Masuk TPS POLIMDO</span>
        </span>
      );
    }

    if (status === "ditolak") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-800 border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Laporan Ditolak</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 text-slate-700 border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modal Verifikasi Inspeksi K3L */}
      <TicketInspectionModal
        ticketId={selectedTicketId}
        isOpen={isModalOpen}
        onClose={closeInspection}
        onSuccess={() => {
          fetchTickets();
        }}
      />

      {/* =========================================================
          HEADER BANNER — Rich Forest Green Botanical Wallpaper
          (Identik dengan Tampilan Dashboard K3L)
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
          <svg
            width="180"
            height="180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L12 22" strokeWidth="1.5" />
            <path
              d="M12 4C14.5 4.5 17 6 18 8.5C18.5 9.7 18.2 11.2 17.5 12.2C16.8 13.2 15.5 13.8 14.5 14.5C13.5 15.2 12.8 16 12 17"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <path
              d="M12 4C9.5 4.5 7 6 6 8.5C5.5 9.7 5.8 11.2 6.5 12.2C7.2 13.2 8.5 13.8 9.5 14.5C10.5 15.2 11.2 16 12 17"
              fill="currentColor"
              fillOpacity="0.3"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/90 tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              K3L POLIMDO WORKBENCH
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Verifikasi & Inspeksi Tiket
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Validasi temuan limbah di area kampus, verifikasi timbangan riil, penetapan kode PP No. 22/2021, dan pembukuan ke TPS.
            </p>
          </div>


        </div>
      </div>

      {/* =========================================================
          METRIC CARDS — 4 Key KPI Blocks (Desain Identik Dashboard)
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Perlu Inspeksi */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              PERLU INSPEKSI
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {counts.menunggu}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tiket baru menunggu survei fisik
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Menunggu Tindakan
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Antrean</span>
          </div>
        </div>

        {/* Metric 2: Kedaruratan Tinggi */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
              KEDARURATAN TINGGI
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-red-700">
              {counts.darurat}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Perlu evakuasi segera ke TPS
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px]">
            <span className="text-red-700 font-semibold">Prioritas Evakuasi 1</span>
            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
              Siaga K3
            </span>
          </div>
        </div>

        {/* Metric 3: Masuk TPS */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              MASUK TPS
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#284533]">
              {counts.masuk_tps}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tersimpan di TPS POLIMDO
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Tercatat resmi</span>
            <span className="text-[#284533] font-bold">Logbook TPS</span>
          </div>
        </div>

        {/* Metric 4: Ditolak / Invalid */}
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              DITOLAK / INVALID
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              {counts.ditolak}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Bukan B3 / laporan batal
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Tidak dibukukan</span>
            <span className="text-rose-700 font-semibold">Arsip Ditolak</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN WORKBENCH CONTAINER — White Card with Clean Design
      ========================================================= */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl shadow-xs">
        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-[#e5ece6] bg-white flex flex-col md:flex-row gap-3 md:items-center justify-between rounded-t-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID tiket, nama bahan limbah, pelapor, atau kode PP 22/2021..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#284533] focus:ring-1 focus:ring-[#284533]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Filter Dropdown Button */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  activeTab === "darurat"
                    ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    : activeTab !== "menunggu_verifikasi"
                    ? "bg-[#eaf4ed] border-[#b8d7c0] text-[#1e3b29] hover:bg-[#deede2]"
                    : "bg-[#f8faf8] border-[#dce8df] text-slate-800 hover:bg-[#edf3ef]"
                }`}
                aria-haspopup="true"
                aria-expanded={isFilterDropdownOpen}
              >
                <SlidersHorizontal
                  className={`w-3.5 h-3.5 ${
                    activeTab === "darurat" ? "text-red-600" : "text-[#284533]"
                  }`}
                />
                <span className="text-slate-500 font-normal">Filter:</span>
                <span className="font-bold">{activeFilterOption.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === "darurat"
                      ? "bg-red-600 text-white"
                      : "bg-[#284533] text-white"
                  }`}
                >
                  {activeFilterOption.count}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isFilterDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu Popup */}
              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#dce8df] p-2 z-40 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#edf3ef] mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Filter Status Tiket
                    </span>
                    {activeTab !== "menunggu_verifikasi" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("menunggu_verifikasi");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="text-[11px] font-semibold text-[#284533] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {statusFilterOptions.map((opt) => {
                      const isSelected = activeTab === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(opt.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? opt.id === "darurat"
                                ? "bg-red-50 text-red-900 font-bold border border-red-200"
                                : "bg-[#eaf4ed] text-[#1e3b29] font-bold border border-[#c0dcc7]"
                              : "hover:bg-[#f8faf8] text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full ${opt.dotColor} ${
                                opt.id === "darurat" && opt.count > 0 ? "animate-pulse" : ""
                              }`}
                            />
                            <span>{opt.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                isSelected
                                  ? opt.id === "darurat"
                                    ? "bg-red-600 text-white"
                                    : "bg-[#284533] text-white"
                                  : opt.badgeColor
                              }`}
                            >
                              {opt.count}
                            </span>
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  opt.id === "darurat" ? "text-red-700" : "text-[#284533]"
                                }`}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Lokasi Filter */}
            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Lokasi Temuan</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono hidden sm:block whitespace-nowrap">
              Total: <span className="font-bold text-slate-900">{filteredTickets.length}</span> Tiket
            </div>
          </div>
        </div>

        {/* Tickets Content: Table on Desktop, Cards on Mobile */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#284533] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat antrean tiket limbah B3...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak ada tiket pada kategori ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Semua laporan telah diproses atau tidak ada laporan yang cocok dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
                    <th className="py-3 px-3.5">ID TIKET</th>
                    <th className="py-3 px-3.5">SPESIFIKASI LIMBAH</th>
                    <th className="py-3 px-3.5">VOLUME / WADAH</th>
                    <th className="py-3 px-3.5">LOKASI TEMUAN KAMPUS</th>
                    <th className="py-3 px-3.5">CIVITAS PELAPOR</th>
                    <th className="py-3 px-3.5">STATUS</th>
                    <th className="py-3 px-3.5 text-right">TINDAKAN K3L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef]">
                  {filteredTickets.map((t) => {
                    const isWaiting = t.status === "menunggu_verifikasi";

                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-[#f9fbf9] transition ${
                          t.is_emergency && isWaiting ? "bg-red-50/40" : ""
                        }`}
                      >
                        {/* ID & Date */}
                        <td className="py-3.5 px-3.5 font-mono">
                          <button
                            onClick={() => openInspection(t.id)}
                            className="font-bold text-[#284533] hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{t.id}</span>
                          </button>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {t.tanggal_dihasilkan
                              ? new Date(t.tanggal_dihasilkan).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </span>
                        </td>

                        {/* Nama Limbah & Kode */}
                        <td className="py-3.5 px-3.5">
                          <div className="font-bold text-slate-900 text-sm">{t.nama_limbah}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#f4f7f5] border border-[#dce8df] text-[#284533] font-bold">
                              Kode: {t.kode_limbah}
                            </span>
                            <span className="capitalize text-[11px] text-slate-500">
                              ({t.fase})
                            </span>
                          </div>
                        </td>

                        {/* Volume & Kemasan */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">
                            {t.volume} {t.satuan}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{t.jenis_kemasan}</div>
                        </td>

                        {/* Lokasi Temuan */}
                        <td className="py-3.5 px-3.5 max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-slate-900 line-clamp-1">{t.lokasi_pengambilan}</p>
                              {t.patokan_lokasi && (
                                <p className="text-[10px] text-slate-500 italic line-clamp-1">
                                  Patokan: {t.patokan_lokasi}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Pelapor */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{t.pelapor?.nama_lengkap || "Anonim"}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {t.pelapor?.nip_nim ? `NIP/NIM: ${t.pelapor.nip_nim}` : "Pengguna Umum"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">{getStatusBadge(t.status, t.is_emergency)}</td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => openInspection(t.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs ${
                              isWaiting
                                ? t.is_emergency
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-[#284533] hover:bg-[#1e3527] text-white"
                                : "bg-[#f4f7f5] hover:bg-[#e8efea] border border-[#dce8df] text-[#284533]"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isWaiting ? "Inspeksi & Proses" : "Detail Log"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-[#edf3ef]">
              {filteredTickets.map((t) => {
                const isWaiting = t.status === "menunggu_verifikasi";
                return (
                  <div key={t.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#284533]">{t.id}</span>
                      {getStatusBadge(t.status, t.is_emergency)}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t.nama_limbah}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        <span className="font-mono bg-[#f4f7f5] px-2 py-0.5 rounded border border-[#dce8df] text-[#284533] font-bold">
                          {t.kode_limbah}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">
                          {t.volume} {t.satuan}
                        </span>
                        <span>•</span>
                        <span>{t.jenis_kemasan}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#f8faf8] border border-[#e5ece6] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="line-clamp-1">{t.lokasi_pengambilan}</span>
                      </div>
                      {t.patokan_lokasi && (
                        <p className="text-[11px] text-slate-500 pl-5">Patokan: {t.patokan_lokasi}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Pelapor</span>
                        <span className="font-bold text-slate-900">{t.pelapor?.nama_lengkap || "Anonim"}</span>
                      </div>

                      <button
                        onClick={() => openInspection(t.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          isWaiting
                            ? t.is_emergency
                              ? "bg-red-600 text-white"
                              : "bg-[#284533] text-white"
                            : "bg-[#f4f7f5] text-[#284533] border border-[#dce8df]"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isWaiting ? "Inspeksi" : "Lihat Detail"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
