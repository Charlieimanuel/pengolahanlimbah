"use client";

import React from "react";
import Link from "next/link";
import {
  Check,
  LogIn,
  FileText,
  PhoneCall,
  ShieldAlert
} from "lucide-react";

export default function CtaSection() {
  const [ssoHoverPos, setSsoHoverPos] = React.useState({ x: 0, y: 0 });
  const [isSsoHovered, setIsSsoHovered] = React.useState(false);

  const handleSsoMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSsoHoverPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsSsoHovered(true);
  };

  const handleSsoMouseLeave = () => {
    setIsSsoHovered(false);
  };

  const [guideHoverPos, setGuideHoverPos] = React.useState({ x: 0, y: 0 });
  const [isGuideHovered, setIsGuideHovered] = React.useState(false);

  const handleGuideMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGuideHoverPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsGuideHovered(true);
  };

  const handleGuideMouseLeave = () => {
    setIsGuideHovered(false);
  };

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden bg-white border-t border-slate-200/70">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12 relative z-10">
        {/* Main Calm Green CTA Canvas */}
        <div className="relative text-white rounded-3xl p-8 sm:p-14 lg:p-16 overflow-hidden bg-[#064e3b] shadow-lg">
          {/* Subtle Ambient blur glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center z-10">
            {/* Left Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Akses Terbuka Sivitas Akademika</span>
              </div>

              {/* White heading on deep green banner */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Akses Portal Terintegrasi SIM-LB3 POLIMDO
              </h2>

              <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
                Gunakan akun SSO Politeknik Negeri Manado untuk mengakses formulir pelaporan limbah praktikum/bengkel, memantau verifikasi tim K3L, serta pencatatan resmi ke neraca limbah digital kampus.
              </p>

              {/* Checklist */}
              <div className="pt-2 flex flex-wrap items-center gap-5 text-xs sm:text-sm font-semibold text-emerald-100">
                {[
                  "Laboran & Dosen",
                  "Kepala Lab",
                  "Tim Pengurus K3",
                  "Mahasiswa & Peneliti"
                ].map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              <Link
                href="/login"
                onMouseEnter={handleSsoMouseEnter}
                onMouseLeave={handleSsoMouseLeave}
                className="group relative overflow-hidden bg-white text-slate-900 font-bold text-xs sm:text-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 border border-transparent hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-950/20 w-full"
              >
                {/* Mouse-origin expanding green ripple */}
                <span
                  className="pointer-events-none absolute rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700"
                  style={{
                    left: `${ssoHoverPos.x}px`,
                    top: `${ssoHoverPos.y}px`,
                    width: "24px",
                    height: "24px",
                    transform: `translate(-50%, -50%) scale(${isSsoHovered ? 45 : 0})`,
                    transition: isSsoHovered
                      ? "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
                      : "transform 0.4s ease-out, opacity 0.3s ease-out",
                    opacity: isSsoHovered ? 1 : 0,
                  }}
                  aria-hidden="true"
                />

                <LogIn className="w-4 h-4 text-[#064e3b] group-hover:text-white transition-colors duration-300 relative z-10" />
                <span className="text-slate-900 group-hover:text-white transition-colors duration-300 relative z-10">
                  Masuk via Akun SSO POLIMDO
                </span>
              </Link>

              <Link
                href="#informasi"
                onMouseEnter={handleGuideMouseEnter}
                onMouseLeave={handleGuideMouseLeave}
                className="group relative overflow-hidden bg-white/10 border border-white/30 text-white font-semibold text-xs sm:text-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 hover:border-white shadow-sm hover:shadow-lg hover:shadow-black/20 w-full"
              >
                {/* Mouse-origin expanding white ripple */}
                <span
                  className="pointer-events-none absolute rounded-full bg-white"
                  style={{
                    left: `${guideHoverPos.x}px`,
                    top: `${guideHoverPos.y}px`,
                    width: "24px",
                    height: "24px",
                    transform: `translate(-50%, -50%) scale(${isGuideHovered ? 45 : 0})`,
                    transition: isGuideHovered
                      ? "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
                      : "transform 0.4s ease-out, opacity 0.3s ease-out",
                    opacity: isGuideHovered ? 1 : 0,
                  }}
                  aria-hidden="true"
                />

                <FileText className="w-4 h-4 text-emerald-300 group-hover:text-[#064e3b] transition-colors duration-300 relative z-10" />
                <span className="text-white group-hover:text-[#064e3b] transition-colors duration-300 relative z-10 font-bold">
                  Lihat Panduan & SOP Pelaporan
                </span>
              </Link>

              <p className="text-center text-[11px] text-emerald-200/70 mt-1">
                Kendala akses? Hubungi UPT Puskom / Tim K3 Kampus
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Alert Bar (Open Clean Calm Layout without Boxed Card) */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center shrink-0 border border-emerald-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                Pusat Tanggap Darurat & Insiden Tumpahan Bahan Berbahaya (24 Jam)
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                Hubungi Pos Satpam & Command Center K3L Kampus jika terjadi kebocoran atau insiden reagen di laboratorium.
              </p>
            </div>
          </div>

          <a
            href="tel:0431811911"
            className="inline-flex items-center justify-center gap-2 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-full shrink-0 shadow-sm transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneCall className="w-4 h-4" />
            <span>(0431) 811-911</span>
          </a>
        </div>
      </div>
    </section>
  );
}
