"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  X,
  Pencil,
  Shield,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminProfile {
  nama_lengkap: string;
  email: string | null;
  nip_nim: string | null;
  role: string;
}

export default function AdminNavbar() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [emergencyCount, setEmergencyCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("nama_lengkap, email, nip_nim, role")
            .eq("id", user.id)
            .maybeSingle();

          if (data) {
            setProfile(data);
          } else {
            setProfile({
              nama_lengkap: user.user_metadata?.full_name || "Admin K3L POLIMDO",
              email: user.email || null,
              nip_nim: user.user_metadata?.id_number || null,
              role: "verifikator_k3l",
            });
          }
        }

        // Hitung tiket darurat & pending
        const { data: tickets } = await supabase
          .from("b3_tickets")
          .select("id, is_emergency, status")
          .eq("status", "menunggu_verifikasi");

        if (tickets) {
          setPendingCount(tickets.length);
          const emerg = tickets.filter((t) => t.is_emergency).length;
          setEmergencyCount(emerg);
        }
      } catch (err) {
        console.error("Gagal load data admin navbar:", err);
      }
    }

    loadData();

    const interval = setInterval(loadData, 8000);
    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 1)
      .join("")
      .toUpperCase();
  };

  const activeName = profile?.nama_lengkap || "Petugas K3L POLIMDO";
  const activeInitial = getInitials(activeName);
  const displayEmail = profile?.email || "admin@polimdo.ac.id";

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#e5ece6] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left: Title / Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari tiket, kode limbah, lokasi temuan..."
            className="w-full bg-[#f4f7f5] border border-[#dce8df] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#284533] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right: Actions & Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">

          {/* Notification Bell with Badge */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowDropdown(false);
              }}
              className="relative p-2 rounded-xl border border-[#dce8df] hover:bg-[#f4f7f5] text-slate-600 transition cursor-pointer"
              title="Notifikasi Laporan"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                {/* Mobile Backdrop Overlay */}
                <div
                  className="sm:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-2xs"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="fixed inset-x-3 sm:inset-auto sm:right-0 top-14 sm:top-full sm:mt-2 z-50 w-auto sm:w-80 max-w-sm mx-auto sm:mx-0 bg-white rounded-2xl shadow-xl border border-[#e2eae4] p-3 text-xs animate-in fade-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>Notifikasi K3L</span>
                      {emergencyCount > 0 ? (
                        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                          {emergencyCount} Darurat
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#eaf4ed] text-[#284533] px-2 py-0.5 rounded-full font-semibold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Tutup Notifikasi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-2 space-y-2">
                    {pendingCount > 0 ? (
                      <Link
                        href="/admin/verifikasi-tiket"
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-slate-100 active:scale-[0.99]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {pendingCount} Laporan Temuan Baru
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Menunggu verifikasi fisik & penjemputan ke TPS.
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="py-6 text-center text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-600 text-xs">Belum Ada Notifikasi Baru</p>
                        <p className="text-[11px] text-slate-400">Tidak ada antrean laporan baru saat ini.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      href="/admin/verifikasi-tiket"
                      onClick={() => setShowNotifications(false)}
                      className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#284533] hover:underline py-1 w-full"
                    >
                      <span>Lihat Semua Antrean Tiket</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

        {/* Admin Profile Pill: Separated Avatar Button & Dropdown Chevron */}
        <div className="relative" ref={dropdownRef}>
          {/* Pill Container containing separated Avatar button and Chevron button */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/60 rounded-full transition shadow-2xs">
            {/* Button 1: Avatar circle button (navigates to Profile) */}
            <Link
              href="/admin/pengguna"
              className="w-8 h-8 rounded-full bg-[#284533] text-white font-black text-[13px] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition"
              title={`Buka Profil: ${activeName}`}
            >
              {activeInitial}
            </Link>

            {/* Button 2: Separated Chevron-Down button (toggles Dropdown Menu) */}
            <button
              type="button"
              onClick={() => {
                setShowDropdown((prev) => !prev);
                setShowNotifications(false);
              }}
              title="Menu Profil & Pengaturan"
              className="w-6 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer pr-1"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showDropdown ? "rotate-180 text-slate-900" : ""
                }`}
              />
            </button>
          </div>

          {showDropdown && (
            <div className="fixed inset-x-3 sm:inset-auto sm:right-0 top-14 sm:top-12 z-50 w-auto sm:w-92 max-w-md mx-auto sm:mx-0 bg-white rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
              {/* Top Row: Close 'X' button */}
              <div className="flex justify-end pb-1">
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Account Card */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Large Avatar with Pencil Edit Badge */}
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 rounded-full ring-2 ring-emerald-600 p-0.5 bg-white">
                      <div className="w-full h-full rounded-full bg-[#284533] text-white font-extrabold text-lg flex items-center justify-center">
                        {activeInitial}
                      </div>
                    </div>
                    <Link
                      href="/admin/pengguna"
                      onClick={() => setShowDropdown(false)}
                      title="Edit Profil"
                      className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-xs hover:bg-slate-50"
                    >
                      <Pencil className="w-2.5 h-2.5 text-slate-600" />
                    </Link>
                  </div>

                  {/* Account Name & Email */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate leading-tight">
                      {activeName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {displayEmail}
                    </p>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <Shield className="w-2.5 h-2.5" />
                        {profile?.role === "verifikator_k3l"
                          ? "Verifikator K3L"
                          : profile?.role === "admin_tps"
                          ? "Operator TPS"
                          : "Admin & Tim K3L"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapse button */}
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition shrink-0 cursor-pointer"
                  title="Tutup Menu"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Actions Divider */}
              <div className="border-t border-slate-100 mt-2.5 pt-2.5 space-y-1">
                {/* Logout from system */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-xs transition cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-600 flex items-center justify-center shrink-0 transition">
                    <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span>Logout dari akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
