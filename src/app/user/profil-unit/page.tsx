"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Award,
  Leaf,
  Phone,
  Mail,
  Edit3,
  Calendar,
  AlertTriangle,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilUnitPage() {
  const [dbProfile, setDbProfile] = useState<{
    nama_lengkap?: string;
    email?: string;
    nip_nim?: string;
    nama_lab?: string;
    jurusan?: string;
    role?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("nama_lengkap, email, nip_nim, nama_lab, jurusan, role")
            .eq("id", user.id)
            .maybeSingle();

          if (data) {
            setDbProfile(data);
          } else {
            setDbProfile({
              nama_lengkap: user.user_metadata?.full_name || "Pengguna Terdaftar",
              email: user.email || "",
              nip_nim: user.user_metadata?.id_number || "",
              nama_lab: user.user_metadata?.lab || "Laboratorium Kampus",
              jurusan: user.user_metadata?.jurusan || "Politeknik Negeri Manado",
              role: user.user_metadata?.role || "unit_pelapor",
            });
          }
        }
      } catch (err) {
        console.error("Gagal mengambil profil:", err);
      }
    }

    loadProfile();
  }, []);

  const displayName = dbProfile?.nama_lengkap || "Pengguna Terdaftar";
  const displayNip = dbProfile?.nip_nim || "-";
  const displayLab = dbProfile?.nama_lab || "Unit Laboratorium / Praktikum Kampus";
  const displayJurusan = dbProfile?.jurusan || "Politeknik Negeri Manado";
  const displayEmail = dbProfile?.email || "-";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
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
              UNIT OPERASIONAL RESMI KAMPUS
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Profil & Unit Laboratorium
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed">
              Informasi penanggung jawab teknis pelapor, zonasi lemari asam, dan sertifikasi kepatuhan K3L.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 pt-1 sm:pt-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-black/20 border border-white/15 text-[11px] sm:text-xs font-medium text-white backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Terakreditasi KAN & K3</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-black/20 border border-white/15 text-[11px] sm:text-xs font-medium text-white backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>ISO 14001:2015</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Profile & Unit) + Right Column (Fasilitas & Kepatuhan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ================= LEFT COLUMN: Kartu Personel & Unit ================= */}
        <div className="bg-white border border-[#e2eae4] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 hover:border-[#cbe4d4] transition">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#e5ece6]">
            <div className="w-12 h-12 rounded-2xl bg-[#244b32] text-white font-black text-base flex items-center justify-center ring-4 ring-[#eaf4ed] shadow-xs shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                NIP. {displayNip}
              </p>
              <span className="inline-block mt-1 bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] text-[10px] font-bold px-2.5 py-0.5 rounded-full truncate max-w-full">
                Pranata Laboratorium Pendidikan (PLP)
              </span>
            </div>
          </div>

          {/* Key Value Details */}
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Satuan Unit Laboratorium
              </span>
              <p className="font-semibold text-slate-800 leading-snug">
                {displayLab}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Program Studi & Jurusan
              </span>
              <p className="font-semibold text-slate-800 leading-snug">
                {displayJurusan}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Titik Simpan Sementara Unit
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-[#244b32] shrink-0" />
                <span>Gedung Utama, Lt. 2 / Lantai Asam (01 B)</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Kontak & Telepon Internal
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 leading-snug">
                <Phone className="w-3.5 h-3.5 text-[#244b32] shrink-0" />
                <span>Ext. 204 (Ruang Laboran Kimia)</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Email Terdaftar
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 leading-snug truncate">
                <Mail className="w-3.5 h-3.5 text-[#244b32] shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 border-t border-[#e5ece6]">
            <button
              type="button"
              onClick={() => showToast("Permintaan pembaruan data telah diteruskan ke Admin K3L Kampus.")}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#244b32] hover:bg-[#1b3a26] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ajukan Pembaruan Data Unit</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Fasilitas K3 & Zonasi ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Fasilitas Keselamatan & Zonasi Lemari Asam */}
          <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#cbe4d4] transition">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5ece6]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#244b32]" />
                <span>Fasilitas Keselamatan & Zonasi Lemari Asam</span>
              </h3>
              <span className="text-[10px] font-bold text-[#244b32] bg-[#eaf4ed] border border-[#cbe4d4] px-2.5 py-0.5 rounded-full">
                Inspeksi Rutin Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-[#e2eae4] space-y-1.5 hover:border-[#cbe4d4] transition">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Lemari Asam 01 (B)
                </div>
                <div className="font-bold text-slate-900">Area Evakuasi B3 Utama</div>
                <div className="inline-flex items-center gap-1 text-[10px] text-[#244b32] font-semibold bg-[#eaf4ed] px-2 py-0.5 rounded-md mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#244b32] animate-pulse"></span>
                  Ventilasi Aktif 24 Jam
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-[#e2eae4] space-y-1.5 hover:border-[#cbe4d4] transition">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Spill Kit Station
                </div>
                <div className="font-bold text-slate-900">Absorben & Pasir Kering</div>
                <div className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Terinspeksi Mingguan
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-[#e2eae4] space-y-1.5 hover:border-[#cbe4d4] transition">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Emergency Eyewash
                </div>
                <div className="font-bold text-slate-900">Shower & Bilas Mata</div>
                <div className="inline-flex items-center gap-1 text-[10px] text-[#244b32] font-semibold bg-[#eaf4ed] px-2 py-0.5 rounded-md mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#244b32]"></span>
                  Tekanan Air Stabil
                </div>
              </div>
            </div>
          </div>

          {/* Card: Sertifikasi & Kepatuhan Limbah B3 Kampus */}
          <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#cbe4d4] transition">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5ece6]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#244b32]" />
                <span>Sertifikasi & Kepatuhan Limbah B3 Kampus</span>
              </h3>
              <span className="text-[10px] font-bold text-[#244b32] bg-[#eaf4ed] border border-[#cbe4d4] px-2.5 py-0.5 rounded-full">
                PP No. 22/2021
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Unit Lab Kimia Terpadu memegang sertifikasi penanganan bahan berbahaya dan beracun sesuai regulasi ISO 14001:2015 dan PP RI No. 22 Tahun 2021. Setiap mahasiswa dan staf peneliti diwajibkan melewati induksi keselamatan sebelum menggunakan fasilitas praktikum.
              </p>

              <div className="pt-1 flex flex-wrap gap-2.5">
                <span className="bg-slate-50 border border-[#e2eae4] text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#244b32]" />
                  Neraca Limbah Triwulan I: Tercatat (Festronik)
                </span>
                <span className="bg-slate-50 border border-[#e2eae4] text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#244b32]" />
                  Spill Containment Pallet: Standar KAN
                </span>
                <span className="bg-slate-50 border border-[#e2eae4] text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#244b32]" />
                  Pengangkutan Berizin Resmi KLHK (PPLI / Wastec)
                </span>
              </div>
            </div>
          </div>

          {/* Card: Inventaris Wadah Penyimpanan Aktif di Unit */}
          <div className="bg-white border border-[#e2eae4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#cbe4d4] transition">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5ece6]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#244b32]" />
                <span>Status Wadah & Log Penyimpanan Aktif di Lab</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">
                Pembaruan Terakhir: Hari ini, 11:30 WITA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50/70 border border-[#e2eae4] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Jerigen HDPE 20 Liter (Asam)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kode: B105d • Label Korosif Terpasang</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4]">
                  1 Wadah Aktif
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-[#e2eae4] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Botol Kaca Amber 5 Liter</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kode: B109d • Pelarut Organik Mudah Menyala</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4]">
                  Standar Baik
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
