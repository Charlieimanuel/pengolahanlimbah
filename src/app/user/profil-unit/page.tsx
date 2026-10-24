"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Leaf,
  Edit3,
  Check,
  X,
  Loader2,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRODI_BY_JURUSAN, LIST_JURUSAN } from "@/lib/constants";

interface UserProfileData {
  nama_lengkap?: string | null;
  email?: string | null;
  nip_nim?: string | null;
  nomor_wa?: string | null;
  jenis_kelamin?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  alamat?: string | null;
  jurusan?: string | null;
  prodi?: string | null;
  role?: string | null;
}

export default function ProfilUnitPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formFullName, setFormFullName] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formJurusan, setFormJurusan] = useState("");
  const [formProdi, setFormProdi] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGender, setFormGender] = useState("Laki-laki");
  const [formBirthPlace, setFormBirthPlace] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const populateForm = (data: UserProfileData) => {
    setFormFullName(data.nama_lengkap || "");
    setFormNip(data.nip_nim || "");
    setFormJurusan(data.jurusan || "");
    setFormProdi(data.prodi || "");
    setFormPhone(data.nomor_wa || "");
    setFormGender(data.jenis_kelamin || "Laki-laki");
    setFormBirthPlace(data.tempat_lahir || "");
    setFormBirthDate(data.tanggal_lahir || "");
    setFormAddress(data.alamat || "");
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
            .select("nama_lengkap, email, nip_nim, nomor_wa, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, jurusan, role, unit_id, units:unit_id(nama_unit)")
            .eq("id", user.id)
            .maybeSingle();

          const loadedProfile: UserProfileData = data
            ? {
                nama_lengkap: data.nama_lengkap,
                email: data.email,
                nip_nim: data.nip_nim,
                nomor_wa: data.nomor_wa || user.user_metadata?.whatsapp || "",
                jenis_kelamin: data.jenis_kelamin || user.user_metadata?.gender || "",
                tempat_lahir: data.tempat_lahir || user.user_metadata?.birth_place || "",
                tanggal_lahir: data.tanggal_lahir || user.user_metadata?.birth_date || "",
                alamat: data.alamat || user.user_metadata?.address || "",
                jurusan: data.jurusan || user.user_metadata?.jurusan || "Politeknik Negeri Manado",
                role: data.role || user.user_metadata?.role || "unit_pelapor",
                prodi: (data.units as unknown as { nama_unit: string } | null)?.nama_unit || user.user_metadata?.prodi || "",
              }
            : {
                nama_lengkap: user.user_metadata?.full_name || "Pengguna Terdaftar",
                email: user.email || "",
                nip_nim: user.user_metadata?.id_number || "",
                nomor_wa: user.user_metadata?.whatsapp || "",
                jenis_kelamin: user.user_metadata?.gender || "",
                tempat_lahir: user.user_metadata?.birth_place || "",
                tanggal_lahir: user.user_metadata?.birth_date || "",
                alamat: user.user_metadata?.address || "",
                jurusan: user.user_metadata?.jurusan || "Politeknik Negeri Manado",
                role: user.user_metadata?.role || "unit_pelapor",
                prodi: user.user_metadata?.prodi || "",
              };

          setProfile(loadedProfile);
          populateForm(loadedProfile);
        }
      } catch (err) {
        console.error("Gagal mengambil profil:", err);
      }
    }

    loadProfile();
  }, []);

  const handleStartEdit = () => {
    if (profile) populateForm(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) populateForm(profile);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFullName.trim()) {
      showToast("Nama lengkap wajib diisi.", "error");
      return;
    }
    if (!formJurusan) {
      showToast("Harap pilih jurusan.", "error");
      return;
    }
    if (!formProdi) {
      showToast("Harap pilih program studi.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formFullName.trim(),
          nipNim: formNip.trim(),
          whatsapp: formPhone.trim(),
          gender: formGender,
          birthPlace: formBirthPlace.trim(),
          birthDate: formBirthDate || null,
          address: formAddress.trim(),
          jurusan: formJurusan,
          prodi: formProdi,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Gagal memperbarui profil.");
      }

      setProfile((prev) => ({
        ...prev,
        nama_lengkap: formFullName.trim(),
        nip_nim: formNip.trim() || null,
        nomor_wa: formPhone.trim() || null,
        jenis_kelamin: formGender || null,
        tempat_lahir: formBirthPlace.trim() || null,
        tanggal_lahir: formBirthDate || null,
        alamat: formAddress.trim() || null,
        jurusan: formJurusan,
        prodi: formProdi,
      }));

      showToast("Profil berhasil diperbarui langsung!", "success");
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui data.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.nama_lengkap || "Pengguna Terdaftar";
  const displayNip = profile?.nip_nim || "-";
  const displayProdi = profile?.prodi || "-";
  const displayJurusan = profile?.jurusan || "Politeknik Negeri Manado";
  const displayKontak = profile?.nomor_wa || "-";
  const displayEmail = profile?.email || "-";
  const displayGender = profile?.jenis_kelamin || "-";
  const displayAlamat = profile?.alamat || "-";

  const formattedTglLahir = profile?.tanggal_lahir
    ? new Date(profile.tanggal_lahir).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const displayTempatTglLahir =
    profile?.tempat_lahir && formattedTglLahir
      ? `${profile.tempat_lahir}, ${formattedTglLahir}`
      : profile?.tempat_lahir || formattedTglLahir || "-";

  const roleBadgeLabel =
    profile?.role === "verifikator_k3l"
      ? "Verifikator K3L"
      : profile?.role === "admin_tps"
      ? "Admin TPS B3"
      : profile?.role === "transporter"
      ? "Transporter Resmi"
      : "Sivitas Akademika Pelapor";

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
        <div
          className={`fixed top-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:top-5 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "error"
              ? "bg-red-800 border-red-500/50"
              : "bg-[#064e3b] border-emerald-500/40"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {toastMessage.type === "error" ? (
              <X className="w-3.5 h-3.5 text-red-200" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            )}
          </div>
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#284533] text-white p-5 sm:p-7 shadow-sm border border-[#1e3426]">
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 scale-105"
          style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/90 tracking-wider mb-1.5">
              <Leaf className="w-3 h-3 text-emerald-300" />
              SIVITAS AKADEMIKA POLIMDO
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Profil & Identitas Pengguna
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed">
              {isEditing
                ? "Perbarui data diri, jurusan, program studi, dan kontak resmi akun Anda."
                : "Informasi identitas resmi pengguna yang terdaftar pada Sistem Pengelolaan Limbah B3 POLIMDO."}
            </p>
          </div>
        </div>
      </div>

      {/* Kartu Utama Identitas */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl p-6 sm:p-8 shadow-xs hover:border-[#cbe4d4] transition">
        {isEditing ? (
          /* ================= MODE FORM EDIT ================= */
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5ece6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#244b32] text-white flex items-center justify-center font-bold text-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Edit Identitas Pengguna</h2>
                  <p className="text-[11px] text-slate-500">Perbarui data diri yang terhubung dengan akun Anda</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Mode Edit Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-xs">
              {/* Nama Lengkap */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-medium"
                />
              </div>

              {/* NIP / NIM */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  NIP / NIM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Nomor identitas sivitas"
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-mono font-medium"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Email Terdaftar</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={displayEmail}
                  className="w-full bg-slate-100 text-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-not-allowed font-mono"
                />
              </div>

              {/* Jurusan */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Jurusan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formJurusan}
                  onChange={(e) => {
                    setFormJurusan(e.target.value);
                    setFormProdi("");
                  }}
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition cursor-pointer font-medium"
                >
                  <option value="">Pilih jurusan</option>
                  {LIST_JURUSAN.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Studi */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Program Studi (Prodi) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={!formJurusan}
                  value={formProdi}
                  onChange={(e) => setFormProdi(e.target.value)}
                  className={`w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition cursor-pointer font-medium ${
                    !formJurusan ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">
                    {formJurusan ? "Pilih program studi" : "Pilih jurusan terlebih dahulu"}
                  </option>
                  {formJurusan &&
                    PRODI_BY_JURUSAN[formJurusan]?.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>

              {/* Kontak WhatsApp */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Kontak / Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-medium"
                />
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 h-[38px]">
                  {["Laki-laki", "Perempuan"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormGender(g)}
                      className={`rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        formGender === g
                          ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-2xs"
                          : "bg-[#f8faf8] text-slate-600 border-[#dce8df] hover:bg-white"
                      }`}
                    >
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempat Lahir */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  value={formBirthPlace}
                  onChange={(e) => setFormBirthPlace(e.target.value)}
                  placeholder="Kota lahir"
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-medium"
                />
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                  className="w-full h-[38px] bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-medium"
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. Kampus Bahu No. 12, Manado"
                  className="w-full bg-[#f8faf8] hover:bg-white focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-[#dce8df] focus:border-emerald-600 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Tombol Form Aksi: Simpan & Batal */}
            <div className="pt-4 border-t border-[#e5ece6] flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#244b32] hover:bg-[#1b3a26] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ================= MODE LIHAT PROFIL (VIEW) ================= */
          <div className="space-y-6">
            {/* Header Identitas: Avatar, Nama, NIP/NIM, Role */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[#e5ece6]">
              <div className="w-16 h-16 rounded-2xl bg-[#244b32] text-white font-black text-xl flex items-center justify-center ring-4 ring-[#eaf4ed] shadow-xs shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {displayName}
                  </h2>
                  <span className="inline-block bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {roleBadgeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  NIP / NIM: <span className="font-semibold text-slate-700">{displayNip}</span>
                </p>
              </div>
            </div>

            {/* Detail Identitas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-xs">
              {/* Jurusan */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#244b32]" />
                  Jurusan
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {displayJurusan}
                </p>
              </div>

              {/* Program Studi */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#244b32]" />
                  Program Studi (Prodi)
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {displayProdi}
                </p>
              </div>

              {/* Kontak / WhatsApp */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#244b32]" />
                  Kontak / Nomor WhatsApp
                </span>
                <p className="font-semibold text-slate-900 text-sm font-mono">
                  {displayKontak}
                </p>
              </div>

              {/* Email Terdaftar */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#244b32]" />
                  Email Terdaftar
                </span>
                <p className="font-semibold text-slate-900 text-sm truncate font-mono">
                  {displayEmail}
                </p>
              </div>

              {/* Jenis Kelamin */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#244b32]" />
                  Jenis Kelamin
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {displayGender}
                </p>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#244b32]" />
                  Tempat, Tanggal Lahir
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {displayTempatTglLahir}
                </p>
              </div>

              {/* Alamat Lengkap */}
              <div className="p-4 bg-[#fbfdfb] border border-[#e5ece6] rounded-xl space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#244b32]" />
                  Alamat Lengkap
                </span>
                <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                  {displayAlamat}
                </p>
              </div>
            </div>

            {/* Footer Aksi */}
            <div className="pt-4 border-t border-[#e5ece6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Data profil tersimpan langsung di database SIM-LB3 POLIMDO.
              </p>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center justify-center gap-2 bg-[#244b32] hover:bg-[#1b3a26] text-white py-2.5 px-5 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
