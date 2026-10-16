"use client";

import React from "react";
import Link from "next/link";
import { Shield, PhoneCall, Mail, MapPin, ExternalLink } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-[#021a13] text-emerald-100/80 border-t border-emerald-950">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#064e3b] flex items-center justify-center border border-emerald-700/50">
                <Shield className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                SIM-LB3 POLIMDO
              </span>
            </div>
            <p className="text-xs text-emerald-200/70 leading-relaxed">
              Sistem Informasi Manajemen Pengelolaan Limbah B3 Kampus Terintegrasi Politeknik Negeri Manado.
            </p>
            <div className="text-[11px] font-mono text-emerald-400/80 pt-1">
              SK Jurusan No.: 148/PL1.1/KL/2023
            </div>
          </div>

          {/* Column 2: Sekretariat K3L Kampus */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              SEKRETARIAT K3L KAMPUS
            </h4>
            <div className="space-y-1.5 text-xs text-emerald-200/70 leading-relaxed">
              <p className="font-semibold text-white">Gedung K3 Terpadu lt. 1</p>
              <p>Politeknik Negeri Manado</p>
              <p>Jl. Raya Politeknik, Buha, Kec. Mapanget, Manado, Sulawesi Utara 95252</p>
              <p className="pt-1">
                <a
                  href="mailto:info@polimdo.ac.id"
                  className="text-emerald-400 hover:text-emerald-300 transition underline underline-offset-2"
                >
                  info@polimdo.ac.id
                </a>
              </p>
            </div>
          </div>

          {/* Column 3: Hotline Tanggap B3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              HOTLINE TANGGAP B3
            </h4>
            <p className="text-xs text-emerald-200/70">
              Layanan cepat tanggap tumpahan, konsultasi limbah praktikum:
            </p>
            <div className="bg-[#03291e] border border-emerald-800/60 rounded-xl p-3 space-y-1">
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                EMERGENCY: 24 JAM
              </div>
              <a
                href="tel:0431811911"
                className="block text-base font-black text-white hover:text-emerald-300 font-mono"
              >
                (0431) 811-911
              </a>
              <div className="text-[11px] text-emerald-300/80">
                WhatsApp: +62 811-434-8000
              </div>
            </div>
          </div>

          {/* Column 4: Landasan Regulasi */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              LANDASAN REGULASI
            </h4>
            <div className="space-y-2 text-xs text-emerald-200/70 leading-relaxed">
              <p>UU No. 32 Tahun 2009 (Perlindungan Lingkungan Hidup)</p>
              <p>Permen LHK No. 6 Tahun 2021 tentang Pengelolaan Limbah B3</p>
              <p>Standar K3 Laboratorium & Workshop Vokasi</p>
              <p className="text-emerald-400 font-medium">
                Integrasi Festronik Berizin KLHK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-emerald-950/80 bg-[#01140f] py-4 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-emerald-300/60">
          <p>
            © 2024-2026 Politeknik Negeri Manado (POLIMDO), Unit K3 & Pengelolaan Limbah B3.
          </p>
          <div className="flex items-center gap-4 text-emerald-300/70">
            <Link href="/sop-limbah-b3.pdf" target="_blank" className="hover:text-white transition">
              Panduan Teknis
            </Link>
            <span>•</span>
            <Link href="#statistik" className="hover:text-white transition">
              Festronik K3
            </Link>
            <span>•</span>
            <a href="#lacak-tiket" className="hover:text-white transition">
              Peta TPS Terpadu
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
