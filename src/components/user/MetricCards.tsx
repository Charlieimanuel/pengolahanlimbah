"use client";

import React from "react";
import { FileText, Clock, CheckCircle2, Check } from "lucide-react";

interface MetricCardsProps {
  onFixDocumentClick?: () => void;
  totalCount?: number;
  pendingCount?: number;
  verifiedCount?: number;
  volumeSummary?: string;
}

export default function MetricCards({
  onFixDocumentClick,
  totalCount,
  pendingCount,
  verifiedCount,
  volumeSummary,
}: MetricCardsProps) {
  const displayTotal = totalCount !== undefined ? totalCount : 0;
  const displayPending = pendingCount !== undefined ? pendingCount : 0;
  const displayVerified = verifiedCount !== undefined ? verifiedCount : 0;
  const displayVolume = volumeSummary || "Tercatat di sistem pelaporan K3L";

  const complianceRate = displayTotal > 0 ? Math.round((displayVerified / displayTotal) * 100) : 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Total Laporan */}
      <div className="bg-[#fbfcfb] border border-[#e2eae4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL LAPORAN TEMUAN (2026)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {displayTotal} Laporan
          </div>
          <div className="text-xs text-slate-600 font-medium mt-1 truncate">
            {displayVolume}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[#e5ece6] flex items-center justify-between text-[11px] text-slate-500">
          <span>Pembaruan Data</span>
          <span className="font-semibold text-emerald-700">Otomatis</span>
        </div>
      </div>

      {/* Card 2: Menunggu Verifikasi */}
      <div className="bg-[#fcfdfc] border border-[#e2eae4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              MENUNGGU VERIFIKASI
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {displayPending} Laporan
          </div>
          <div className="text-xs text-slate-600 font-medium mt-1 truncate">
            Menunggu evakuasi & pengamanan lokasi
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[#e5ece6] text-[11px] text-slate-500">
          Estimasi respon cepat: &lt; 30 menit
        </div>
      </div>

      {/* Card 3: Terverifikasi & Tercatat */}
      <div className="bg-[#fcfdfc] border border-[#e2eae4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TERVERIFIKASI & DIAMANKAN
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] text-[#244b32] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#284533] mt-2">
            {displayVerified} Laporan
          </div>
          <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#244b32]" />
            <span>Telah diinspeksi & masuk TPS limbah</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[#e5ece6] space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Tingkat penanganan temuan</span>
            <span className="font-bold text-[#244b32]">{complianceRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#284533] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${complianceRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
