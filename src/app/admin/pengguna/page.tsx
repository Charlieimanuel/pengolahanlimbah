"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Edit2,
  X,
  Loader2,
  UserCheck,
  ShieldAlert,
  ArrowUpDown,
  Check,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string | null;
  nama_lengkap: string;
  nip_nim: string | null;
  nomor_wa: string | null;
  jurusan: string | null;
  nama_lab: string | null;
  role: "unit_pelapor" | "verifikator_k3l" | "admin_tps" | "transporter";
  created_at: string;
  ticket_count?: number;
}

export default function AdminPenggunaPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [jurusanFilter, setJurusanFilter] = useState("all");

  // Modal Ubah Role
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("unit_pelapor");
  const [savingRole, setSavingRole] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Ambil profiles
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Ambil tiket counts
      const { data: ticketData } = await supabase
        .from("b3_tickets")
        .select("pelapor_id");

      if (userData && !userError) {
        const ticketCounts: { [userId: string]: number } = {};
        if (ticketData) {
          ticketData.forEach((t) => {
            if (t.pelapor_id) {
              ticketCounts[t.pelapor_id] = (ticketCounts[t.pelapor_id] || 0) + 1;
            }
          });
        }

        const mapped: UserProfile[] = userData.map((u) => ({
          ...u,
          ticket_count: ticketCounts[u.id] || 0,
        }));

        setProfiles(mapped);
      }
    } catch (err) {
      console.error("Gagal mengambil data pengguna:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Unique Jurusan
  const uniqueJurusan = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.jurusan) set.add(p.jurusan);
    });
    return Array.from(set);
  }, [profiles]);

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (jurusanFilter !== "all" && p.jurusan !== jurusanFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.nama_lengkap?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        const matchNip = p.nip_nim?.toLowerCase().includes(q);
        const matchJurusan = p.jurusan?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchNip && !matchJurusan) return false;
      }

      return true;
    });
  }, [profiles, roleFilter, jurusanFilter, searchQuery]);

  // Handle Ubah Role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSavingRole(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          role: selectedRole as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error("Gagal mengubah role pengguna:", err);
      alert(`Gagal mengubah role: ${err?.message || "Kesalahan database"}`);
    } finally {
      setSavingRole(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "verifikator_k3l":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>Verifikator K3L</span>
          </span>
        );
      case "admin_tps":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-teal-50 text-teal-800 border-teal-200">
            <ShieldAlert className="w-3 h-3 text-teal-600" />
            <span>Admin TPS</span>
          </span>
        );
      case "transporter":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-800 border-blue-200">
            <span>Transporter Berizin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 text-slate-700 border-slate-200">
            <Users className="w-3 h-3 text-slate-500" />
            <span>Civitas Pelapor</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER BANNER — Rich Forest Green Botanical Wallpaper
      ========================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-[#284533] text-white p-4 sm:p-7 shadow-sm border border-[#1e3426]">
        {/* Real Botanical Leaf Wallpaper Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 scale-105"
          style={{ backgroundImage: `url('/images/banner-leaf-bg.jpg')` }}
        />
        {/* Ambient forest green gradient to ensure perfect text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3324]/90 via-[#233f2d]/75 to-[#182f21]/65 pointer-events-none" />

        {/* Decorative Monstera Leaf Silhouette */}
        <div className="absolute -bottom-8 -right-6 pointer-events-none opacity-20 text-emerald-200 hidden sm:block">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 22" strokeWidth="1.5" />
            <path d="M12 4C14.5 4.5 17 6 18 8.5C18.5 9.7 18.2 11.2 17.5 12.2C16.8 13.2 15.5 13.8 14.5 14.5C13.5 15.2 12.8 16 12 17" fill="currentColor" fillOpacity="0.3" />
            <path d="M12 4C9.5 4.5 7 6 6 8.5C5.5 9.7 5.8 11.2 6.5 12.2C7.2 13.2 8.5 13.8 9.5 14.5C10.5 15.2 11.2 16 12 17" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/90 tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              MANAJEMEN HAK AKSES & PENGGUNA
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Civitas & Petugas K3L
            </h1>
            <p className="text-xs text-white/80 mt-0.5 font-normal leading-relaxed max-w-2xl">
              Daftar civitas kampus yang terdaftar, riwayat pelaporan temuan limbah B3, dan penetapan wewenang Verifikator K3L / Admin TPS.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/15 text-xs font-semibold text-white backdrop-blur-xs transition cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-300" : ""}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN TABLE CARD — White Card with Clean Design
      ========================================================= */}
      <div className="bg-white border border-[#e2eae4] rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[#e5ece6] bg-white flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP/NIM, email, atau jurusan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#dce8df] text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#284533] focus:ring-1 focus:ring-[#284533]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Role */}
            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Peran / Role</option>
                <option value="unit_pelapor">Civitas Pelapor</option>
                <option value="verifikator_k3l">Verifikator K3L</option>
                <option value="admin_tps">Admin TPS</option>
                <option value="transporter">Transporter</option>
              </select>
            </div>

            {/* Filter Jurusan */}
            <div className="flex items-center gap-2 bg-[#f8faf8] border border-[#dce8df] rounded-xl px-3 py-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-[#284533]" />
              <select
                value={jurusanFilter}
                onChange={(e) => setJurusanFilter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Jurusan</option>
                {uniqueJurusan.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#284533] animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat profil pengguna sistem...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tidak ada pengguna ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau filter peran yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ece6] text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#f8faf8]">
                  <th className="py-3 px-3.5">NAMA LENGKAP & NIP/NIM</th>
                  <th className="py-3 px-3.5">KONTAK & EMAIL</th>
                  <th className="py-3 px-3.5">JURUSAN / LAB</th>
                  <th className="py-3 px-3.5">PERAN / HAK AKSES</th>
                  <th className="py-3 px-3.5 text-center">LAPORAN DIKIRIM</th>
                  <th className="py-3 px-3.5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ef]">
                {filteredProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f9fbf9] transition">
                    {/* Nama & NIP */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-slate-900 text-sm">{user.nama_lengkap}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {user.nip_nim ? `NIP/NIM: ${user.nip_nim}` : "Belum diisi"}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-3.5 px-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email || "-"}</span>
                      </div>
                      {user.nomor_wa && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.nomor_wa}</span>
                        </div>
                      )}
                    </td>

                    {/* Jurusan */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-medium text-slate-900">{user.jurusan || "POLIMDO"}</div>
                      {user.nama_lab && (
                        <div className="text-[11px] text-slate-500">{user.nama_lab}</div>
                      )}
                    </td>

                    {/* Peran */}
                    <td className="py-3.5 px-3.5">{getRoleBadge(user.role)}</td>

                    {/* Laporan */}
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-mono font-bold text-sm text-[#284533]">
                        {user.ticket_count || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Temuan</span>
                    </td>

                    {/* Aksi Ubah Role */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setSelectedRole(user.role);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#f4f7f5] hover:bg-[#e8efea] border border-[#dce8df] text-[#284533] font-bold text-xs inline-flex items-center gap-1.5 ml-auto transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ubah Peran</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL UBAH ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-[#e2eae4] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5ece6] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4ed] text-[#284533] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Atur Hak Akses Pengguna</h3>
                  <p className="text-xs text-slate-500">{editingUser.nama_lengkap}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Pilih Hak Akses / Role</label>
                <div className="space-y-2">
                  {[
                    {
                      id: "unit_pelapor",
                      title: "Civitas Pelapor (Mahasiswa / Dosen / Tendik)",
                      desc: "Hanya dapat melaporkan temuan limbah B3 dan melihat tiket miliknya.",
                    },
                    {
                      id: "verifikator_k3l",
                      title: "Verifikator Tim K3L Kampus",
                      desc: "Dapat memverifikasi temuan di lapangan, menimbang, dan menerima ke TPS.",
                    },
                    {
                      id: "admin_tps",
                      title: "Admin / Operator TPS B3",
                      desc: "Akses penuh logbook TPS, alokasi rak, neraca limbah, dan serah terima transporter.",
                    },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRole === r.id
                          ? "bg-[#f4f7f5] border-[#284533] text-slate-900 shadow-xs"
                          : "bg-white border-[#e5ece6] text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          checked={selectedRole === r.id}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="accent-[#284533]"
                        />
                        <span className="font-bold text-xs text-slate-900">{r.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-6">{r.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5ece6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={savingRole}
                  className="px-4 py-2.5 rounded-xl border border-[#dce8df] text-slate-700 text-xs font-semibold hover:bg-[#f8faf8] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-5 py-2.5 rounded-xl bg-[#284533] hover:bg-[#1e3527] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
