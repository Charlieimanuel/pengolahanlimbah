"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, X } from "lucide-react";

const newsList = [
  {
    image: "/images/waste-truck.jpg",
    badge: "Digitalisasi Pelaporan",
    date: "28 Februari 2024",
    title: "Pemberlakuan Sistem Pelaporan Digital Limbah B3 Berbasis Web bagi Seluruh Laboran & Dosen",
    desc: "Mulai semester ini, seluruh pelaporan limbah B3 dari praktikum wajib diinput melalui portal SIM-LB3 untuk mempermudah pencatatan dan verifikasi data.",
    linkText: "Baca Informasi",
    href: "/sop-limbah-b3.pdf"
  },
  {
    image: "/images/lab-pictogram.jpg",
    badge: "Standarisasi Lab",
    date: "14 Februari 2024",
    title: "Sosialisasi Peraturan Label Simbol Bahaya Piktogram di Seluruh Laboratorium Jurusan",
    desc: "Unit K3 membagikan 500 paket label piktogram tahan bahan kimia berstandar Permen LHK No. 6 Tahun 2021 secara gratis.",
    linkText: "Panduan Simbol",
    href: "/sop-limbah-b3.pdf"
  },
  {
    image: "/images/spill-kit.jpg",
    badge: "Prosedur Darurat",
    date: "30 Januari 2024",
    title: "Pemberlakuan SOP Baru Penanganan Darurat Tumpahan Kimia di Ruang Praktikum",
    desc: "Instruksi penempatan Spill Kit absorbent netralisir di ruang praktikum yang menyimpan bahan cair Kimia Berbahaya.",
    linkText: "Unduh SOP (PDF)",
    href: "/sop-limbah-b3.pdf"
  }
];

export default function NewsSection() {
  const [selectedNews, setSelectedNews] = useState<typeof newsList[0] | null>(null);

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden bg-white border-t border-slate-200/70">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#064e3b] uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>SOSIALISASI & INFORMASI</span>
            </div>
            {/* Gradient text heading (FMI style) */}
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Pengumuman & Berita K3 Kampus
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Informasi terkini jadwal pengangkutan, penyuluhan piktogram bahaya, dan kesiapsiagaan K3L POLIMDO.
            </p>
          </div>

          <Link
            href="/sop-limbah-b3.pdf"
            target="_blank"
            className="text-xs font-bold text-slate-900 hover:text-[#064e3b] bg-white border border-slate-300 hover:border-slate-400 px-5 py-3 rounded-full flex items-center gap-2 shrink-0 transition shadow-2xs"
          >
            <span>Arsip Pengumuman</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#064e3b]" />
          </Link>
        </div>

        {/* 3 News Open Editorial Columns (Calm style, zero box cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {newsList.map((item) => (
            <article
              key={item.title}
              className="flex flex-col justify-between group cursor-pointer"
              onClick={() => setSelectedNews(item)}
            >
              <div>
                {/* Clean Image with Smooth Zoom */}
                <div className="relative aspect-[16/10] rounded-2xl bg-slate-900 overflow-hidden mb-5">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-white/90 text-[#064e3b] border border-white/40 shadow-xs backdrop-blur-md">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-slate-400 font-medium mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.date}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2.5 group-hover:text-[#064e3b] transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Text link */}
              <div className="mt-5 pt-3">
                <span className="text-xs font-bold text-[#064e3b] group-hover:text-[#043d2e] inline-flex items-center gap-1.5 transition underline underline-offset-4 decoration-emerald-200 group-hover:decoration-[#064e3b]">
                  <span>{item.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal Detail Berita */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={selectedNews.image}
                alt={selectedNews.title}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNews(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#064e3b] border border-emerald-200">
                  {selectedNews.badge}
                </span>
                <span className="text-xs text-slate-400">{selectedNews.date}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedNews.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedNews.desc}
              </p>
              <div className="pt-3 flex gap-3">
                <a
                  href={selectedNews.href}
                  target="_blank"
                  className="flex-1 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold py-3 rounded-full text-center transition shadow-sm"
                >
                  Buka Dokumen Resmi (PDF)
                </a>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-5 py-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
