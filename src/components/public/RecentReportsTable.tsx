"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, CheckCircle2, Loader2 } from "lucide-react";

interface ReportRow {
  kode: string;
  bahan: string;
  karakteristik: string;
  tipeBadge: string;
  unit: string;
  volume: string;
  tglMasuk: string;
  sisaWaktu: string;
  status: string;
  statusBadge: string;
}

interface StatsMetrics {
  totalTerinventarisasi: { value: string; unit: string; subtext: string };
  kepatuhanUnit: { value: string; subtext: string };
  kapasitasTps: { value: string; subtext: string };
  totalUnits: { value: string; subtext: string };
}

export default function RecentReportsTable() {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<StatsMetrics>({
    totalTerinventarisasi: {
      value: "61,5",
      unit: "Liter",
      subtext: "100% Terkelola PP 22/2021 • Fase Cair",
    },
    kepatuhanUnit: {
      value: "66,7%",
      subtext: "Laboran & Dosen Terdaftar Aktif",
    },
    kapasitasTps: {
      value: "5%",
      subtext: "1 Drum Terisi (Batas Maks. 20 Drum)",
    },
    totalUnits: {
      value: "21",
      subtext: "Unit Pelapor Aktif se-POLIMDO",
    },
  });

  const [reportsData, setReportsData] = useState<ReportRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/public/stats");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          if (json.data.metrics) {
            setMetrics(json.data.metrics);
          }
          if (Array.isArray(json.data.logs) && json.data.logs.length > 0) {
            setReportsData(json.data.logs);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data neraca publik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = (format: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      if (format === "csv") {
        const headers = [
          "KODE TIKET",
          "NAMA BAHAN",
          "KARAKTERISTIK",
          "ASAL UNIT/LAB",
          "VOLUME",
          "TGL MASUK TPS",
          "SISA WAKTU",
          "STATUS TPS",
        ];
        const rows = reportsData.map((r) => [
          `"${r.kode}"`,
          `"${r.bahan.replace(/"/g, '""')}"`,
          `"${r.karakteristik.replace(/"/g, '""')}"`,
          `"${r.unit.replace(/"/g, '""')}"`,
          `"${r.volume}"`,
          `"${r.tglMasuk}"`,
          `"${r.sisaWaktu}"`,
          `"${r.status}"`,
        ]);
        const csvContent =
          "data:text/csv;charset=utf-8,\uFEFF" +
          [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `Neraca_Limbah_B3_POLIMDO_${new Date().getFullYear()}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const link = document.createElement("a");
        link.href = "/sop-limbah-b3.pdf";
        link.download = `Neraca_Limbah_B3_POLIMDO_${new Date().getFullYear()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 400);
  };

  const currentYear = new Date().getFullYear();

  return (
    <section
      id="statistik"
      className="py-20 sm:py-24 relative overflow-hidden border-t border-slate-200/70"
      style={{ backgroundColor: "#f0f5f2" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#064e3b] uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>TRANSPARANSI KAMPUS & PENGELOLAAN</span>
            </div>
            {/* Gradient text heading (FMI style) */}
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Statistik Neraca Limbah B3 POLIMDO
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Pencatatan real-time neraca massa limbah bahan berbahaya & beracun terintegrasi database K3 Kampus.
            </p>
          </div>

          <button
            onClick={() => handleDownload("csv")}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold px-5 py-3 rounded-full shadow-sm transition shrink-0 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-200" />
            )}
            <span>
              {downloading ? "Mengunduh..." : `Unduh Ringkasan Terkini ${currentYear}`}
            </span>
          </button>
        </div>

        {/* Open Stats Row (Calm Editorial Minimalist Numbers without Box Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-6 border-y border-slate-200/70">
          {/* Stat 1 */}
          <div>
            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {metrics.totalTerinventarisasi.value}{" "}
              <span className="text-sm sm:text-base font-bold text-slate-500">
                {metrics.totalTerinventarisasi.unit}
              </span>
            </div>
            <div className="text-xs font-bold text-[#064e3b] uppercase tracking-wider mt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Total Terinventarisasi</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.totalTerinventarisasi.subtext}
            </p>
          </div>

          {/* Stat 2 */}
          <div>
            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {metrics.kepatuhanUnit.value}
            </div>
            <div className="text-xs font-bold text-[#064e3b] uppercase tracking-wider mt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Kepatuhan Form Unit</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.kepatuhanUnit.subtext}
            </p>
          </div>

          {/* Stat 3 */}
          <div>
            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {metrics.kapasitasTps.value}
            </div>
            <div className="text-xs font-bold text-[#064e3b] uppercase tracking-wider mt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Kapasitas TPS Terpakai</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.kapasitasTps.subtext}
            </p>
          </div>

          {/* Stat 4 */}
          <div>
            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {metrics.totalUnits.value}
            </div>
            <div className="text-xs font-bold text-[#064e3b] uppercase tracking-wider mt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Lab & Bengkel Terdaftar</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.totalUnits.subtext}
            </p>
          </div>
        </div>

        {/* Open Minimalist Table without Box Container */}
        <div className="space-y-4">
          {/* Table Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Inventaris Log Limbah TPS B3 Aktif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan inspeksi dan inventarisasi berkala di Tempat Penampungan Sementara (TPS) Kampus.
              </p>
            </div>

            <button
              onClick={() => handleDownload("pdf")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#064e3b] transition shrink-0 underline underline-offset-4 decoration-slate-300 hover:decoration-[#064e3b]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Neraca Resmi (PDF)</span>
            </button>
          </div>

          {/* Open Table */}
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">KODE & BAHAN</th>
                  <th className="py-3 px-3">KARAKTERISTIK</th>
                  <th className="py-3 px-3">ASAL UNIT / LAB</th>
                  <th className="py-3 px-3">VOLUME</th>
                  <th className="py-3 px-3">TGL MASUK</th>
                  <th className="py-3 px-3">SISA WAKTU</th>
                  <th className="py-3 px-3 text-center">STATUS TPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {loading ? "Memuat logbook TPS..." : "Belum ada limbah di TPS"}
                    </td>
                  </tr>
                ) : (
                  reportsData.map((row) => (
                    <tr key={row.kode} className="hover:bg-emerald-50/30 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-700 text-[11px]">
                          {row.kode}
                        </div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {row.bahan}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${row.tipeBadge}`}
                        >
                          {row.karakteristik}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium">
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {row.volume}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {row.tglMasuk}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {row.sisaWaktu}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.statusBadge}`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{row.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
