"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import AdminNavbar from "@/components/layout/AdminNavbar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Boxes,
  FileSpreadsheet,
  Users,
  FileDown,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_MENU: NavItem[] = [
  {
    title: "Dashboard K3L",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Verifikasi Tiket",
    href: "/admin/verifikasi-tiket",
    icon: ClipboardCheck,
  },
  {
    title: "Logbook & TPS",
    href: "/admin/logbook-tps",
    icon: Boxes,
  },
  {
    title: "Neraca Limbah",
    href: "/admin/neraca-limbah",
    icon: FileSpreadsheet,
  },
  {
    title: "Civitas Pelapor",
    href: "/admin/pengguna",
    icon: Users,
  },
  {
    title: "Ekspor & KLHK",
    href: "/admin/laporan-ekspor",
    icon: FileDown,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Smooth sliding indicator state
  const navRef = useRef<HTMLElement>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);
  const [indicatorReady, setIndicatorReady] = useState(false);

  const updateIndicator = useCallback((overrideTop?: number) => {
    if (typeof overrideTop === "number") {
      setIndicatorTop(overrideTop);
      setIndicatorReady(true);
      return;
    }
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      setIndicatorTop(activeEl.offsetTop);
      setIndicatorReady(true);
    } else {
      setIndicatorReady(false);
    }
  }, []);

  useEffect(() => {
    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, sidebarOpen, updateIndicator]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await createClient().auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href ||
      (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href}
        data-href={item.href}
        data-active={isActive ? "true" : "false"}
        onClick={(e) => {
          updateIndicator(e.currentTarget.offsetTop);
          setMobileMenuOpen(false);
        }}
        title={item.title}
        className="relative z-10 flex items-center h-12 px-3.5 w-full cursor-pointer group rounded-l-2xl select-none"
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-all duration-300 ${
            isActive
              ? "stroke-[2.2] text-[#284533] scale-100"
              : "stroke-[1.8] text-white/65 group-hover:text-white group-hover:scale-110"
          }`}
        />
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
            sidebarOpen
              ? "max-w-[170px] opacity-100 translate-x-0 ml-3.5"
              : "max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none"
          }`}
        >
          <span
            className={`text-xs block truncate transition-colors duration-300 ${
              isActive
                ? "font-bold text-[#284533]"
                : "font-medium text-white/70 group-hover:text-white"
            }`}
          >
            {item.title}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#284533] text-slate-800 flex flex-col md:flex-row font-sans">
      {/* =========================================================
          DESKTOP SIDEBAR — Forest Green Dock with White Curved Active Notch
      ========================================================= */}
      <aside
        className={`hidden md:flex flex-col items-center justify-between shrink-0 bg-[#284533] sticky top-0 h-screen z-30 pt-4 pb-5 transition-[width] duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-[68px]"
        }`}
      >
        {/* Top Logo */}
        <div className="flex items-center w-full px-3.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            className="relative w-10 h-10 shrink-0 rounded-full bg-white/10 p-0.5 border border-white/25 hover:scale-105 active:scale-95 transition cursor-pointer shadow-md overflow-hidden flex items-center justify-center"
          >
            <Image
              src="/images/logo.jpeg"
              alt="Logo Politeknik Negeri Manado"
              width={38}
              height={38}
              className="w-full h-full object-cover rounded-full"
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
              sidebarOpen
                ? "max-w-[170px] opacity-100 translate-x-0 pl-3"
                : "max-w-0 opacity-0 -translate-x-2 pl-0 pointer-events-none"
            }`}
          >
            <span className="text-xs font-black tracking-tight text-white block truncate">
              K3L POLIMDO
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-300 block truncate">
              Modul Admin & TPS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          ref={navRef}
          className="relative flex flex-col items-center gap-1.5 w-full mt-6 mb-auto pl-2"
        >
          {/* Smooth Sliding Active Notch */}
          <div
            className={`absolute right-0 left-2 h-12 bg-white rounded-l-2xl pointer-events-none z-0 ${
              indicatorReady
                ? "transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                : "opacity-0"
            }`}
            style={{
              top: indicatorTop !== null ? `${indicatorTop}px` : "0px",
              opacity: indicatorReady ? 1 : 0,
            }}
          >
            {/* Top concave notch */}
            <span
              className="absolute -top-[22px] right-0 w-[22px] h-[22px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 0 0, transparent 22px, #ffffff 22.5px)",
              }}
            />
            {/* Bottom concave notch */}
            <span
              className="absolute -bottom-[22px] right-0 w-[22px] h-[22px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 0 100%, transparent 22px, #ffffff 22.5px)",
              }}
            />
          </div>

          {ADMIN_MENU.map((item) => renderNavItem(item))}
        </nav>

        {/* Bottom Exit / Logout button */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title="Keluar dari Akun"
            className="flex items-center h-11 text-white/60 hover:text-rose-300 transition-all duration-300 group cursor-pointer px-3.5 w-full"
          >
            <LogOut className="w-5 h-5 shrink-0 stroke-[1.8] group-hover:scale-110 transition-transform" />
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                sidebarOpen
                  ? "max-w-[170px] opacity-100 translate-x-0 ml-3.5"
                  : "max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none"
              }`}
            >
              <span className="text-xs font-semibold text-rose-300 block truncate">
                Keluar
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MOBILE TOP BAR (Appears on small screens < md)
      ========================================================= */}
      <div className="md:hidden bg-[#284533] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo.jpeg"
            alt="Logo Politeknik Negeri Manado"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border border-white/20 object-cover"
          />
          <div>
            <div className="text-xs font-bold leading-tight">Admin K3L POLIMDO</div>
            <div className="text-[10px] text-emerald-300">Pengelolaan Limbah B3</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[#284533] text-white p-5 rounded-t-3xl border-t border-white/20 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-bold text-sm">Menu Navigasi Admin K3L</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-white/10 text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ADMIN_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition ${
                      isActive
                        ? "bg-white text-[#284533] shadow-md"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2.5 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs text-red-200 font-semibold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-300" />
                <span>Logout dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN CONTENT AREA (White Container with Notch Background)
      ========================================================= */}
      <div className="flex-1 flex flex-col bg-white md:rounded-l-3xl overflow-hidden shadow-2xl relative z-10">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[#fbfcfb]">
          <div key={pathname} className="page-transition-enter w-full space-y-5 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* =========================================================
          LOGOUT CONFIRMATION MODAL - Eco-Living Nature Theme
      ========================================================= */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 bg-[#16271c]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !loggingOut && setShowLogoutModal(false)}
        >
          <div
            className="relative overflow-hidden bg-[#F8FAF4] border border-[#E5EBDD] rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_25px_60px_-15px_rgba(40,69,51,0.35)] space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle organic leaf silhouette watermark */}
            <div className="absolute -top-10 -right-10 pointer-events-none opacity-[0.07] text-[#3A6335]">
              <svg width="140" height="140" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 0 C70 30 90 40 100 70 C70 70 50 90 20 100 C20 70 30 50 50 0 Z" />
              </svg>
            </div>

            {/* Icon Box: Terracotta & Wood Tone with Sage accents */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-[#F2EAE1] border border-[#E0D0C1] p-1 flex items-center justify-center shadow-xs">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#A64B3E] to-[#915F38] text-white flex items-center justify-center shadow-md shadow-[#915F38]/25">
                <LogOut className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-1.5 relative z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF2E5] text-[#3A6335] text-[10px] font-bold border border-[#A9C39B]/70 tracking-wider">
                KONFIRMASI SESI
              </span>
              <h3 className="text-lg font-bold text-[#1E3526] tracking-tight">
                Konfirmasi Keluar Akun
              </h3>
              <p className="text-xs text-[#526656] leading-relaxed">
                Apakah Anda yakin ingin keluar? Pastikan data verifikasi dan pencatatan TPS sudah tersimpan dengan aman.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 relative z-10">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="bg-white hover:bg-[#EAF2E5] text-[#3A6335] border border-[#D2E2CB] font-bold text-xs py-3 rounded-xl transition duration-200 cursor-pointer shadow-xs active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="bg-[#A64B3E] hover:bg-[#8F3E32] text-white font-bold text-xs py-3 rounded-xl transition duration-200 cursor-pointer shadow-md shadow-[#A64B3E]/25 disabled:opacity-70 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {loggingOut ? (
                  <span>Mengeluarkan...</span>
                ) : (
                  <span>Ya, Keluar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
