"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  X,
  LogOut,
  Pencil,
  Building2,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

interface UserProfile {
  id?: string;
  nama_lengkap: string;
  email?: string;
  nip_nim?: string;
  nama_lab?: string;
  jurusan?: string;
  role?: string;
}


export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; nama_limbah: string; status: string; created_at: string }>
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (user.email) setUserEmail(user.email);

          // 1. Fetch current logged-in user profile from database
          const { data, error } = await supabase
            .from("profiles")
            .select("id, nama_lengkap, email, nip_nim, nama_lab, jurusan, role")
            .eq("id", user.id)
            .maybeSingle();

          if (data && !error) {
            setProfile(data);
            if (data.email) setUserEmail(data.email);
          } else if (user.user_metadata?.full_name) {
            setProfile({
              nama_lengkap: user.user_metadata.full_name,
              email: user.email,
              nip_nim: user.user_metadata.id_number,
              nama_lab: user.user_metadata.lab,
              role: user.user_metadata.role || "unit_pelapor",
            });
          }

          // 2. Fetch notifikasi EKSKLUSIF tiket milik user ini
          const { data: myTickets } = await supabase
            .from("b3_tickets")
            .select("id, nama_limbah, status, created_at")
            .eq("pelapor_id", user.id)
            .order("created_at", { ascending: false })
            .limit(4);

          if (myTickets) {
            setNotifications(myTickets);
          }
        }
      } catch (e) {
        console.error("Gagal memuat profil user dari database:", e);
      }
    }
    loadUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAccountMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    if (showAccountMenu || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccountMenu, showNotifications]);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin logout dari sistem?")) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      } catch (e) {
        console.error("Logout gagal:", e);
        window.location.href = "/login";
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 1)
      .join("")
      .toUpperCase();
  };

  const activeName = profile?.nama_lengkap || "Pengguna SIM-LB3";
  const activeInitial = getInitials(activeName);
  const displayEmail =
    userEmail || profile?.email || `${activeName.toLowerCase().replace(/[^a-z0-9]/g, "")}@polimdo.ac.id`;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#e5ece6] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 transition-all">
      {/* Left: Global Search (Directly visible on all screens, matching Admin) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari lokasi, limbah ID, parameter, SOP..."
            className="w-full bg-[#f4f7f5] border border-[#dce8df] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#284533] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 ml-auto">

            {/* Notification Bell with Popup */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowAccountMenu(false);
                }}
                title="Notifikasi Sistem K3L"
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition cursor-pointer ${showNotifications
                  ? "bg-[#EAF2E5] text-[#3A6335]"
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Bell className="w-4 h-4 stroke-[1.8]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Notification Popup Dropdown — mobile safe viewport */}
              {showNotifications && (
                <div className="fixed inset-x-3 sm:inset-auto sm:right-0 top-14 sm:top-12 z-50 w-auto sm:w-96 max-w-md mx-auto sm:mx-0 bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-[#E5EBDD] animate-in fade-in zoom-in-95 duration-150 space-y-3 max-h-[80vh] overflow-y-auto">
                  {/* Popup Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E5EBDD]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#EAF2E5] text-[#3A6335] flex items-center justify-center shrink-0">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          Notifikasi Sistem
                        </h4>
                        <span className="text-[10px] text-slate-400">Pemberitahuan Terkini K3L</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#EAF2E5] text-[#3A6335] text-[10px] font-bold border border-[#A9C39B]">
                        {notifications.length} Info
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#F8FAF4] transition cursor-pointer"
                        title="Tutup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List (Eksklusif Akun Pengguna) */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                        <p className="font-bold text-slate-700">Belum Ada Notifikasi</p>
                        <p className="text-[11px] text-slate-400">
                          Pembaruan status laporan limbah B3 Anda akan muncul di sini.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-[#F8FAF4] border border-[#E5EBDD] hover:border-[#A9C39B] transition space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  n.status === "terverifikasi" || n.status === "masuk_tps"
                                    ? "bg-[#3A6335]"
                                    : "bg-amber-500 animate-pulse"
                                }`}
                              ></span>
                              Tiket {n.id.startsWith("#") ? n.id : `#${n.id}`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {n.created_at
                                ? new Date(n.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "Baru"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Laporan temuan limbah <strong>{n.nama_limbah}</strong>.
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="text-[#3A6335] font-semibold bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#A9C39B]">
                              {n.status === "masuk_tps"
                                ? "Masuk TPS POLIMDO"
                                : n.status === "terverifikasi"
                                ? "Terverifikasi K3L"
                                : "Menunggu Verifikasi"}
                            </span>
                            <Link
                              href="/user/riwayat-tiket"
                              onClick={() => setShowNotifications(false)}
                              className="text-[#3A6335] font-bold hover:underline"
                            >
                              Cek Status &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popup Footer */}
                  <div className="pt-2 border-t border-[#E5EBDD] flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        toast.success("Semua notifikasi ditandai dibaca");
                        setShowNotifications(false);
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Tandai semua dibaca
                    </button>
                    <Link
                      href="/user/riwayat-tiket"
                      onClick={() => setShowNotifications(false)}
                      className="text-[#3A6335] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Riwayat</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================
            USER PROFILE PILL: Separated Avatar Button & Dropdown Chevron
        ========================================================= */}
            <div className="relative" ref={dropdownRef}>
              {/* Pill Container containing separated Avatar button and Chevron button */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/60 rounded-full transition shadow-2xs">
                {/* Button 1: Avatar circle button (navigates to Profile) */}
                <Link
                  href="/user/profil-unit"
                  className="w-8 h-8 rounded-full bg-[#284533] text-white font-black text-[13px] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition"
                  title={`Buka Profil: ${activeName}`}
                >
                  {activeInitial}
                </Link>

                {/* Button 2: Separated Chevron-Down button (toggles Account Switcher Modal) */}
                <button
                  type="button"
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                  title="Ganti Akun & Pengaturan"
                  className="w-6 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer pr-1"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showAccountMenu ? "rotate-180 text-slate-900" : ""
                      }`}
                  />
                </button>
              </div>

              {/* =========================================================
              POPUP MODAL / DROPDOWN (Loaded from actual Supabase DB)
          ========================================================= */}
              {showAccountMenu && (
                <div className="fixed inset-x-3 sm:inset-auto sm:right-0 top-14 sm:top-12 z-50 w-auto sm:w-92 max-w-md mx-auto sm:mx-0 bg-white rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
                  {/* Top Row: Close 'X' button */}
                  <div className="flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => setShowAccountMenu(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Account Card (Sesuai Data Asli Database) */}
                  <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Large Avatar with Pencil Edit Badge */}
                      <div className="relative shrink-0">
                        <div className="w-13 h-13 rounded-full ring-2 ring-blue-500 p-0.5 bg-white">
                          <div className="w-full h-full rounded-full bg-[#0f172a] text-white font-extrabold text-lg flex items-center justify-center">
                            {activeInitial}
                          </div>
                        </div>
                        <Link
                          href="/user/profil-unit"
                          onClick={() => setShowAccountMenu(false)}
                          title="Edit Profil"
                          className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-xs hover:bg-slate-50"
                        >
                          <Pencil className="w-2.5 h-2.5 text-slate-600" />
                        </Link>
                      </div>

                      {/* Account Name & Email from Database (Tanpa kata 'Plus') */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 truncate leading-tight">
                          {activeName}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {displayEmail}
                        </p>
                        {profile?.nama_lab && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-slate-600 font-medium truncate max-w-full">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{profile.nama_lab}</span>
                          </span>
                        )}
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              profile?.role === "verifikator_k3l" || profile?.role === "admin_tps"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <Shield className="w-2.5 h-2.5" />
                            {profile?.role === "verifikator_k3l"
                              ? "Verifikator K3L"
                              : profile?.role === "admin_tps"
                              ? "Operator TPS"
                              : "Civitas Pelapor"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collapse button */}
                    <button
                      type="button"
                      onClick={() => setShowAccountMenu(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition shrink-0 cursor-pointer"
                      title="Tutup Menu"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>


                  {/* Bottom Actions Divider */}
                  <div className="border-t border-slate-100 mt-2.5 pt-2.5 space-y-1">

                    {/* Action 2: Logout from system */}
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
