import React from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import HeroSection from "@/components/public/HeroSection";
import ServicesSection from "@/components/public/ServicesSection";
import RecentReportsTable from "@/components/public/RecentReportsTable";
import FlowStepsSection from "@/components/public/FlowStepsSection";
import NewsSection from "@/components/public/NewsSection";
import FaqSection from "@/components/public/FaqSection";
import CtaSection from "@/components/public/CtaSection";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata = {
  title: "SIM-LB3 POLIMDO — Pengelolaan & Pelaporan Limbah B3 Terintegrasi",
  description:
    "Portal resmi sistem informasi manajemen limbah B3 Politeknik Negeri Manado. Mewujudkan laboratorium dan bengkel vokasi yang hijau, aman, dan patuh regulasi lingkungan hidup (PP No. 22/2021)."
};

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 relative" style={{ backgroundColor: '#f8faf9' }}>
      {/* 1. Header Navigation */}
      <PublicNavbar />

      <main>
        {/* 2. Hero: Dark forest green — stays as-is */}
        <HeroSection />

        {/* === LIGHT SCROLL ZONE: bg near-white === */}
        <div style={{ backgroundColor: '#f8faf9' }}>
          {/* 3. 4 Pilar Layanan */}
          <ServicesSection />

          {/* 4. Statistik Neraca & Log TPS */}
          <RecentReportsTable />
        </div>

        {/* === DARK SCROLL ZONE: deep forest green (like FMI's dark video section) === */}
        <FlowStepsSection />

        {/* === BACK TO LIGHT ZONE === */}
        <div style={{ backgroundColor: '#f8faf9' }}>
          {/* 6. Pengumuman & Berita */}
          <NewsSection />

          {/* 7. FAQ */}
          <FaqSection />

          {/* 8. CTA & Emergency */}
          <CtaSection />
        </div>
      </main>

      {/* 9. Public Footer */}
      <PublicFooter />
    </div>
  );
}
