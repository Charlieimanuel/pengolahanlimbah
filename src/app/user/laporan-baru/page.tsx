"use client";

import React, { useState } from "react";
import FormPelaporan from "@/components/user/FormPelaporan";
import { CheckCircle2, Leaf } from "lucide-react";

import { useRouter } from "next/navigation";

export default function LaporanBaruPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSuccess = (id: string) => {
    showToast(`Laporan temuan #${id} berhasil terkirim ke Tim K3L POLIMDO! Mengarahkan ke riwayat tiket...`);
    setTimeout(() => {
      router.push("/user/riwayat-tiket");
      router.refresh();
    }, 1000);
  };

  const handleDraftSuccess = (id: string) => {
    showToast(`Draft laporan #${id} berhasil disimpan ke database.`);
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
              TANGGAP CEPAT K3L POLIMDO
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Pelaporan Temuan Limbah B3
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed">
              Laporkan limbah bahan berbahaya & beracun (B3) yang ditemukan di lingkungan kampus untuk penanganan darurat tim K3L.
            </p>
          </div>


        </div>
      </div>


      {/* Main Form Component */}
      <FormPelaporan
        onSubmitSuccess={handleSuccess}
        onSaveDraftSuccess={handleDraftSuccess}
      />
    </div>
  );
}
