"use client";

import React from "react";

const steps = [
  {
    step: "01",
    title: "Identifikasi & Dokumentasi",
    desc: "Laboran atau mahasiswa mengidentifikasi limbah yang dihasilkan, jenis zat, serta perkiraan volumenya.",
    role: "Pelapor Lab / Bengkel"
  },
  {
    step: "02",
    title: "Pengisian Form Laporan",
    desc: "Mengisi formulir digital di SIM-LB3 dengan melampirkan foto kemasan dan lokasi penyimpanan saat ini.",
    role: "Sivitas Akademika"
  },
  {
    step: "03",
    title: "Verifikasi Tim K3L",
    desc: "Petugas K3L memeriksa kebenaran data, klasifikasi bahaya zat, dan kelayakan pengemasan.",
    role: "Tim Pengurus K3L"
  },
  {
    step: "04",
    title: "Validasi & Terbit Tiket",
    desc: "Laporan diverifikasi secara resmi dan sistem menerbitkan Nomor Tiket sebagai bukti pelaporan.",
    role: "Sistem SIM-LB3"
  },
  {
    step: "05",
    title: "Pembukuan Neraca Limbah", 
    desc: "Data volume dan jenis limbah otomatis dibukukan ke dalam database neraca limbah digital kampus POLIMDO.",
    role: "Database K3L POLIMDO"
  }
];

export default function FlowStepsSection() {
  return (
    /* Dark forest green section — FMI "dark video section" equivalent */
    <section
      id="alur"
      className="py-24 sm:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#011a13' }}
    >
      {/* Subtle gradient ambient overlay (like FMI's bg-linear-to-t) */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{
          background: 'linear-gradient(180deg, rgba(6,78,59,0.5) 0%, rgba(1,26,19,0) 40%, rgba(1,26,19,0.4) 100%)'
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        {/* Header — two-column layout like FMI (heading left, desc right) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>ALUR SISTEMATIS</span>
            </div>
            {/* Gradient heading text (fmi-industries gradient-text style adapted) */}
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight pb-1"
              style={{
                backgroundImage: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 30%, #a7f3d0 70%, #ffffff 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              5 Langkah Alur Pelaporan Limbah
            </h2>
          </div>
          <p className="text-emerald-100/70 text-sm sm:text-base leading-relaxed max-w-lg lg:text-right">
            Tahapan terstandarisasi dari penemuan limbah di laboratorium/bengkel hingga verifikasi data dan pembukuan resmi ke neraca limbah digital kampus.
          </p>
        </div>

        {/* Steps — horizontal open layout, white on dark (like FMI industry links on dark bg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative">
          {/* Subtle horizontal rule */}
          <div className="hidden lg:block absolute top-9 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(110,231,183,0.25), transparent)' }}
          />

          {steps.map((item, i) => (
            <div
              key={item.step}
              className="flex flex-col justify-between group relative z-10 border-b border-white/10 pb-8 lg:border-b-0 lg:pb-0"
            >
              <div>
                {/* Step node */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 border-emerald-700 text-emerald-300 group-hover:bg-emerald-600 group-hover:border-emerald-500 group-hover:text-white transition-all bg-white/5">
                    {item.step}
                  </div>
                </div>

                {/* Role badge */}
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
                  {item.role}
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-3 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-emerald-100/60 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Bottom line expand on hover (FMI style) */}
              <div className="mt-6 h-px bg-white/10 relative overflow-hidden">
                <div className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                  style={{ background: 'linear-gradient(to right, #34d399, #064e3b)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
