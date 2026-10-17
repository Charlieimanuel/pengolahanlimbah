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

        {/* Bottom Actions: Logout */}
        <div className="flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-white/10">

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title="Keluar"
            className="flex items-center h-10 px-3.5 w-full rounded-xl hover:bg-red-500/20 text-white/70 hover:text-red-200 transition group cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-300 group-hover:scale-110 transition" />
            <span
              className={`text-xs ml-3 truncate transition-all duration-300 ${
                sidebarOpen ? "opacity-100" : "opacity-0 max-w-0 pointer-events-none"
              }`}
            >
              Keluar
            </span>
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

            <div className="pt-3 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="text-xs text-red-300 font-semibold"
              >
                Logout
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

      {/* Logout Modal Confirmation */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 border border-[#e2eae4] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Keluar dari Akun Admin?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Anda perlu login kembali untuk mengakses panel pengawasan K3L kampus POLIMDO.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {loggingOut ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
