"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", href: "#" },
  { id: "informasi", label: "Informasi & SOP", href: "#informasi" },
  { id: "statistik", label: "Statistik Neraca", href: "#statistik" },
  { id: "faq", label: "FAQ", href: "#faq" },
];

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("beranda");
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });
  const isClickingRef = React.useRef(false);
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updatePill = React.useCallback((tabId: string) => {
    if (!navContainerRef.current) return;
    const activeEl = navContainerRef.current.querySelector<HTMLElement>(`[data-nav-id="${tabId}"]`);
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    updatePill(activeTab);
  }, [activeTab, updatePill]);

  useEffect(() => {
    const handleResize = () => updatePill(activeTab);
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => updatePill(activeTab), 150);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [activeTab, updatePill]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);

          // Do NOT interrupt the sliding pill animation during click-triggered smooth scroll!
          if (!isClickingRef.current) {
            const scrollPos = window.scrollY + 140;
            const sections = ["faq", "statistik", "informasi"];
            let current = "beranda";
            for (const sectionId of sections) {
              const el = document.getElementById(sectionId);
              if (el && scrollPos >= el.offsetTop) {
                current = sectionId;
                break;
              }
            }
            setActiveTab((prev) => (prev !== current ? current : prev));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent, item: typeof NAV_ITEMS[0]) => {
    e.preventDefault();

    // Lock scrollspy during click smooth-scroll so intermediate sections don't cause stutter
    isClickingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 900);

    setActiveTab(item.id);
    updatePill(item.id);

    if (item.id === "beranda") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.history.pushState) {
        window.history.pushState(null, "", window.location.pathname);
      }
    } else {
      const target = document.getElementById(item.id);
      if (target) {
        const navHeight = 72;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPos, behavior: "smooth" });
        if (window.history.pushState) {
          window.history.pushState(null, "", `#${item.id}`);
        }
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const el = document.getElementById("lacak-tiket");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        const input = document.getElementById("track-input") as HTMLInputElement;
        if (input) {
          input.value = searchQuery;
          input.focus();
        }
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3 text-slate-800"
        : "bg-gradient-to-b from-black/50 via-black/20 to-transparent py-4 text-white"
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Calm-style rounded app icon & Brand */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            {/* Soft gradient rounded app icon like Calm logo */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.jpeg"
                alt="Logo POLIMDO"
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
            <div>
              <div
                className={`font-black text-[15px] leading-tight tracking-tight flex items-center gap-1.5 ${isScrolled ? "text-slate-900" : "text-white drop-shadow-sm"
                  }`}
              >
                <span>Pokoknya Itu No</span>
              </div>
              <div
                className={`text-[9px] tracking-[0.14em] uppercase font-bold ${isScrolled ? "text-slate-500" : "text-white/80 drop-shadow-xs"
                  }`}
              >
                POLITEKNIK NEGERI MANADO
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links with Sliding Active Pill Animation */}
          <nav
            ref={navContainerRef}
            className="hidden lg:flex items-center gap-1 relative bg-transparent p-1 rounded-full"
          >
            {/* Smooth Animated Sliding Pill Indicator perfectly aligned with active tab */}
            <span
              className={`absolute top-0 left-0 rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width,height] ${isScrolled
                ? "bg-emerald-50 border border-emerald-200/90 shadow-2xs"
                : "bg-white/20 backdrop-blur-md border border-white/30 shadow-xs"
                }`}
              style={{
                transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
                opacity: pillStyle.opacity,
              }}
              aria-hidden="true"
            />

            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-nav-id={item.id}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 select-none cursor-pointer active:scale-95 ${isActive
                    ? isScrolled
                      ? "text-emerald-800 font-bold"
                      : "text-white font-bold"
                    : isScrolled
                      ? "text-slate-600 hover:text-slate-900 font-medium"
                      : "text-white/80 hover:text-white font-medium drop-shadow-xs"
                    }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Quick Search + 2 Buttons: Masuk & Daftar */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search */}
          <form onSubmit={handleSearch} className="relative mr-1">
            <Search
              className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isScrolled ? "text-slate-400" : "text-white/70"
                }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Tiket..."
              className={`w-36 focus:w-48 transition-all text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none ${isScrolled
                ? "bg-slate-100 focus:bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
                : "bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/70 focus:bg-white/25 focus:ring-1 focus:ring-white"
                }`}
            />
          </form>

          {/* Button 1: Masuk */}
          <Link
            href="/login"
            className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 border ${isScrolled
              ? "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              : "border-white/50 text-white hover:bg-white/15 backdrop-blur-xs"
              }`}
          >
            Masuk
          </Link>

          {/* Button 2: Daftar */}
          <Link
            href="/daftar"
            className={`text-xs font-bold px-5 py-2 rounded-full transition-all duration-200 shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 ${isScrolled
              ? "bg-[#064e3b] text-white hover:bg-[#043d2e] shadow-emerald-950/10"
              : "bg-white text-slate-900 hover:bg-white/90 shadow-black/20"
              }`}
          >
            Daftar
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className={`p-1.5 rounded-lg border transition ${isScrolled
              ? "border-slate-200 text-slate-700 hover:bg-slate-100"
              : "border-white/30 text-white bg-black/20 backdrop-blur-sm"
              }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Tiket (contoh: B3-2026-001)"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </form>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleNavClick(e, item);
                  }}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive
                    ? "bg-emerald-50 text-[#064e3b] font-bold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-center px-4 py-2.5 rounded-full text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              onClick={() => setMenuOpen(false)}
              className="text-center px-4 py-2.5 rounded-full text-xs font-bold bg-[#064e3b] text-white shadow-xs"
            >
              Daftar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
