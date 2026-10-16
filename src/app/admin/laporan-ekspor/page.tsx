"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileDown,
  Printer,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Download,
  FileText,
  Clock,
  Truck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type ReportType = "neraca" | "logbook" | "festronik" | "darurat";

export default function AdminLaporanEksporPage() {
  const [selectedType, setSelectedType] = useState<ReportType>("neraca");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedQuarter, setSelectedQuarter] = useState("Triwulan I (Januari - Maret)");
  const [loading, setLoading] = useState(false);

  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: tData } = await supabase
        .from("b3_tickets")
        .select("*, profiles:pelapor_id(nama_lengkap, nip_nim, jurusan)")
        .order("created_at", { ascending: false });

      const { data: lData } = await supabase
        .from("tps_storage_logs")
        .select("*, b3_tickets(*)")
        .order("tgl_masuk_tps", { ascending: false });

      if (tData) setTickets(tData);
      if (lData) setLogs(lData);
    } catch (err) {
      console.error("Gagal load data ekspor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let csvContent = "";
    const filename = `Laporan_${selectedType.toUpperCase()}_POLIMDO_${selectedYear}.csv`;

    if (selectedType === "neraca") {
      const headers = ["No", "Kode Limbah", "Nama Limbah", "Sumber Temuan", "Volume (Masuk)", "Satuan", "Status TPS"];
      const rows = tickets.map((t, idx) => [
        idx + 1,
        `"${t.kode_limbah}"`,
        `"${t.nama_limbah}"`,
        `"${t.lokasi_pengambilan}"`,
        t.volume,
        `"${t.satuan}"`,
        `"${t.status}"`,
      ]);
      csvContent = ["LAPORAN NERACA LIMBAH B3 POLIMDO - " + selectedYear, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (selectedType === "logbook") {
      const headers = ["No Tiket", "Nama Limbah", "Volume", "Posisi Rak", "Tgl Masuk", "Batas Tempo", "Status"];
      const rows = logs.map((l) => [
        `"${l.ticket_id}"`,
        `"${l.b3_tickets?.nama_limbah || "-"}"`,
        `"${l.b3_tickets?.volume || "-"} ${l.b3_tickets?.satuan || ""}"`,
        `"${l.posisi_rak_tps || "-"}"`,
        `"${l.tgl_masuk_tps ? new Date(l.tgl_masuk_tps).toLocaleDateString("id-ID") : "-"}"`,
        `"${l.tgl_jatuh_tempo ? new Date(l.tgl_jatuh_tempo).toLocaleDateString("id-ID") : "-"}"`,
        `"${l.status_neraca}"`,
      ]);
      csvContent = ["LOGBOOK TPS 90/180/365 HARI POLIMDO - " + selectedYear, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (selectedType === "festronik") {
      const headers = ["No Tiket", "No Festronik", "Nama Transporter", "Tgl Pengangkutan", "Volume"];
      const rows = logs
        .filter((l) => l.status_neraca === "dikeluarkan")
        .map((l) => [
          `"${l.ticket_id}"`,
          `"${l.nomor_festronik || "-"}"`,
          `"${l.nama_transporter || "-"}"`,
          `"${l.tgl_pengeluaran ? new Date(l.tgl_pengeluaran).toLocaleDateString("id-ID") : "-"}"`,
          `"${l.b3_tickets?.volume || "-"} ${l.b3_tickets?.satuan || ""}"`,
        ]);
      csvContent = ["MANIFEST FESTRONIK & BAST PENGANGKUTAN PIHAK-3 - " + selectedYear, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      const headers = ["No Tiket", "Nama Limbah", "Lokasi Insiden", "Karakteristik Bahaya", "Tgl Laporan", "Status"];
      const rows = tickets
        .filter((t) => t.is_emergency)
        .map((t) => [
          `"${t.id}"`,
          `"${t.nama_limbah}"`,
          `"${t.lokasi_pengambilan}"`,
          `"${(t.karakteristik_bahaya || []).join("; ")}"`,
          `"${t.tanggal_dihasilkan}"`,
          `"${t.status}"`,
        ]);
      csvContent = ["LAPORAN INSIDEN KEDARURATAN & TUMPAHAN B3 POLIMDO - " + selectedYear, headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER BANNER — Rich Forest Green Botanical Wallpaper
      ========================================================= */}
      <div className="print:hidden relative overflow-hidden rounded-2xl bg-[#284533] text-white p-4 sm:p-7 shadow-sm border border-[#1e3426]">
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
              PUSAT PELAPORAN RESMI & STATUTOR
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Ekspor & Laporan Resmi KLHK
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Pusat pembuatan dokumen resmi Neraca Limbah B3, Logbook TPS, dan Manifest Festronik standar PP No. 22 Tahun 2021.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/15 text-xs font-semibold text-white backdrop-blur-xs transition cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-[#064e3b] shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Format CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          SELECTOR TIPE LAPORAN (Hidden on Print)
      ========================================================= */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: "neraca",
            title: "Neraca Limbah B3",
            desc: "Format resmi PP 22/2021 (Saldo Awal + Masuk - Keluar = Sisa)",
            icon: FileSpreadsheet,
          },
          {
            id: "logbook",
            title: "Logbook TPS 90/180/365 Hari",
            desc: "Rekapitulasi masa simpan fisik & posisi rak",
            icon: Clock,
          },
          {
            id: "festronik",
            title: "Manifest Festronik & BAST",
            desc: "Serah terima limbah ke transporter berizin",
            icon: Truck,
          },
          {
            id: "darurat",
            title: "Insiden Kedaruratan B3",
            desc: "Laporan penanganan tumpahan & kebocoran kampus",
            icon: AlertTriangle,
          },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = selectedType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id as ReportType)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? "bg-white border-[#284533] text-slate-900 shadow-sm"
                  : "bg-[#fbfcfb] border-[#e2eae4] text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                  isActive ? "bg-[#284533] text-white" : "bg-[#f4f7f5] text-[#284533]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          FILTER WAKTU & PERIODE (Hidden on Print)
      ========================================================= */}
      <div className="print:hidden p-4 rounded-2xl bg-white border border-[#e2eae4] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#284533]" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-mono font-bold"
            >
              <option value="2026">Tahun Pelaporan 2026</option>
              <option value="2025">Tahun Pelaporan 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#284533]" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="Triwulan I (Januari - Maret)">Triwulan I (Januari - Maret)</option>
              <option value="Triwulan II (April - Juni)">Triwulan II (April - Juni)</option>
              <option value="Triwulan III (Juli - September)">Triwulan III (Juli - September)</option>
              <option value="Triwulan IV (Oktober - Desember)">Triwulan IV (Oktober - Desember)</option>
              <option value="Laporan Tahunan Penuh">Laporan Tahunan Penuh</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Status Data: <span className="font-semibold text-emerald-700">Tersinkronisasi Real-time</span>
        </div>
      </div>

      {/* =========================================================
          DOKUMEN RESMI STATUTOR (PRINT PREVIEW KOP SURAT POLIMDO)
      ========================================================= */}
      <div className="p-6 sm:p-10 rounded-2xl bg-white text-slate-950 font-serif shadow-sm border border-[#e2eae4] print:shadow-none print:border-none print:p-0 print:m-0">
        {/* KOP SURAT RESMI POLIMDO */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <p className="text-xs font-sans uppercase tracking-widest text-slate-600 font-semibold">
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
          </p>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-950">
            POLITEKNIK NEGERI MANADO
          </h2>
          <p className="text-xs font-sans font-bold text-emerald-800 uppercase tracking-wide">
            UNIT KESELAMATAN, KESEHATAN KERJA & LINGKUNGAN (K3L) & TPS B3
          </p>
          <p className="text-[10px] font-sans text-slate-500">
            Jl. Raya Politeknik, Buha, Mapanget, Kota Manado, Sulawesi Utara 95252 • Laman: polimdo.ac.id
          </p>
        </div>

        {/* JUDUL LAPORAN */}
        <div className="text-center my-6 space-y-1 font-sans">
          <h3 className="text-sm sm:text-base font-extrabold uppercase text-slate-900 underline">
            {selectedType === "neraca" && "LAPORAN NERACA LIMBAH BAHAN BERBAHAYA DAN BERACUN (B3)"}
            {selectedType === "logbook" && "LOGBOOK PENYIMPANAN LIMBAH B3 DI TPS POLIMDO"}
            {selectedType === "festronik" && "REKAPITULASI PENGANGKUTAN LIMBAH B3 & MANIFEST FESTRONIK"}
            {selectedType === "darurat" && "LAPORAN PENANGGULANGAN TUMPAHAN & KEDARURATAN B3 KAMPUS"}
          </h3>
          <p className="text-xs text-slate-600">
            Periode: <span className="font-semibold">{selectedQuarter}</span> • Tahun Anggaran {selectedYear}
          </p>
          <p className="text-[10px] text-slate-500">
            Sesuai Ketentuan Lampiran Peraturan Pemerintah Republik Indonesia No. 22 Tahun 2021
          </p>
        </div>

        {/* TABEL DATA PRINT PREVIEW */}
        <div className="my-6 overflow-x-auto font-sans">
          {selectedType === "neraca" && (
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border border-slate-400 text-center">No</th>
                  <th className="p-2 border border-slate-400">Kode Limbah</th>
                  <th className="p-2 border border-slate-400">Nama Jenis Limbah</th>
                  <th className="p-2 border border-slate-400">Lokasi / Sumber Temuan</th>
                  <th className="p-2 border border-slate-400 text-right">Volume</th>
                  <th className="p-2 border border-slate-400 text-center">Status TPS</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 15).map((t, i) => (
                  <tr key={t.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{i + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-bold">{t.kode_limbah}</td>
                    <td className="p-2 border border-slate-300 font-semibold">{t.nama_limbah}</td>
                    <td className="p-2 border border-slate-300 text-slate-700">{t.lokasi_pengambilan}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {t.volume} {t.satuan}
                    </td>
                    <td className="p-2 border border-slate-300 text-center capitalize">{t.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedType === "logbook" && (
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border border-slate-400">No. Tiket</th>
                  <th className="p-2 border border-slate-400">Nama Limbah</th>
                  <th className="p-2 border border-slate-400">Posisi Rak</th>
                  <th className="p-2 border border-slate-400 text-center">Tgl Masuk</th>
                  <th className="p-2 border border-slate-400 text-center">Jatuh Tempo</th>
                  <th className="p-2 border border-slate-400 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 15).map((l) => (
                  <tr key={l.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 font-mono font-bold">{l.ticket_id}</td>
                    <td className="p-2 border border-slate-300">{l.b3_tickets?.nama_limbah || "-"}</td>
                    <td className="p-2 border border-slate-300">{l.posisi_rak_tps || "-"}</td>
                    <td className="p-2 border border-slate-300 text-center">
                      {l.tgl_masuk_tps ? new Date(l.tgl_masuk_tps).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-red-700">
                      {l.tgl_jatuh_tempo ? new Date(l.tgl_jatuh_tempo).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {l.b3_tickets?.volume} {l.b3_tickets?.satuan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedType === "festronik" && (
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border border-slate-400">No Tiket</th>
                  <th className="p-2 border border-slate-400">No. Festronik KLHK</th>
                  <th className="p-2 border border-slate-400">Transporter Berizin</th>
                  <th className="p-2 border border-slate-400 text-center">Tgl Angkut</th>
                  <th className="p-2 border border-slate-400 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter((l) => l.status_neraca === "dikeluarkan").length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                      Belum ada limbah yang diserahkan ke transporter pada periode ini.
                    </td>
                  </tr>
                ) : (
                  logs
                    .filter((l) => l.status_neraca === "dikeluarkan")
                    .map((l) => (
                      <tr key={l.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 font-mono">{l.ticket_id}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold">{l.nomor_festronik || "-"}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{l.nama_transporter || "-"}</td>
                        <td className="p-2 border border-slate-300 text-center">
                          {l.tgl_pengeluaran ? new Date(l.tgl_pengeluaran).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono">
                          {l.b3_tickets?.volume} {l.b3_tickets?.satuan}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {selectedType === "darurat" && (
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border border-slate-400">ID Tiket</th>
                  <th className="p-2 border border-slate-400">Limbah Kedaruratan</th>
                  <th className="p-2 border border-slate-400">Lokasi Tumpahan / Temuan</th>
                  <th className="p-2 border border-slate-400">Tindakan Evakuasi K3L</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.filter((t) => t.is_emergency).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                      Nihil insiden kedaruratan B3 pada periode ini (Kampus Aman).
                    </td>
                  </tr>
                ) : (
                  tickets
                    .filter((t) => t.is_emergency)
                    .map((t) => (
                      <tr key={t.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 font-mono font-bold text-red-700">{t.id}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{t.nama_limbah}</td>
                        <td className="p-2 border border-slate-300">{t.lokasi_pengambilan}</td>
                        <td className="p-2 border border-slate-300 text-slate-700">
                          {t.catatan_verifikasi || "Telah dievakuasi tim K3L ke TPS B3"}
                        </td>
                        <td className="p-2 border border-slate-300 text-center capitalize">{t.status.replace("_", " ")}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* TANDA TANGAN PEJABAT BERWENANG */}
        <div className="pt-10 flex justify-between font-sans text-xs">
          <div className="text-center space-y-16">
            <p>Mengetahui,</p>
            <div>
              <p className="font-bold underline">Dr. Ir. Mareyke Alelo, MBA</p>
              <p className="text-[11px] text-slate-600">Direktur Politeknik Negeri Manado</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP. 196805121993032001</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <p>Manado, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <div>
              <p className="font-bold underline">Koordinator Tim K3L & TPS B3</p>
              <p className="text-[11px] text-slate-600">Politeknik Negeri Manado</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP. 198207192008121002</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
