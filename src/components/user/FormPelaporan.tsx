"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  X,
  Droplet,
  Boxes,
  Layers,
  Wind,
  Send,
  Save,
  Info,
  User,
  SquarePen,
  FlaskConical,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FormPelaporanProps {
  onSubmitSuccess?: (ticketId: string) => void;
  onSaveDraftSuccess?: (ticketId: string) => void;
}

interface UserProfile {
  id: string;
  nama_lengkap: string;
  nip_nim: string | null;
  email: string | null;
  unit_id: string | null;
  role: string;
}

export default function FormPelaporan({
  onSubmitSuccess,
  onSaveDraftSuccess,
}: FormPelaporanProps) {
  // Database & Profile States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form Fields
  const [ticketId, setTicketId] = useState("B3-2026-001");
  const [waktuTemuan, setWaktuTemuan] = useState("");
  const [lokasiTemuan, setLokasiTemuan] = useState("");
  const [patokanLokasi, setPatokanLokasi] = useState("");
  const [namaLimbah, setNamaLimbah] = useState("");
  const [kodeLimbah, setKodeLimbah] = useState("Tidak Diketahui / Belum Terlabel");
  const [volume, setVolume] = useState("1");
  const [satuanVolume, setSatuanVolume] = useState("Liter");
  const [bentukFisik, setBentukFisik] = useState("Cair");
  const [karakteristikBahaya, setKarakteristikBahaya] = useState<string[]>([
    "Beracun (Toksik)",
  ]);
  const [kondisiWadah, setKondisiWadah] = useState("Tertutup Rapat");
  const [keterangan, setKeterangan] = useState("");

  // File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inisialisasi data dari Supabase saat form dimuat
  useEffect(() => {
    async function initForm() {
      try {
        setLoadingInit(true);
        const supabase = createClient();

        // 1. Ambil sesi user yang login
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, nama_lengkap, nip_nim, email, unit_id, role")
            .eq("id", user.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData);
          } else {
            setProfile({
              id: user.id,
              nama_lengkap: user.user_metadata?.full_name || "Civitas POLIMDO",
              nip_nim: user.user_metadata?.id_number || null,
              email: user.email || null,
              unit_id: null,
              role: "unit_pelapor",
            });
          }
        }

        // 2. Generate ID Tiket Riil berdasarkan data tiket di database (lintas pengguna)
        const year = new Date().getFullYear();
        let initialTicketId = `B3-${year}-001`;
        try {
          const res = await fetch("/api/public/next-ticket-id");
          if (res.ok) {
            const data = await res.json();
            if (data?.nextId) {
              initialTicketId = data.nextId;
            }
          }
        } catch {
          const { count } = await supabase
            .from("b3_tickets")
            .select("*", { count: "exact", head: true });
          const nextNumber = String((count || 0) + 1).padStart(3, "0");
          initialTicketId = `B3-${year}-${nextNumber}`;
        }
        setTicketId(initialTicketId);

        // 3. Format waktu lokal saat ini
        const now = new Date();
        const formattedDate =
          now.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }) +
          ", " +
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
        setWaktuTemuan(formattedDate);
      } catch (err) {
        console.error("Gagal inisialisasi dari database:", err);
      } finally {
        setLoadingInit(false);
      }
    }

    initForm();
  }, []);

  const toggleBahaya = (bahaya: string) => {
    if (karakteristikBahaya.includes(bahaya)) {
      setKarakteristikBahaya(karakteristikBahaya.filter((b) => b !== bahaya));
    } else {
      setKarakteristikBahaya([...karakteristikBahaya, bahaya]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran foto maksimal adalah 10 MB.");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveToDatabase = async (statusTarget: "menunggu_verifikasi" | "draft") => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessNotice(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Sesi masuk tidak ditemukan. Silakan login terlebih dahulu untuk mengirim laporan."
        );
      }

      if (!lokasiTemuan.trim()) {
        throw new Error("Lokasi ditemukan limbah wajib diisi.");
      }

      if (!namaLimbah.trim()) {
        throw new Error("Nama atau dugaan jenis limbah temuan wajib diisi.");
      }

      // Upload file foto ke Supabase Storage (bucket bukti-limbah)
      const uploadedUrls: string[] = [];
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop() || "jpg";
        const cleanExt = fileExt.toLowerCase();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${cleanExt}`;

        const { error: uploadError } = await supabase.storage
          .from("bukti-limbah")
          .upload(fileName, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.warn("Peringatan saat mengunggah foto ke storage:", uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("bukti-limbah")
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      const numericVolume = parseFloat(volume.replace(",", ".")) || 1.0;
      const isEmergency =
        karakteristikBahaya.includes("Beracun (Toksik)") ||
        kondisiWadah.toLowerCase().includes("bocor");

      // Validasi ketersediaan ticketId agar tidak terjadi bentrok primary key b3_tickets_pkey
      let finalTicketId = ticketId;
      try {
        const checkRes = await fetch(
          `/api/public/next-ticket-id?candidate=${encodeURIComponent(finalTicketId)}`
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.nextId) {
            finalTicketId = checkData.nextId;
          }
        }
      } catch (err) {
        console.warn("Peringatan saat memeriksa keunikan ID tiket:", err);
      }

      // Payload sesuai dengan skema tabel public.b3_tickets di database
      const payload = {
        id: finalTicketId,
        pelapor_id: user.id,
        unit_id: profile?.unit_id || null,
        nama_limbah: namaLimbah.trim(),
        kode_limbah: kodeLimbah,
        fase: (bentukFisik.toLowerCase() as "cair" | "padat" | "sludge" | "gas") || "cair",
        volume: numericVolume,
        satuan: satuanVolume,
        jenis_kemasan: kondisiWadah,
        karakteristik_bahaya: karakteristikBahaya,
        is_emergency: isEmergency,
        lokasi_pengambilan: lokasiTemuan.trim(),
        patokan_lokasi: patokanLokasi.trim() || null,
        deskripsi_sumber: keterangan.trim() || null,
        tanggal_dihasilkan: new Date().toISOString().split("T")[0],
        foto_limbah_url: uploadedUrls,
        status: statusTarget,
      };

      // Simpan tiket dengan perlindungan retry otomatis jika terdeteksi bentrok b3_tickets_pkey
      let insertError: any = null;
      let currentTicketId = finalTicketId;

      for (let attempt = 0; attempt < 3; attempt++) {
        const currentPayload = {
          ...payload,
          id: currentTicketId,
        };

        const { error } = await supabase
          .from("b3_tickets")
          .insert(currentPayload);

        if (!error) {
          insertError = null;
          finalTicketId = currentTicketId;
          break;
        }

        insertError = error;
        const isDuplicate =
          error.code === "23505" ||
          error.message?.toLowerCase().includes("b3_tickets_pkey") ||
          error.message?.toLowerCase().includes("duplicate key");

        if (isDuplicate) {
          try {
            const freshRes = await fetch("/api/public/next-ticket-id");
            if (freshRes.ok) {
              const freshData = await freshRes.json();
              if (freshData?.nextId) {
                currentTicketId = freshData.nextId;
                continue;
              }
            }
          } catch {
            // fallback
          }
          const year = new Date().getFullYear();
          currentTicketId = `B3-${year}-${Math.floor(100 + Math.random() * 900)}`;
          continue;
        } else {
          break;
        }
      }

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccessNotice(
        statusTarget === "draft"
          ? `Draft laporan #${finalTicketId} berhasil disimpan ke database!`
          : `Laporan #${finalTicketId} berhasil disimpan dan dikirim ke tim K3L POLIMDO!`
      );

      if (statusTarget === "draft") {
        if (onSaveDraftSuccess) onSaveDraftSuccess(finalTicketId);
      } else {
        if (onSubmitSuccess) onSubmitSuccess(finalTicketId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan laporan ke database.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveToDatabase("menunggu_verifikasi");
  };

  const handleDraft = () => {
    saveToDatabase("draft");
  };

  return (
    <section
      id="formulir-section"
      className="bg-white border border-[#e2eae4] rounded-2xl p-4 sm:p-7 shadow-xs space-y-6 sm:space-y-7 relative"
    >
      {/* Alert Error / Success */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successNotice}</div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-[#e5ece6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2d4a36]"></span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Formulir Pelaporan Temuan Limbah B3
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laporkan keberadaan limbah berbahaya (B3) yang Anda temukan di lingkungan kampus agar segera ditangani tim K3L.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf4ed] text-[#244b32] border border-[#cbe4d4] text-[11px] sm:text-xs font-semibold max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
            <span className="truncate">Siaga Tanggap Darurat K3L</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
        {/* 3 Columns Layout (A, B, C) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ================= BAGIAN A ================= */}
          <div className="bg-[#fcfdfc] rounded-2xl p-3.5 sm:p-5 border border-[#e2eae4] space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f6f2] text-[#2d4a36] border border-[#d6e5da] font-bold text-xs">
              <FileText className="w-3.5 h-3.5 text-[#2d4a36]" />
              <span>Bagian A. Identitas & Lokasi Temuan</span>
            </div>

            {/* 1. ID & 2. WAKTU TEMUAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  1. ID LAPORAN / TIKET
                </label>
                <input
                  type="text"
                  disabled
                  value={ticketId}
                  className="w-full bg-[#eef4f0] border border-[#d8e5dc] text-slate-800 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-not-allowed font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  2. WAKTU TEMUAN
                </label>
                <input
                  type="text"
                  disabled
                  value={waktuTemuan || "Memuat waktu..."}
                  className="w-full bg-[#eef4f0] border border-[#d8e5dc] text-slate-800 text-xs font-medium px-3 py-2.5 rounded-xl cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. IDENTITAS PELAPOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                3. IDENTITAS PELAPOR
              </label>
              <div className="border border-[#dce8df] rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#2d4a36] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    {profile?.nama_lengkap ? profile.nama_lengkap.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {profile?.nama_lengkap || "Pengguna Terdaftar"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      NIP/NIM: {profile?.nip_nim || "-"} • {profile?.email || "Civitas Kampus"}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                  Tervalidasi
                </div>
              </div>
            </div>

            {/* 4. LOKASI DITEMUKAN LIMBAH */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                4. LOKASI DITEMUKAN LIMBAH <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={lokasiTemuan}
                  onChange={(e) => setLokasiTemuan(e.target.value)}
                  placeholder="Contoh: Gedung Kuliah Terpadu, Lt. 1 / Koridor Belakang"
                  className="w-full bg-white border border-[#dce8df] text-slate-800 text-xs font-medium pl-8 pr-3 py-2.5 rounded-xl focus:border-[#2d4a36] outline-none"
                />
              </div>
            </div>

            {/* 5. PATOKAN & DETAIL TEMUAN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                5. PATOKAN / SPESIFIKASI TEMUAN
              </label>
              <input
                type="text"
                value={patokanLokasi}
                onChange={(e) => setPatokanLokasi(e.target.value)}
                placeholder="Contoh: Di samping tangga darurat barat, dekat tempat sampah"
                className="w-full bg-white border border-[#dce8df] text-slate-800 text-xs font-medium px-3 py-2.5 rounded-xl focus:border-[#2d4a36] outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
                Tuliskan patokan lokasi secara jelas agar tim tanggap K3L dapat segera menemukan dan mengamankan limbah.
              </p>
            </div>
          </div>

          {/* ================= BAGIAN B ================= */}
          <div className="bg-[#fcfdfc] rounded-2xl p-3.5 sm:p-5 border border-[#e2eae4] space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fff7ed] text-[#c25e1a] border border-[#fed7aa] font-bold text-xs">
              <FlaskConical className="w-3.5 h-3.5 text-[#c25e1a]" />
              <span>Bagian B. Ciri & Karakteristik Temuan</span>
            </div>

            {/* 6. DUGAAN NAMA / JENIS LIMBAH */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                6. DUGAAN NAMA / JENIS LIMBAH <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaLimbah}
                onChange={(e) => setNamaLimbah(e.target.value)}
                placeholder="Contoh: Jerigen Berisi Cairan Kimia Tanpa Label, Oli Bekas"
                className="w-full bg-white border border-[#dce8df] text-slate-800 text-xs font-medium px-3 py-2.5 rounded-xl focus:border-[#2d4a36] outline-none"
              />
            </div>

            {/* 7. KODE LIMBAH & 8. VOLUME / MASSA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  7. KODE LIMBAH (JIKA ADA LABEL)
                </label>
                <select
                  value={kodeLimbah}
                  onChange={(e) => setKodeLimbah(e.target.value)}
                  className="w-full bg-white border border-[#dce8df] text-slate-800 text-xs px-2.5 py-2.5 rounded-xl focus:border-[#2d4a36] outline-none truncate"
                >
                  <option value="Tidak Diketahui / Belum Terlabel">
                    Tidak Diketahui / Tanpa Label
                  </option>
                  <option value="110-01 (P-2) Asam/Larutan">
                    110-01 (P-2) Asam/Larutan
                  </option>
                  <option value="B107d (Pelarut Asam)">B107d (Pelarut Asam)</option>
                  <option value="B105d (Minyak Organik)">B105d (Minyak Organik)</option>
                  <option value="B109d (Pelarut Flammable)">B109d (Pelarut Flammable)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  8. PERKIRAAN VOLUME / MASSA
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-16 bg-white border border-[#dce8df] text-slate-800 text-xs font-medium px-2 py-2.5 rounded-xl text-center focus:border-[#2d4a36] outline-none"
                  />
                  <select
                    value={satuanVolume}
                    onChange={(e) => setSatuanVolume(e.target.value)}
                    className="flex-1 bg-white border border-[#dce8df] text-slate-800 text-xs px-2.5 py-2.5 rounded-xl focus:border-[#2d4a36] outline-none"
                  >
                    <option value="Liter">Liter</option>
                    <option value="Kg">Kg</option>
                    <option value="Jerigen">Jerigen</option>
                    <option value="Botol">Botol</option>
                    <option value="Drum">Drum</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 9. INTERVAL SIFAT BERBAHAYA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                9. BENTUK FISIK TEMUAN
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Cair", icon: Droplet },
                  { name: "Padat", icon: Boxes },
                  { name: "Sludge", icon: Layers },
                  { name: "Gas", icon: Wind },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setBentukFisik(item.name)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      bentukFisik === item.name
                        ? "bg-[#2d4a36] text-white border-[#2d4a36] shadow-xs"
                        : "bg-white text-slate-700 border-[#dce8df] hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 10. KARAKTER BAHAYA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                10. DUGAAN BAHAYA (TERLIHAT / TERCIUM)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: "Korosif", isAlert: false },
                  { name: "Beracun (Toksik)", isAlert: true },
                  { name: "Mudah Menyala", isAlert: false },
                  { name: "Reaktif", isAlert: false },
                  { name: "Infeksius", isAlert: false },
                ].map((hazard) => {
                  const isChecked = karakteristikBahaya.includes(hazard.name);
                  return (
                    <button
                      key={hazard.name}
                      type="button"
                      onClick={() => toggleBahaya(hazard.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition cursor-pointer text-left ${
                        isChecked
                          ? hazard.isAlert
                            ? "bg-[#fff7ed] text-amber-950 border-[#fed7aa] font-semibold"
                            : "bg-[#f0fdf4] text-emerald-950 border-[#bbf7d0] font-semibold"
                          : "bg-white text-slate-600 border-[#dce8df] hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded border-slate-300 text-emerald-700 pointer-events-none accent-emerald-700"
                      />
                      {hazard.isAlert && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">{hazard.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= BAGIAN C ================= */}
          <div className="bg-[#fcfdfc] rounded-2xl p-3.5 sm:p-5 border border-[#e2eae4] space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] font-bold text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-[#1e40af]" />
              <span>Bagian C. Kondisi & Foto Bukti Temuan</span>
            </div>

            {/* 11. KONDISI KEMASAN SAAT DITEMUKAN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                11. KONDISI WADAH / KEMASAN SAAT DITEMUKAN
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: "Tertutup Rapat" },
                  { label: "Terbuka / Tanpa Tutup" },
                  { label: "Bocor / Merembes / Rusak" },
                ].map((cond) => {
                  const isSelected = kondisiWadah === cond.label;
                  return (
                    <button
                      key={cond.label}
                      type="button"
                      onClick={() => setKondisiWadah(cond.label)}
                      className={`py-2 px-2.5 rounded-xl sm:rounded-full border text-xs font-medium text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "border-2 border-[#2d4a36] bg-white text-[#2d4a36] font-bold shadow-2xs"
                          : "border-[#dce8df] bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-[#2d4a36] bg-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2d4a36]"></span>
                        )}
                      </span>
                      <span className="text-[11px] truncate">{cond.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 12. FOTO TEMUAN LIMBAH */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                12. FOTO BUKTI TEMUAN LIMBAH
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#b8d4c2] hover:border-emerald-600 rounded-2xl p-3.5 sm:p-4 bg-white text-center transition cursor-pointer group"
              >
                {filePreview ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={filePreview}
                        alt="Preview Bukti Temuan"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-md transition"
                        title="Hapus Foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-800 truncate">
                      {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : "0")} MB)
                    </div>
                    <div className="text-[10px] text-slate-400">Klik untuk mengganti foto</div>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition">
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Unggah Foto Wadah & Lokasi Temuan
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Format: JPG, PNG, WEBP. Maks. 10 MB.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 13. CATATAN KONDISI SAAT DITEMUKAN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                13. CATATAN / KONDISI SAAT DITEMUKAN
              </label>
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan kondisi limbah saat ditemukan, bau menyengat, tumpahan di lantai, atau potensi bahaya sekitar..."
                className="w-full bg-white border border-[#dce8df] text-slate-800 text-xs p-3 rounded-xl focus:border-[#2d4a36] outline-none leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="pt-5 border-t border-[#e5ece6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#2d4a36] shrink-0" />
            <span>
              Laporan terverifikasi & terhubung langsung dengan Tim Tanggap Darurat K3 Kampus POLIMDO.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              disabled={submitting || loadingInit}
              onClick={handleDraft}
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Simpan Draft</span>
            </button>

            <button
              type="submit"
              disabled={submitting || loadingInit}
              className="inline-flex items-center justify-center gap-2 bg-[#2d4a36] hover:bg-[#233b2c] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Kirim Laporan Temuan ke Tim K3</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
