"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Box,
  Download,
  PhoneCall,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface K3InfoCardsProps {
  onOpenSop?: () => void;
  onDownloadTemplate?: () => void;
}

export default function K3InfoCards({
  onOpenSop,
  onDownloadTemplate,
}: K3InfoCardsProps) {
  const [showPdfModal, setShowPdfModal] = useState(false);

  return (
    <>
      <section id="sop-section" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: SOP Tanggap Darurat & Spill Kit */}
        <div className="bg-white border border-[#e2eae4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#cbe4d4] transition">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#244b32]">
                SOP TANGGAP DARURAT
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mt-2.5">
              Penanganan Wadah Bocor & Tumpahan (Spill Kit)
            </h4>

            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 mt-2.5 leading-relaxed font-medium">
              <li>Pasang tanda bahaya & barikade area isolasi.</li>
              <li>Taburkan absorben/pasir dari spill kit lab.</li>
              <li>Evakuasi personel yang tidak berkepentingan.</li>
              <li>Buka ventilasi lemari asam & gunakan respirator.</li>
            </ol>
          </div>

          <div className="mt-5 pt-3 border-t border-[#e5ece6] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowPdfModal(true);
                if (onOpenSop) onOpenSop();
              }}
              className="text-xs font-bold text-[#244b32] hover:text-[#1b3a26] flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <span>Buka Dokumen SOP Lengkap</span>
              <FileText className="w-3.5 h-3.5 text-[#244b32]" />
            </button>

            <a
              href="/sop-limbah-b3.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#244b32] p-1.5 transition"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Card 2: Standardisasi Kemasan & Simbol */}
        <div className="bg-white border border-[#e2eae4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#cbe4d4] transition">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] flex items-center justify-center shrink-0">
                <Box className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#244b32]">
                STANDARDISASI KEMASAN
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mt-2.5">
              Panduan Simbol Bahaya 10×10 cm & Wadah HDPE
            </h4>

            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              Piktogram wajib berukuran minimal 10×10 cm berbahan stiker vinyl tahan tumpahan kimia/air. Wajib terpasang pada sisi drum yang menghadap langsung keluar lorong penyimpanan TPS.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#e5ece6]">
            <button
              type="button"
              onClick={
                onDownloadTemplate ||
                (() =>
                  alert(
                    "Mengunduh Template Piktogram Resmi 10x10 cm (Vector PDF)..."
                  ))
              }
              className="text-xs font-bold text-[#244b32] hover:text-[#1b3a26] flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Piktogram Resmi</span>
            </button>
          </div>
        </div>

        {/* Card 3: Hotline Reaksi Cepat Kampus */}
        <div className="bg-[#284533] text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#1e3426] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/15 text-emerald-200 border border-white/20 flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-200">
                BANTUAN CEPAT KAMPUS
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mt-2.5">
              Hotline & Unit Reaksi Cepat K3
            </h4>

            <p className="text-xs text-white/90 mt-2 leading-relaxed">
              Jika terjadi paparan langsung pada kulit/mata atau kebakaran reagen, segera hubungi tim K3 Kampus Pusat POLIMDO.
            </p>

            <div className="mt-3.5 bg-black/20 border border-white/15 rounded-xl p-3 space-y-1.5 backdrop-blur-xs">
              <div className="text-xs font-mono font-bold text-emerald-100 flex items-center justify-between">
                <span>Ext. Internal:</span>
                <span className="bg-white/15 px-2 py-0.5 rounded text-white font-mono">109 / 112</span>
              </div>
              <a
                href="https://wa.me/6281244210900"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 flex items-center justify-between transition cursor-pointer"
              >
                <span>WhatsApp Darurat:</span>
                <span className="text-white underline font-mono">0812-4421-0900</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 text-[10px] text-white/70 flex items-center justify-between">
            <span>Petugas Piket Hari Ini:</span>
            <span className="font-semibold text-white">Ir. Meilany Sambouga</span>
          </div>
        </div>
      </section>

      {/* PDF VIEWER MODAL */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[92vh] sm:h-[90vh] flex flex-col shadow-2xl border border-[#e2eae4] overflow-hidden">
            {/* Modal Header */}
            <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-[#284533] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/15 text-emerald-200 border border-white/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    SOP Pengelolaan Limbah B3.pdf
                  </div>
                  <div className="text-[10px] text-emerald-200/80 truncate">
                    Standar Operasional Prosedur POLIMDO
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href="/sop-limbah-b3.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 sm:px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-white/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka di Tab Baru</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/15 transition cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer Frame */}
            <div className="flex-1 bg-slate-50 p-3">
              <iframe
                src="/sop-limbah-b3.pdf"
                className="w-full h-full rounded-xl border border-slate-200 bg-white"
                title="SOP Pengelolaan Limbah B3"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
