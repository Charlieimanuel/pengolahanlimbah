"use client";

import React, { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Siapa saja yang wajib menggunakan SIM-LB3 POLIMDO?",
    a: "Seluruh laboran, dosen pembimbing praktikum, peneliti, teknisi bengkel vokasi, dan pengelola unit kerja di lingkungan Politeknik Negeri Manado yang menghasilkan residu bahan kimia atau limbah B3 wajib mencatat dan melaporkan serah terima melalui SIM-LB3."
  },
  {
    q: "Apa saja kategori limbah B3 yang dikelola di lingkungan kampus?",
    a: "Limbah B3 kampus terbagi menjadi limbah cair (pelarut organik, asam-basa kuat, oli mesin & minyak pelumas bekas), limbah padat terkontaminasi (majun, filter, sarung tangan, glassware pecah terkontaminasi), serta limbah B3 spesifik seperti baterai/aki bekas dan sludge IPAL laboratorium."
  },
  {
    q: "Berapa lama batas waktu pelaporan limbah setelah ditemukan di laboratorium?",
    a: "Sesuai SOP Tata Kelola K3L POLIMDO, setiap limbah B3 baru yang dihasilkan dari praktikum atau ditemukan di bengkel wajib dilaporkan melalui portal SIM-LB3 maksimal 1x24 jam untuk memastikan pencatatan dan evaluasi keamanan yang tepat."
  },
  {
    q: "Bagaimana cara memantau status verifikasi laporan limbah yang telah saya ajukan?",
    a: "Setelah formulir diajukan, Anda akan menerima Nomor Tiket unik (contoh: B3-2024-001). Cukup masukkan nomor tiket tersebut ke kolom 'Cari No. Tiket' di navbar atau kotak pelacakan di halaman utama untuk melihat apakah laporan sedang diperiksa, telah diverifikasi, atau sudah dibukukan ke neraca limbah kampus."
  },
  {
    q: "Bagaimana prosedur darurat jika terjadi ceceran atau tumpahan bahan kimia berbahaya?",
    a: "Segera isolasi area, buka ventilasi, dan jangan membersihkan bahan reaktif tanpa APD memadai. Gunakan Spill Kit terdekat sesuai petunjuk SOP dan hubungi Tim Hotline Siaga Darurat K3 Kampus di (0431) 811-911 atau WhatsApp Siaga 24 Jam."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24 relative overflow-hidden border-t border-slate-200/70" style={{ backgroundColor: '#f0f5f2' }}>
      <div className="max-w-[960px] mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#064e3b] uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          {/* Gradient text heading (FMI style) */}
          <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Informasi penting seputar tata cara pelaporan, verifikasi status tiket, dan kepatuhan regulasi limbah B3 di POLIMDO.
          </p>
        </div>

        {/* Calm.com List Style Accordion (Clean horizontal divider lines, zero box cards) */}
        <div className="border-y border-slate-200/80 divide-y divide-slate-200/80">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between py-6 text-left transition group cursor-pointer gap-4"
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#064e3b] transition-colors leading-snug">
                    {faq.q}
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-[#064e3b] group-hover:bg-emerald-50 transition-all">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#064e3b]" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-[#064e3b]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="pb-6 pt-1 text-sm text-slate-600 leading-relaxed max-w-3xl animate-in fade-in-50 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center text-xs sm:text-sm text-slate-500">
          Belum menemukan jawaban? Hubungi Tim K3 Kampus via hotline{" "}
          <a
            href="tel:0431811911"
            className="font-bold text-[#064e3b] hover:underline"
          >
            (0431) 811-911
          </a>{" "}
          atau email{" "}
          <a
            href="mailto:info@polimdo.ac.id"
            className="font-bold text-[#064e3b] hover:underline"
          >
            info@polimdo.ac.id
          </a>
        </div>
      </div>
    </section>
  );
}
