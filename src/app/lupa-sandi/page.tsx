"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Shield,
    CheckCircle2,
    Eye,
    EyeOff,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    Lock,
    KeyRound,
    RefreshCw,
} from "lucide-react";

type RecoveryStep = "request" | "verify" | "reset";

export default function ForgotPasswordPage() {
    const router = useRouter();

    // State Alur Pemulihan Kata Sandi (3 Tahap)
    const [step, setStep] = useState<RecoveryStep>("request");
    const [idNumber, setIdNumber] = useState("");
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState(false);

    // State untuk Smooth Dissolve Transition & Interactive Astra 3D Tilt
    const [isLeaving, setIsLeaving] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // Prefetch halaman login dan daftar agar langsung terganti tanpa jeda
    useEffect(() => {
        router.prefetch("/login");
        router.prefetch("/daftar");
    }, [router]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isLeaving) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
        setTilt({ x, y });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // Animasi menghilang halus (220ms) dan langsung terganti ke halaman tujuan
    const handleSmoothNavigate = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        if (isLeaving) return;
        setIsLeaving(true);
        setTimeout(() => {
            router.push(href);
        }, 220);
    };

    // Handler Tahap 1: Kirim Permintaan Kode Pemulihan
    const handleRequestRecovery = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorMessage(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: "request", idNumber, email }),
            });

            const result = await res.json();
            if (!res.ok || result.error) {
                setErrorMessage(result.error || "Data akun tidak ditemukan dalam sistem SIM-LB3.");
                setLoading(false);
                return;
            }

            if (result.email) {
                setEmail(result.email);
            }

            setLoading(false);
            setStep("verify");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi server.";
            setErrorMessage(msg);
            setLoading(false);
        }
    };

    // Handler Tahap 2: Verifikasi Kode OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (otpCode.trim().length < 6) {
            setErrorMessage("Masukkan 6 digit kode verifikasi yang dikirimkan ke email Anda.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: "verify", email, otpCode }),
            });

            const result = await res.json();
            if (!res.ok || result.error) {
                setErrorMessage(result.error || "Kode otorisasi tidak valid atau telah kadaluarsa.");
                setLoading(false);
                return;
            }

            setLoading(false);
            setStep("reset");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal memverifikasi kode otorisasi.";
            setErrorMessage(msg);
            setLoading(false);
        }
    };

    // Handler Tahap 3: Simpan Kata Sandi Baru
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (newPassword !== confirmPassword) {
            setErrorMessage("Kata sandi baru dan konfirmasi kata sandi tidak cocok!");
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage("Kata sandi minimal 6 karakter.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: "reset",
                    email,
                    otpCode,
                    newPassword,
                }),
            });

            const result = await res.json();
            if (!res.ok || result.error) {
                setErrorMessage(result.error || "Gagal memperbarui kata sandi.");
                setLoading(false);
                return;
            }

            setLoading(false);
            setSuccessModal(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui kata sandi.";
            setErrorMessage(msg);
            setLoading(false);
        }
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#f5f8f7] font-sans select-none relative"
        >
            {/* =========================================================================
          FLUID DISSOLVE & INSTANT MORPH ANIMATION ENGINE (TIDAK KAKU)
      ========================================================================= */}
            <style>{`
        @keyframes panelFluidAppear {
          0% {
            opacity: 0;
            transform: scale(0.975) translateY(8px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
            filter: blur(0px);
          }
        }
        @keyframes panelFluidVanish {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0px);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: scale(0.965) translateY(-6px);
            filter: blur(10px);
          }
        }

        @keyframes compFluidIn {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes compFluidOut {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
            filter: blur(8px);
          }
        }

        .panel-fluid-in {
          animation: panelFluidAppear 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity, filter;
        }
        .panel-fluid-out {
          animation: panelFluidVanish 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
          will-change: transform, opacity, filter;
          pointer-events: none;
        }

        .comp-fluid-in {
          opacity: 0;
          animation: compFluidIn 0.46s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: var(--d, 0ms);
          will-change: transform, opacity, filter;
        }
        .comp-fluid-out {
          animation: compFluidOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
          animation-delay: var(--d-exit, 0ms);
          will-change: transform, opacity, filter;
        }

        /* Astra Quantum Core Animations */
        @keyframes orbitCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitCCW {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes astraCorePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(16, 185, 129, 0.55)); }
          50% { transform: scale(1.07); filter: drop-shadow(0 0 28px rgba(52, 211, 153, 0.95)); }
        }
        @keyframes astraLaserScan {
          0%, 100% { transform: translateY(-38px); opacity: 0.25; }
          50% { transform: translateY(42px); opacity: 0.95; }
        }
        @keyframes streamFlow {
          to { stroke-dashoffset: -40; }
        }
        .astra-orbit-cw {
          animation: orbitCW 18s linear infinite;
          transform-origin: 250px 115px;
        }
        .astra-orbit-ccw {
          animation: orbitCCW 12s linear infinite;
          transform-origin: 250px 115px;
        }
        .astra-core-pulse {
          animation: astraCorePulse 3.5s ease-in-out infinite;
          transform-origin: 250px 115px;
        }
        .astra-laser {
          animation: astraLaserScan 2.8s ease-in-out infinite;
        }
        .astra-stream {
          animation: streamFlow 1s linear infinite;
        }
      `}</style>

            {/* =========================================================================
          LEFT SIDE (SWAPPED): POLIMDO SIM-LB3 PASSWORD RECOVERY FORM (~45%)
      ========================================================================= */}
            <div
                className={`w-full lg:w-[46%] xl:w-[44%] h-full bg-white flex flex-col justify-center px-6 sm:px-10 xl:px-12 py-6 overflow-y-auto relative border-r border-slate-200/70 ${isLeaving ? "panel-fluid-out" : "panel-fluid-in"
                    }`}
            >
                <div className="max-w-[420px] w-full mx-auto my-auto space-y-4 sm:space-y-5">
                    {/* Component 1: Logo & Institution Header */}
                    <div
                        style={{ "--d": "15ms", "--d-exit": "0ms" } as React.CSSProperties}
                        className={`flex items-center gap-3 ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"}`}
                    >
                        <div className="w-11 h-11 rounded-xl bg-[#064e3b] flex items-center justify-center shrink-0 shadow-xs border border-emerald-700/40">
                            <Shield className="w-6 h-6 text-emerald-300" />
                        </div>

                        <div>
                            <div className="text-sm sm:text-[15px] font-extrabold text-slate-900 leading-tight">
                                Unit Pelaksana Teknis K3 & Lingkungan
                            </div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                Politeknik Negeri Manado — Portal SIM-LB3
                            </div>
                        </div>
                    </div>

                    {/* Component 2: Title & Subtitle */}
                    <div
                        style={{ "--d": "40ms", "--d-exit": "10ms" } as React.CSSProperties}
                        className={isLeaving ? "comp-fluid-out" : "comp-fluid-in"}
                    >
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Pemulihan Kata Sandi
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {step === "request" &&
                                "Masukkan identitas NIP/NIDN/NIM dan email kampus Anda untuk menerima kode otorisasi reset kata sandi."}
                            {step === "verify" &&
                                "Masukkan 6 digit kode keamanan yang telah dikirimkan ke alamat email institusi Anda."}
                            {step === "reset" &&
                                "Silakan buat kata sandi baru untuk mengamankan kembali akses akun SIM-LB3 Anda."}
                        </p>
                    </div>



                    {/* =================================================================
              TAHAP 1: FORM IDENTIFIKASI NIP/NIM & EMAIL KAMPUS
          ================================================================= */}
                    {step === "request" && (
                        <form onSubmit={handleRequestRecovery} className="space-y-3.5 pt-1">
                            {/* Input: NIP / NIDN / NIM */}
                            <div
                                style={{ "--d": "90ms", "--d-exit": "30ms" } as React.CSSProperties}
                                className={isLeaving ? "comp-fluid-out" : "comp-fluid-in"}
                            >
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                    NIP / NIDN / NIM <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        placeholder="Masukkan nomor identitas sivitas"
                                        className="w-full bg-[#edf3f0] hover:bg-[#e7efe9] focus:bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-3.5 py-3 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition placeholder-slate-400 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Input: Email Kampus */}
                            <div
                                style={{ "--d": "115ms", "--d-exit": "40ms" } as React.CSSProperties}
                                className={isLeaving ? "comp-fluid-out" : "comp-fluid-in"}
                            >
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                    Email Kampus Terdaftar <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nama@polimdo.ac.id"
                                        className="w-full bg-[#edf3f0] hover:bg-[#e7efe9] focus:bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-3.5 py-3 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition placeholder-slate-400 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                                    <span className="font-semibold">{errorMessage}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div
                                style={{ "--d": "140ms", "--d-exit": "50ms" } as React.CSSProperties}
                                className={isLeaving ? "comp-fluid-out" : "comp-fluid-in"}
                            >
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-xs transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-1"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            <span>Memverifikasi Data...</span>
                                        </div>
                                    ) : (
                                        <span>Kirim Kode Pemulihan</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* =================================================================
              TAHAP 2: FORM VERIFIKASI KODE OTP KEAMANAN
          ================================================================= */}
                    {step === "verify" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-3.5 pt-1">
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-[11px] text-slate-700 leading-relaxed">
                                Kode otorisasi 6-digit telah dikirimkan ke{" "}
                                <span className="font-bold text-emerald-900">{email}</span>.
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                    Kode Verifikasi OTP <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="Contoh: 849201"
                                        className="w-full bg-[#edf3f0] hover:bg-[#e7efe9] focus:bg-white text-slate-900 text-sm tracking-[0.25em] pl-10 pr-3.5 py-3 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition placeholder-slate-400 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                                    <span className="font-semibold">{errorMessage}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => setStep("request")}
                                    className="text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer"
                                >
                                    ← Ubah Email / NIP
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleRequestRecovery()}
                                    className="text-emerald-800 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                                    <span>Kirim Ulang Kode</span>
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-xs transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        <span>Memvalidasi Kode...</span>
                                    </div>
                                ) : (
                                    <span>Verifikasi & Lanjutkan</span>
                                )}
                            </button>
                        </form>
                    )}

                    {/* =================================================================
              TAHAP 3: FORM ATUR ULANG KATA SANDI BARU
          ================================================================= */}
                    {step === "reset" && (
                        <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                    Kata Sandi Baru <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full bg-[#edf3f0] hover:bg-[#e7efe9] focus:bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition placeholder-slate-400 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                    Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi kata sandi baru"
                                        className="w-full bg-[#edf3f0] hover:bg-[#e7efe9] focus:bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition placeholder-slate-400 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                                    <span className="font-semibold">{errorMessage}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-xs transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan Kata Sandi...</span>
                                    </div>
                                ) : (
                                    <span>Simpan Kata Sandi Baru</span>
                                )}
                            </button>
                        </form>
                    )}



                    {/* Component 5: Footer Navigasi ke Login & Daftar */}
                    <div
                        style={{ "--d": "195ms", "--d-exit": "70ms" } as React.CSSProperties}
                        className={`pt-1 text-center text-xs space-y-2.5 ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                            }`}
                    >
                        <div className="text-slate-500 text-[11px]">
                            Sudah mengingat kata sandi Anda?{" "}
                            <Link
                                href="/login"
                                onClick={(e) => handleSmoothNavigate(e, "/login")}
                                className="font-bold text-emerald-800 hover:underline"
                            >
                                Masuk ke Sistem
                            </Link>
                        </div>

                        <div>
                            <Link
                                href="/login"
                                onClick={(e) => handleSmoothNavigate(e, "/login")}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#064e3b] font-medium transition"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Kembali ke Halaman Login</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile-only bottom copyright */}
                <div className="lg:hidden text-center text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    Copyright © 2026 Politeknik Negeri Manado · UPT K3L
                </div>
            </div>

            {/* =========================================================================
          RIGHT SIDE: POLIMDO K3L BRANDING, MAP WATERMARK, MOTTO, ASTRA 3D & COPYRIGHT (~55%)
          DIBUAT RATA KANAN (items-end, text-right, justify-end) SEPERTI HALAMAN REGISTER
      ========================================================================= */}
            <div
                className={`hidden lg:flex lg:w-[54%] xl:w-[56%] h-full flex-col justify-between items-end text-right py-6 xl:py-10 lg:pl-8 xl:pl-12 lg:pr-14 xl:pr-24 relative bg-gradient-to-bl from-[#f8faf9] via-[#edf3f0] to-[#e7efe9] shrink-0 overflow-hidden ${isLeaving ? "panel-fluid-out" : "panel-fluid-in"
                    }`}
            >
                {/* Ambient Astra Neural Aurora Glows */}
                <div
                    className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none transition-transform duration-300"
                    style={{ transform: `translate(${tilt.x * 2}px, ${tilt.y * -2}px)` }}
                />
                <div
                    className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none transition-transform duration-300"
                    style={{ transform: `translate(${tilt.x * -2.5}px, ${tilt.y * 2.5}px)` }}
                />

                {/* Dotted Map Graphic Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 overflow-hidden">
                    <svg
                        className="w-[125%] h-[125%] text-emerald-950"
                        viewBox="0 0 1000 500"
                        fill="currentColor"
                    >
                        {/* Dotted Indonesian Archipelago matrix */}
                        <g opacity="0.85">
                            {/* Sumatra */}
                            <circle cx="160" cy="180" r="3" /><circle cx="170" cy="185" r="3" /><circle cx="180" cy="195" r="3.5" /><circle cx="190" cy="205" r="3" /><circle cx="200" cy="220" r="4" /><circle cx="210" cy="235" r="3.5" /><circle cx="220" cy="250" r="4" /><circle cx="230" cy="265" r="3" /><circle cx="240" cy="280" r="3.5" /><circle cx="250" cy="295" r="3" /><circle cx="180" cy="180" r="2.5" /><circle cx="190" cy="190" r="3" /><circle cx="200" cy="205" r="3.5" /><circle cx="210" cy="215" r="3" /><circle cx="225" cy="235" r="3.5" /><circle cx="235" cy="250" r="3" /><circle cx="245" cy="270" r="3.5" />
                            {/* Java */}
                            <circle cx="280" cy="330" r="3" /><circle cx="295" cy="332" r="3" /><circle cx="310" cy="334" r="3.5" /><circle cx="325" cy="335" r="3" /><circle cx="340" cy="336" r="3.5" /><circle cx="355" cy="338" r="3" /><circle cx="370" cy="340" r="3.5" /><circle cx="385" cy="341" r="3" /><circle cx="400" cy="342" r="3.5" /><circle cx="415" cy="343" r="3" /><circle cx="430" cy="344" r="3" />
                            {/* Kalimantan */}
                            <circle cx="330" cy="190" r="3.5" /><circle cx="345" cy="185" r="3" /><circle cx="360" cy="180" r="4" /><circle cx="375" cy="185" r="3.5" /><circle cx="390" cy="190" r="3" /><circle cx="330" cy="205" r="3" /><circle cx="345" cy="200" r="4" /><circle cx="360" cy="200" r="4" /><circle cx="375" cy="205" r="3.5" /><circle cx="390" cy="210" r="3" /><circle cx="340" cy="220" r="3.5" /><circle cx="355" cy="220" r="4" /><circle cx="370" cy="225" r="3.5" /><circle cx="385" cy="230" r="3" /><circle cx="350" cy="240" r="3" /><circle cx="365" cy="245" r="3.5" /><circle cx="380" cy="250" r="3" />
                            {/* Sulawesi & Manado Focus */}
                            <circle cx="450" cy="180" r="3" /><circle cx="460" cy="175" r="3.5" /><circle cx="470" cy="170" r="4" /><circle cx="485" cy="155" r="4.5" /><circle cx="495" cy="145" r="4" /><circle cx="465" cy="190" r="3" /><circle cx="460" cy="205" r="3.5" /><circle cx="475" cy="210" r="3" /><circle cx="485" cy="215" r="3.5" /><circle cx="460" cy="225" r="3" /><circle cx="465" cy="240" r="3.5" /><circle cx="455" cy="255" r="3" /><circle cx="475" cy="250" r="3" /><circle cx="485" cy="260" r="3" />
                            {/* Maluku & Papua */}
                            <circle cx="530" cy="190" r="3" /><circle cx="545" cy="200" r="3" /><circle cx="535" cy="220" r="3" /><circle cx="550" cy="230" r="3.5" /><circle cx="610" cy="190" r="4" /><circle cx="625" cy="195" r="3.5" /><circle cx="640" cy="200" r="4" /><circle cx="655" cy="205" r="3.5" /><circle cx="670" cy="210" r="4" /><circle cx="685" cy="215" r="3" /><circle cx="620" cy="215" r="3.5" /><circle cx="635" cy="220" r="4" /><circle cx="650" cy="225" r="3.5" /><circle cx="665" cy="230" r="4" /><circle cx="680" cy="235" r="3.5" /><circle cx="630" cy="240" r="3" /><circle cx="645" cy="245" r="3.5" /><circle cx="660" cy="250" r="3" /><circle cx="675" cy="255" r="3.5" />
                        </g>
                    </svg>
                </div>

                {/* Component 1: Top Contact Header Bar (Rata Kanan) */}
                <div
                    style={{ "--d": "20ms", "--d-exit": "0ms" } as React.CSSProperties}
                    className={`relative z-10 w-full flex items-center justify-end gap-5 text-[11px] text-slate-600 font-medium ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                        }`}
                >
                    <a
                        href="tel:0431811568"
                        className="flex items-center gap-1.5 hover:text-emerald-800 transition"
                    >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>(0431) 811-911</span>
                    </a>

                    <a
                        href="mailto:k3@polimdo.ac.id"
                        className="flex items-center gap-1.5 hover:text-emerald-800 transition"
                    >
                        <Mail className="w-3.5 h-3.5 text-emerald-700" />
                        <span>k3@polimdo.ac.id</span>
                    </a>

                    <div className="hidden xl:flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                        <span className="truncate max-w-xs">
                            Gedung Terpadu POLIMDO, Buha, Manado 95252
                        </span>
                    </div>
                </div>

                {/* Center Main Headline, Motto & ASTRA-CLASS 3D QUANTUM B3 BIOREACTOR (Rata Kanan) */}
                <div className="relative z-10 my-auto py-2 w-full flex flex-col items-end justify-center text-right">
                    {/* Component 2: Main Headline */}
                    <h1
                        style={{ "--d": "60ms", "--d-exit": "15ms" } as React.CSSProperties}
                        className={`text-2xl sm:text-3xl xl:text-[36px] font-black text-[#064e3b] leading-[1.18] tracking-tight text-right ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                            }`}
                    >
                        Sistem Informasi Manajemen
                        <br />
                        Pengelolaan Limbah B3
                        <br />
                        Politeknik Negeri Manado
                    </h1>

                    {/* Component 3: Motto */}
                    <div
                        style={{ "--d": "100ms", "--d-exit": "30ms" } as React.CSSProperties}
                        className={`mt-3 text-xs xl:text-[13px] font-extrabold tracking-[0.08em] uppercase text-slate-700 text-right ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                            }`}
                    >
                        BIJAK KELOLA LIMBAH, LAB AMAN, KAMPUS HIJAU BERKELANJUTAN
                    </div>

                    {/* Component 4: ASTRA-CLASS 3D INTERACTIVE HOLOGRAPHIC B3 QUANTUM CORE (Rata Kanan) */}
                    <div
                        style={{ "--d": "140ms", "--d-exit": "45ms", perspective: "1200px" } as React.CSSProperties}
                        className={`mt-5 xl:mt-7 ml-auto relative w-full max-w-[500px] select-none ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                            }`}
                    >
                        <div
                            className="relative transition-transform duration-200 ease-out"
                            style={{
                                transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <svg
                                viewBox="0 0 520 235"
                                className="w-full h-auto max-h-[205px] xl:max-h-[230px] overflow-visible drop-shadow-[0_14px_24px_rgba(6,78,59,0.14)]"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="astraPlatformTopForgot" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="55%" stopColor="#ecfdf5" />
                                        <stop offset="100%" stopColor="#a7f3d0" />
                                    </linearGradient>
                                    <linearGradient id="astraPlatformSideLForgot" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#047857" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                    <linearGradient id="astraPlatformSideRForgot" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#064e3b" />
                                        <stop offset="100%" stopColor="#047857" />
                                    </linearGradient>
                                    <radialGradient id="astraCoreGlowForgot" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
                                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
                                    </radialGradient>
                                    <linearGradient id="astraGlassChamberForgot" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.55" />
                                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                                    </linearGradient>
                                    <linearGradient id="hazardPodGradForgot" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#fbbf24" />
                                        <stop offset="100%" stopColor="#d97706" />
                                    </linearGradient>
                                    <linearGradient id="ecoPodGradForgot" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>

                                {/* 1. 3D ISOMETRIC QUANTUM DECK & HOLOGRAPHIC GRID */}
                                <polygon points="250,228 470,154 250,82 30,154" fill="#064e3b" opacity="0.14" />
                                <polygon
                                    points="250,206 460,136 250,66 40,136"
                                    fill="url(#astraPlatformTopForgot)"
                                    stroke="#6ee7b7"
                                    strokeWidth="1.5"
                                />
                                <polygon points="40,136 250,206 250,218 40,148" fill="url(#astraPlatformSideLForgot)" />
                                <polygon points="460,136 250,206 250,218 460,148" fill="url(#astraPlatformSideRForgot)" />

                                <g stroke="#059669" strokeOpacity="0.15" strokeWidth="1">
                                    <line x1="92" y1="118" x2="302" y2="188" />
                                    <line x1="145" y1="101" x2="355" y2="171" />
                                    <line x1="197" y1="83" x2="407" y2="153" />
                                    <line x1="407" y1="118" x2="197" y2="188" />
                                    <line x1="355" y1="101" x2="145" y2="171" />
                                    <line x1="302" y1="83" x2="92" y2="153" />
                                </g>

                                {/* 2. HIGH-SPEED QUANTUM FLUID CONDUITS */}
                                <path d="M 135 134 Q 185 152 215 138" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" />
                                <path
                                    d="M 135 134 Q 185 152 215 138"
                                    stroke="#f59e0b"
                                    strokeWidth="3.5"
                                    strokeDasharray="8 6"
                                    strokeLinecap="round"
                                    className="astra-stream"
                                />

                                <path d="M 285 128 Q 330 112 372 126" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" />
                                <path
                                    d="M 285 128 Q 330 112 372 126"
                                    stroke="#10b981"
                                    strokeWidth="3.5"
                                    strokeDasharray="8 6"
                                    strokeLinecap="round"
                                    className="astra-stream"
                                />

                                {/* 3. LEFT NODE: 3D B3 CONTAINMENT CAPSULE */}
                                <g>
                                    <ellipse cx="118" cy="136" rx="28" ry="11" fill="#064e3b" opacity="0.22" />
                                    <path d="M 94,88 L 94,132 A 24,9.5 0 0,0 142,132 L 142,88 Z" fill="url(#hazardPodGradForgot)" />
                                    <path d="M 94,104 A 24,9.5 0 0,0 142,104" stroke="#78350f" strokeWidth="2" opacity="0.6" />
                                    <path d="M 94,119 A 24,9.5 0 0,0 142,119" stroke="#78350f" strokeWidth="2" opacity="0.6" />
                                    <ellipse cx="118" cy="88" rx="24" ry="9.5" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />
                                    <polygon points="118,54 131,67 118,80 105,67" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                                    <text x="118" y="70" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="900">
                                        B3
                                    </text>
                                </g>

                                {/* 4. CENTERPIECE: ASTRA 3D GYROSCOPIC BIOREACTOR CORE */}
                                <circle cx="250" cy="115" r="68" fill="url(#astraCoreGlowForgot)" />
                                <path d="M 204,142 L 204,154 A 46,17 0 0,0 296,154 L 296,142 Z" fill="#064e3b" />
                                <ellipse cx="250" cy="142" rx="46" ry="17" fill="#047857" stroke="#34d399" strokeWidth="1.5" />

                                <g className="astra-orbit-cw">
                                    <ellipse cx="250" cy="115" rx="58" ry="24" stroke="#10b981" strokeWidth="1.6" strokeDasharray="10 6" />
                                    <circle cx="192" cy="115" r="4" fill="#34d399" />
                                    <circle cx="308" cy="115" r="4" fill="#059669" />
                                </g>

                                <g className="astra-orbit-ccw">
                                    <ellipse
                                        cx="250"
                                        cy="115"
                                        rx="48"
                                        ry="38"
                                        stroke="#059669"
                                        strokeWidth="1.2"
                                        strokeDasharray="6 8"
                                        opacity="0.7"
                                    />
                                    <circle cx="250" cy="77" r="3.5" fill="#fbbf24" />
                                    <circle cx="250" cy="153" r="3.5" fill="#10b981" />
                                </g>

                                <path
                                    d="M 212,66 L 212,140 A 38,14 0 0,0 288,140 L 288,66 Z"
                                    fill="url(#astraGlassChamberForgot)"
                                    stroke="#6ee7b7"
                                    strokeWidth="1.5"
                                />

                                <g className="astra-core-pulse">
                                    <circle cx="250" cy="108" r="21" fill="#064e3b" />
                                    <circle cx="250" cy="108" r="17" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
                                    <polygon
                                        points="250,96 260,102 260,114 250,120 240,114 240,102"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                    <circle cx="250" cy="108" r="4" fill="#ffffff" />
                                </g>

                                <g className="astra-laser">
                                    <ellipse
                                        cx="250"
                                        cy="105"
                                        rx="40"
                                        ry="14.5"
                                        stroke="#34d399"
                                        strokeWidth="2.5"
                                        strokeDasharray="12 4"
                                    />
                                </g>

                                <ellipse cx="250" cy="66" rx="38" ry="14" fill="#065f46" stroke="#6ee7b7" strokeWidth="1.5" />
                                <ellipse cx="250" cy="64" rx="20" ry="7" fill="#34d399" />

                                {/* 5. RIGHT NODE: 3D ECO-SYNTHESIS PURIFIED MODULE */}
                                <g>
                                    <ellipse cx="384" cy="132" rx="26" ry="10" fill="#064e3b" opacity="0.22" />
                                    <path d="M 362,88 L 362,128 A 22,8.5 0 0,0 406,128 L 406,88 Z" fill="url(#ecoPodGradForgot)" />
                                    <ellipse cx="384" cy="88" rx="22" ry="8.5" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" />
                                    <circle cx="384" cy="62" r="14" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                                    <path
                                        d="M 378,62 L 382,66 L 391,57"
                                        stroke="#6ee7b7"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Component 5: Bottom Copyright Badge (Rata Kanan) */}
                <div
                    style={{ "--d": "180ms", "--d-exit": "60ms" } as React.CSSProperties}
                    className={`relative z-10 w-full flex justify-end ${isLeaving ? "comp-fluid-out" : "comp-fluid-in"
                        }`}
                >
                    <div className="inline-block bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-2xl px-4 py-2 shadow-2xs text-[11px] text-slate-500">
                        Copyright © 2026 Politeknik Negeri Manado · UPT K3 & Laboratorium Terpadu · All rights reserved
                    </div>
                </div>
            </div>

            {/* ================= SUCCESS MODAL ================= */}
            {successModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900">
                                Kata Sandi Berhasil Diperbarui!
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Kata sandi untuk identitas <span className="font-bold text-slate-800">{idNumber}</span> telah berhasil diatur ulang di sistem SIM-LB3 POLIMDO.
                            </p>
                        </div>



                        <button
                            onClick={(e) => handleSmoothNavigate(e, "/login")}
                            className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white text-sm font-bold py-3 rounded-xl transition cursor-pointer"
                        >
                            Masuk ke Akun Sekarang
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}