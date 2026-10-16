"use client";

import React, { useState } from "react";
import RiwayatTiket from "@/components/user/RiwayatTiket";
import TicketDetailModal from "@/components/user/TicketDetailModal";
import MetricCards from "@/components/user/MetricCards";

export default function RiwayatTiketPage() {
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    volumeSummary: "Menyinkronkan data database...",
  });

  const handleStatsLoaded = React.useCallback(
    (newStats: { total: number; pending: number; verified: number; volumeSummary: string }) => {
      setStats(newStats);
    },
    []
  );

  const handleSelectTicket = React.useCallback((id: string) => {
    setSelectedTicketDetail(id);
  }, []);

  return (
    <div className="space-y-6">
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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LOG STATUS & BUKTI REGISTER K3L
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Riwayat & Pelacakan Temuan Limbah B3
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed">
              Pantau status verifikasi teknis, inspeksi fisik, dan evakuasi limbah temuan oleh tim K3L kampus.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary for Tickets */}
      <MetricCards
        totalCount={stats.total}
        pendingCount={stats.pending}
        verifiedCount={stats.verified}
        volumeSummary={stats.volumeSummary}
      />

      {/* Riwayat & Table Component */}
      <RiwayatTiket
        onSelectTicket={handleSelectTicket}
        onStatsLoaded={handleStatsLoaded}
      />

      {/* Modal Detail Tiket Terkoneksi Database */}
      <TicketDetailModal
        ticketId={selectedTicketDetail}
        onClose={() => setSelectedTicketDetail(null)}
      />
    </div>
  );
}
