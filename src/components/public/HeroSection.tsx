"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  FileCheck2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function HeroSection() {
  const [ticketInput, setTicketInput] = useState("");
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [activeTicket, setActiveTicket] = useState({
    id: "B3-2026-035",
    stage: "Tersimpan di TPS",
    stageColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    desc: "Minyak Pelumas Bekas (Oli Mesin Bubut) (Bengkel Mesin POLIMDO) • Vol: 25 Liter",
    date: "12 Oktober 2026",
    statusNote: "Kemasan baik, telah dilakukan penimbangan presisi dan pelabelan piktogram B3 resmi."
  });

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketInput.trim().toUpperCase();
    if (!query) return;

    try {
      setLoadingTrack(true);
      const res = await fetch(`/api/public/track-ticket?id=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.found && json.data) {
        setActiveTicket(json.data);
      } else {
        setActiveTicket({
          id: query,
          stage: "Tidak Ditemukan",
          stageColor: "bg-slate-100 text-slate-700 border-slate-300",
          desc: json.message || "Nomor tiket tidak terdaftar pada basis data resmi SIM-LB3.",
          date: "-",
          statusNote: "Pastikan format ID benar (contoh: B3-2026-035)"
        });
      }
    } catch (err) {
      console.error("Gagal melacak tiket:", err);
    } finally {
      setLoadingTrack(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-transparent via-[#edf6f1] to-[#ddede4] pb-20">
      {/* =========================================================================
          TOP SCENIC NATURE PANORAMA (Calm Style with Water Reflection & Gradient Fade)
      ========================================================================= */}
      <div className="relative w-full h-[460px] sm:h-[540px] md:h-[600px] lg:h-[680px] overflow-hidden">
        {/* Background Landscape Photo */}
        <Image
          src="/images/poli.jpeg"
          alt="Kelestarian Lingkungan Kampus POLIMDO"
          fill
          sizes="100vw"
          priority
          className="object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Top Vignette Overlay for Crisp Navbar Visibility */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none"></div>

        {/* Seamless Mint-Emerald Gradient Fade at Bottom of the Lake */}
        <div className="absolute inset-x-0 bottom-0 h-48 sm:h-64 bg-gradient-to-t from-[#edf6f1] via-[#edf6f1]/85 to-transparent pointer-events-none"></div>
      </div>

      {/* =========================================================================
          HERO CONTENT SECTION (Positioned right at the transition & centered)
      ========================================================================= */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 sm:-mt-36 md:-mt-44 z-10 text-center">
        {/* Environmental Badge */}
        <div className="group relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50/95 backdrop-blur-sm border border-emerald-200/80 text-[#064e3b] text-xs font-bold shadow-xs mb-5 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-900/10">
          <div className="relative flex items-center justify-center">
            {/* Animated expanding green circle originating from the dot */}
            <span className="badge-expand-circle" aria-hidden="true" />
            {/* Small indicator dot */}
            <span className="relative z-10 w-2 h-2 rounded-full bg-emerald-500 transition-all duration-300 animate-pulse group-hover:animate-none group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          </div>
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            Portal Resmi K3L • Politeknik Negeri Manado
          </span>
        </div>

        {/* Main Centered Headline (Calm-style clean, bold typography) */}
        <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-[#1e293b] sm:text-[#0f172a] tracking-tight leading-[1.12] max-w-4xl mx-auto">
          Pengelolaan & Pelaporan Limbah B3 Terintegrasi Kampus POLIMDO
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          Mewujudkan laboratorium dan bengkel vokasi yang hijau, aman, dan patuh regulasi lingkungan hidup (PP No. 22 Tahun 2021) melalui digitalisasi pelaporan limbah, verifikasi data terpadu K3L, dan pencatatan neraca digital kampus.
        </p>



        {/* 3 Metric Summary Boxes (Clean, serene rounded glass cards) */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-4 sm:p-5 transition shadow-2xs hover:shadow-md">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              SOP REGULASI
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              PP No. 22/2021
            </div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terakreditasi Lingkungan</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-4 sm:p-5 transition shadow-2xs hover:shadow-md">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              TPS PENAMPUNGAN
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              Gedung K3 Terpadu
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Kapasitas Penampungan 20 Drum
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-4 sm:p-5 transition shadow-2xs hover:shadow-md">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              FESTRONIK READY
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              Festronik Ready
            </div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Laporan Aktif KLHK</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            INTEGRATED TICKET TRACKING CARD
        ========================================================================= */}
        <div
          id="lacak-tiket"
          className="mt-10 sm:mt-12 bg-white/90 backdrop-blur-md border border-emerald-200/90 rounded-3xl p-5 sm:p-7 shadow-sm text-left transition hover:shadow-md"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Info (5 Cols) */}
            <div className="lg:col-span-5 flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  Lacak Status Laporan Limbah B3
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Laboran, dosen, atau mahasiswa dapat memantau status verifikasi dan validasi laporan limbah yang telah diajukan secara transparan.
                </p>
              </div>
            </div>

            {/* Right Search & Result Preview (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Search Row */}
              <form onSubmit={handleTrack} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="track-input"
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="Cari ID Tiket (contoh: B3-2026-035 / B3-2026-029)"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingTrack}
                  className="bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold px-6 py-3 rounded-full flex items-center gap-1.5 shadow-sm transition shrink-0 active:scale-95 disabled:opacity-75"
                >
                  {loadingTrack ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{loadingTrack ? "Mencari..." : "Cari Status"}</span>
                </button>
              </form>

              {/* Status Result Snippet */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-4.5 space-y-2.5">
                {/* Header: Icon + Tiket ID + Badge + Tanggal */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileCheck2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                      {activeTicket.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${activeTicket.stageColor}`}
                    >
                      {activeTicket.stage}
                    </span>
                  </div>

                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Lapor: {activeTicket.date}
                  </div>
                </div>

                {/* Deskripsi Bahan & Lokasi */}
                <div className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {activeTicket.desc}
                </div>

                {/* Catatan Status / Verifikasi */}
                {activeTicket.statusNote && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed font-medium text-emerald-950">
                      {activeTicket.statusNote}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
