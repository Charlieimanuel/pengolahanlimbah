"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Boxes,
  Scale,
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from "lucide-react";

const pillars = [
  {
    num: "LAYANAN 01",
    tag: "FORM-LB3-POL",
    icon: FileText,
    title: "Pelaporan Limbah Praktikum",
    desc: "Formulir 12 parameter terstandarisasi untuk laboran dan dosen saat pengosongan sisa reagen kimia, pelarut, dan oli bekas.",
    linkText: "Sesuai PP No. 22/2021",
    href: "/user/laporan-baru"
  },
  {
    num: "LAYANAN 02",
    tag: "KLASIFIKASI B3",
    icon: Boxes,
    title: "Katalog & Kode B3 Kampus",
    desc: "Basis data deteksi limbah B3 spesifik umum dan khusus: pelarut terhalogenasi, lumpur manufaktur, hingga aki bekas.",
    linkText: "140 Jenis Terinventarisasi",
    href: "/user/katalog-b3"
  },
  {
    num: "LAYANAN 03",
    tag: "NERACA TPS",
    icon: Scale,
    title: "Transparansi Neraca Limbah",
    desc: "Pencatatan kuota akumulasi TPS secara transparan dengan perhitungan masa simpan otomatis sebelum kedaluwarsa batas 90/180 hari.",
    linkText: "Audit Neraca Terbuka",
    href: "#statistik"
  },
  {
    num: "LAYANAN 04",
    tag: "SIAGA DARURAT B3",
    icon: ShieldAlert,
    title: "SOP Tanggap Darurat K3",
    desc: "Prosedur kerja netralisasi ceceran kimia, lembar data keselamatan (MSDS/LDKS), dan kontak person evakuasi di laboratorium.",
    linkText: "Buku Saku Digital K3",
    href: "/sop-limbah-b3.pdf"
  }
];

export default function ServicesSection() {
  return (
    <section id="informasi" className="py-20 sm:py-24 bg-white border-t border-slate-200/70 relative">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#064e3b] uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>TATA KELOLA & LAYANAN TERPADU</span>
            </div>
            {/* Gradient text heading (FMI style) */}
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              4 Pilar Layanan SIM-LB3 POLIMDO
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Standar operasional pengelolaan limbah B3 dari laboratorium praktikum, bengkel vokasi, hingga verifikasi dan pencatatan resmi K3L POLIMDO.
            </p>
          </div>

          <Link
            href="/sop-limbah-b3.pdf"
            target="_blank"
            className="text-xs font-bold text-slate-900 hover:text-[#064e3b] bg-white border border-slate-300 hover:border-slate-400 px-5 py-3 rounded-full flex items-center gap-2 shrink-0 transition shadow-2xs"
          >
            <span>Panduan/Regulasi Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#064e3b]" />
          </Link>
        </div>

        {/* 4 Pilar Open Columns (Calm.com open style without box cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {pillars.map((item) => (
            <div
              key={item.num}
              className="flex flex-col justify-between group"
            >
              <div>
                {/* Icon in soft mint circle */}
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#064e3b] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#064e3b] group-hover:text-white transition-all shadow-2xs">
                  <item.icon className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-[#064e3b] uppercase tracking-wider">
                    {item.num}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2.5 group-hover:text-[#064e3b] transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Text link */}
              <div className="mt-5 pt-3">
                <Link
                  href={item.href}
                  className="text-xs font-bold text-[#064e3b] hover:text-[#043d2e] inline-flex items-center gap-1.5 transition underline underline-offset-4 decoration-emerald-200 hover:decoration-[#064e3b]"
                >
                  <span>{item.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
