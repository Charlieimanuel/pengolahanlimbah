"use client";

import React, { useState } from "react";
import K3InfoCards from "@/components/user/K3InfoCards";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Leaf,
  Check,
  Clock,
  Building2,
  MapPin,
  Flame,
  Skull,
  Sparkles,
  Biohazard,
} from "lucide-react";

export default function PanduanSopPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:top-5 z-50 bg-[#064e3b] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-emerald-500/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner with Rich Botanical Leaf Background */}
      <div className="relative overflow-hidden rounded-2xl bg-[#284533] text-white p-4 sm:p-7 shadow-sm border border-[#1e3426]">
        {/* Real Botanical Leaf Wallpaper Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 scale-105"
          style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
        />
        {/* Ambient forest green gradient to ensure perfect text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

        {/* Decorative Monstera & Botanical Leaf Silhouette on Right */}
        <div className="absolute -bottom-8 -right-6 pointer-events-none opacity-20 text-emerald-200 hidden sm:block">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 22" strokeWidth="1.5" />
            <path d="M12 4C14.5 4.5 17 6 18 8.5C18.5 9.7 18.2 11.2 17.5 12.2C16.8 13.2 15.5 13.8 14.5 14.5C13.5 15.2 12.8 16 12 17" fill="currentColor" fillOpacity="0.3" />
            <path d="M12 4C9.5 4.5 7 6 6 8.5C5.5 9.7 5.8 11.2 6.5 12.2C7.2 13.2 8.5 13.8 9.5 14.5C10.5 15.2 11.2 16 12 17" fill="currentColor" fillOpacity="0.3" />
            <path d="M12 8C14 8.5 16 10 16.5 11.5" />
            <path d="M12 8C10 8.5 8 10 7.5 11.5" />
            <path d="M12 12C14 12.5 15.5 13.5 16 14.5" />
            <path d="M12 12C10 12.5 8.5 13.5 8 14.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/90 tracking-wider mb-1">
              <Leaf className="w-3 h-3 text-emerald-300" />
              STANDAR OPERASIONAL K3L POLIMDO
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Panduan & Prosedur Limbah B3
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed">
              Kepatuhan hukum PP No. 22/2021, keselamatan penanganan reagen, dan pengelolaan ramah lingkungan.
            </p>
          </div>


        </div>
      </div>

      {/* 3 Core K3 Info Cards (Emergency, Packaging, Hotline) */}
      <K3InfoCards
        onOpenSop={() => showToast("Membuka Dokumen SOP Lengkap (PDF 32 Halaman)...")}
        onDownloadTemplate={() => showToast("Mengunduh Template Simbol Bahaya 10x10 cm (Vector)...")}
      />

      {/* Extended Guideline Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Regulasi PP No. 22/2021 */}
        <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#cbe4d4] transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kepatuhan Hukum & Regulasi KLHK
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Lampiran IX & K PP No. 22 Tahun 2021
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaf4ed] text-[#244b32] text-[10px] font-bold border border-[#cbe4d4]">
              Wajib Nasional
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Sesuai regulasi pemerintah, seluruh unit laboratorium diwajibkan menerapkan tata kelola ramah lingkungan:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#eaf4ed] text-[#244b32] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span><strong>Pemisahan Karakteristik:</strong> Dilarang mencampur senyawa asam kuat dengan pelarut organik atau basa.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#eaf4ed] text-[#244b32] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span><strong>Wadah Khusus Tidak Bereaksi:</strong> Menggunakan jerigen HDPE anti karat atau botol kaca amber berventilasi.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#eaf4ed] text-[#244b32] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span><strong>Label Simbol 10×10 cm:</strong> Piktogram bahaya dan data lembar keselamatan wajib tertempel permanen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#eaf4ed] text-[#244b32] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span><strong>Batas Simpan Sementara:</strong> Maksimal 90 hari kalender sebelum wajib dipindahkan ke TPS LB3 Kampus.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Prosedur Pengajuan & Validasi Alur */}
        <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#cbe4d4] transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Alur 4 Langkah Pelaporan & Validasi
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Integrasi Neraca Digital SIM-LB3 POLIMDO
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaf4ed] text-[#244b32] text-[10px] font-bold border border-[#cbe4d4]">
              SOP Kampus
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-[#e2eae4]">
              <span className="w-6 h-6 rounded-full bg-[#244b32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <div>
                <div className="font-bold text-slate-900">Registrasi Parameter Limbah</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Isi formulir keselamatan 12-parameter dan unggah foto kemasan di menu Laporan Baru.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-[#e2eae4]">
              <span className="w-6 h-6 rounded-full bg-[#244b32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <div>
                <div className="font-bold text-slate-900">Verifikasi Dokumen Administrasi</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Tim pengurus K3L mereview kelayakan wadah dan label simbol piktogram (&lt;30 menit).
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-[#e2eae4]">
              <span className="w-6 h-6 rounded-full bg-[#244b32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <div>
                <div className="font-bold text-slate-900">Inspeksi Fisik & Penjemputan</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Petugas K3L melakukan penimbangan, pencatatan barcode tiket, dan evakuasi ke TPS.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-[#e2eae4]">
              <span className="w-6 h-6 rounded-full bg-[#244b32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                4
              </span>
              <div>
                <div className="font-bold text-slate-900">Pembukuan Neraca Limbah Resmi</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Volume resmi tersinkronisasi otomatis dengan Festronik KLHK untuk pelaporan semester.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Klasifikasi 5 Simbol Piktogram Karakteristik Bahaya */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e5ece6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d4a36]"></span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Standar Piktogram Simbol Bahaya B3 (PP 22/2021)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifikasi visual piktogram wajib berukuran 10×10 cm sesuai Lembar Data Keselamatan (MSDS).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#244b32] bg-[#eaf4ed] px-3 py-1 rounded-full border border-[#cbe4d4] self-start sm:self-auto">
            5 Kategori Utama
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Korosif */}
          <div className="bg-slate-50/60 border border-[#e2eae4] rounded-xl p-3.5 space-y-2 hover:border-[#cbe4d4] transition">
            <div className="w-7 h-7 rounded-lg bg-[#eaf4ed] text-[#244b32] flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Korosif (Corrosive)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Asam kuat, basa pekat (pH &lt; 2 atau &gt; 12.5). Menyebabkan iritasi berat pada kulit/logam.
            </p>
          </div>

          {/* 2. Beracun */}
          <div className="bg-slate-50/60 border border-[#e2eae4] rounded-xl p-3.5 space-y-2 hover:border-[#cbe4d4] transition">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <Skull className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Beracun (Toxic)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Logam berat (Pb, Hg), pelarut berklorin, pestisida lab. Berbahaya jika tertelan/terhirup.
            </p>
          </div>

          {/* 3. Mudah Menyala */}
          <div className="bg-slate-50/60 border border-[#e2eae4] rounded-xl p-3.5 space-y-2 hover:border-[#cbe4d4] transition">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold text-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Mudah Menyala</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Titik nyala &lt; 60°C (Etanol, Aseton, Benzena). Jauhkan dari sumber api & panas berlebih.
            </p>
          </div>

          {/* 4. Reaktif */}
          <div className="bg-slate-50/60 border border-[#e2eae4] rounded-xl p-3.5 space-y-2 hover:border-[#cbe4d4] transition">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Reaktif (Reactive)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bereaksi hebat dengan air, udara, atau panas membentuk gas beracun (Sianida, Sulfida).
            </p>
          </div>

          {/* 5. Infeksius */}
          <div className="bg-slate-50/60 border border-[#e2eae4] rounded-xl p-3.5 space-y-2 hover:border-[#cbe4d4] transition">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              <Biohazard className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Infeksius (Infectious)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Limbah biologi, kultur mikroba, jarum suntik lab mikrobiologi/medis. Wajib diautoklaf.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Lokasi TPS & Kontak Pengelola Kampus */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">
              Gedung TPS Limbah B3 Kampus Pusat POLIMDO
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Area Belakang Gedung Jurusan Teknik Mesin & Pengujian Material, Kampus Manado
            </div>
            <div className="text-[11px] text-[#244b32] font-semibold mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Jam Operasional Penyerahan: Senin - Jumat (08.30 - 15.30 WITA)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => showToast("Nomor kontak Koordinator K3L: Ir. Meilany Sambouga (0812-4421-0900)")}
            className="px-4 py-2 rounded-xl bg-[#244b32] hover:bg-[#1b3a26] text-white text-xs font-semibold transition active:scale-95 shadow-xs cursor-pointer"
          >
            Hubungi Koordinator K3L
          </button>
        </div>
      </div>
    </div>
  );
}
