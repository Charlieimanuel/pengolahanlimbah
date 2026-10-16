"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Scale,
  RefreshCw,
  Search,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Boxes,
} from "lucide-react";

interface NeracaRow {
  kode_limbah: string;
  nama_limbah: string;
  kategori_bahaya: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  sisa_akhir: number;
  satuan: string;
  status_kepatuhan: string;
}

export default function AdminNeracaLimbahPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedPeriode, setSelectedPeriode] = useState("Triwulan I (Jan - Mar)");
  const [searchQuery, setSearchQuery] = useState("");
  const [neracaData, setNeracaData] = useState<NeracaRow[]>([]);

  const fetchNeraca = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Ambil seluruh tiket dan logbook TPS
      const { data: tickets, error: ticketError } = await supabase
        .from("b3_tickets")
        .select("id, kode_limbah, nama_limbah, volume, satuan, status, created_at");

      const { data: logs, error: logError } = await supabase
        .from("tps_storage_logs")
        .select("id, ticket_id, tgl_masuk_tps, tgl_pengeluaran, status_neraca");

      if (!ticketError && tickets) {
        // Kelompokkan berdasarkan kode_limbah
        const groups: { [kode: string]: NeracaRow } = {};

        tickets.forEach((t) => {
          const kode = t.kode_limbah || "B105d";
          if (!groups[kode]) {
            groups[kode] = {
              kode_limbah: kode,
              nama_limbah: t.nama_limbah || "Limbah Terklasifikasi",
              kategori_bahaya: kode.startsWith("A") ? "Kategori 1 (Bahaya Akut)" : "Kategori 2 (Spesifik/Umum)",
              saldo_awal: 0,
              masuk: 0,
              keluar: 0,
              sisa_akhir: 0,
              satuan: t.satuan || "Liter",
              status_kepatuhan: "Taat Standar",
            };
          }

          const vol = Number(t.volume) || 0;
          if (t.status === "masuk_tps" || t.status === "terverifikasi") {
            groups[kode].masuk += vol;
            groups[kode].sisa_akhir += vol;
          } else if (t.status === "diangkut_pihak3" || t.status === "selesai") {
            groups[kode].masuk += vol;
            groups[kode].keluar += vol;
          }
        });

        // Pastikan kalkulasi matematis Neraca: Sisa Akhir = Saldo Awal + Masuk - Keluar
        const rows = Object.values(groups).map((row) => ({
          ...row,
          masuk: Number(row.masuk.toFixed(2)),
          keluar: Number(row.keluar.toFixed(2)),
          sisa_akhir: Number(Math.max(0, row.saldo_awal + row.masuk - row.keluar).toFixed(2)),
        }));

        setNeracaData(rows);
      }
    } catch (err) {
      console.error("Gagal mengambil data neraca:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeraca();
  }, [selectedYear]);

  // Ringkasan Total
  const totals = useMemo(() => {
    let masukTotal = 0;
    let keluarTotal = 0;
    let sisaTotal = 0;

    neracaData.forEach((row) => {
      masukTotal += row.masuk;
      keluarTotal += row.keluar;
      sisaTotal += row.sisa_akhir;
    });

    return {
      masuk: masukTotal.toFixed(2),
      keluar: keluarTotal.toFixed(2),
      sisa: sisaTotal.toFixed(2),
    };
  }, [neracaData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return neracaData;
    const q = searchQuery.toLowerCase();
    return neracaData.filter(
      (r) => r.kode_limbah.toLowerCase().includes(q) || r.nama_limbah.toLowerCase().includes(q)
    );
  }, [neracaData, searchQuery]);

  // Export CSV
  const exportToCSV = () => {
    if (neracaData.length === 0) return;
    const headers = [
      "Kode Limbah",
      "Nama Limbah",
      "Kategori Bahaya",
      "Saldo Awal",
      "Limbah Masuk",
      "Limbah Keluar",
      "Sisa Akhir di TPS",
      "Satuan",
      "Kepatuhan",
    ];

    const csvRows = [
      `NERACA LIMBAH B3 POLIMDO - PERIODE ${selectedPeriode} TAHUN ${selectedYear}`,
      headers.join(","),
      ...filteredRows.map((r) =>
        [
          `"${r.kode_limbah}"`,
          `"${r.nama_limbah}"`,
          `"${r.kategori_bahaya}"`,
          r.saldo_awal,
          r.masuk,
          r.keluar,
          r.sisa_akhir,
          `"${r.satuan}"`,
          `"${r.status_kepatuhan}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Neraca_Limbah_B3_POLIMDO_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              PELAPORAN STATUTOR PP NO. 22 TAHUN 2021
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Neraca Limbah B3 Kampus
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Buku besar digital pergerakan limbah B3 POLIMDO (Saldo Awal + Masuk - Keluar = Sisa Akhir) untuk inspeksi berkala KLHK.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">

            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-[#064e3b] shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          RINGKASAN NERACA MATRIKS — 3 Key Metric Blocks
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              LIMBAH MASUK KE TPS (+)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#284533]">
              {totals.masuk}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Liter / Kg diterima dari temuan</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Debit masuk</span>
            <span className="text-[#284533] font-bold">Terverifikasi</span>
          </div>
        </div>

        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              LIMBAH KELUAR / ANGKUT (-)
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-teal-700">
              {totals.keluar}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Liter / Kg diserahkan ke transporter</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-teal-800">
            <span>Kredit keluar</span>
            <span className="font-semibold">Festronik</span>
          </div>
        </div>

        <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              SISA SALDO AKTIF (=)
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totals.sisa}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Liter / Kg tersimpan fisik di TPS</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
            <span>Saldo akhir</span>
            <span className="text-[#284533] font-bold">Stok TPS</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN TABLE NERACA — White Card with Clean Design
      ========================================================= */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[#e5ece6] bg-white flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-mono font-bold"
              >
                <option value="2026">Tahun Buku 2026</option>
                <option value="2025">Tahun Buku 2025</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="Triwulan I (Jan - Mar)">Triwulan I (Jan - Mar)</option>
                <option value="Triwulan II (Apr - Jun)">Triwulan II (Apr - Jun)</option>
                <option value="Triwulan III (Jul - Sep)">Triwulan III (Jul - Sep)</option>
                <option value="Triwulan IV (Okt - Des)">Triwulan IV (Okt - Des)</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau jenis limbah..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#284533] focus:ring-1 focus:ring-[#284533]"
            />
          </div>
        </div>

        {/* Neraca Data Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#284533] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Merekapitulasi buku besar neraca B3...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Belum Ada Catatan Neraca</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Limbah yang diterima ke TPS akan otomatis diakumulasikan dan dihitung ke dalam neraca ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
                  <th className="py-3 px-3.5">KODE PP 22/2021</th>
                  <th className="py-3 px-3.5">NAMA JENIS LIMBAH</th>
                  <th className="py-3 px-3.5">KLASIFIKASI BAHAYA</th>
                  <th className="py-3 px-3.5 text-right">SALDO AWAL</th>
                  <th className="py-3 px-3.5 text-right text-emerald-800">MASUK (+)</th>
                  <th className="py-3 px-3.5 text-right text-teal-800">KELUAR (-)</th>
                  <th className="py-3 px-3.5 text-right text-slate-900">SISA AKHIR (=)</th>
                  <th className="py-3 px-3.5 text-center">KEPATUHAN SIMPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ef]">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f9fbf9] transition">
                    <td className="py-3.5 px-3.5 font-mono font-bold text-[#284533]">{row.kode_limbah}</td>
                    <td className="py-3.5 px-3.5 font-bold text-slate-900">{row.nama_limbah}</td>
                    <td className="py-3.5 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f4f7f5] border border-[#dce8df] text-[#284533]">
                        {row.kategori_bahaya}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-right text-slate-500">{row.saldo_awal}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-right text-emerald-700">
                      +{row.masuk} {row.satuan}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-right text-teal-700">
                      -{row.keluar} {row.satuan}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-black text-right text-slate-900 text-sm">
                      {row.sisa_akhir} {row.satuan}
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{row.status_kepatuhan}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
