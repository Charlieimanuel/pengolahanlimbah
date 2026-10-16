import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatIndonesianDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCharacteristicBadge(karakteristik: string[] | string | null) {
  const text = Array.isArray(karakteristik)
    ? karakteristik.join(" ")
    : karakteristik || "";
  const lower = text.toLowerCase();

  if (lower.includes("terbakar") || lower.includes("menyala")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (lower.includes("korosif") || lower.includes("asam")) {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }
  if (lower.includes("toksik") || lower.includes("beracun")) {
    return "bg-purple-50 text-purple-800 border-purple-200";
  }
  if (lower.includes("reaktif") || lower.includes("ledakan")) {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Ambil total unit laboratorium & prodi terdaftar
    const { count: unitCount } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true });

    // 2. Ambil seluruh tiket B3 terintegrasi profil pelapor, unit, dan log TPS
    const { data: tickets, error: ticketError } = await supabase
      .from("b3_tickets")
      .select(`
        id,
        nama_limbah,
        kode_limbah,
        volume,
        satuan,
        fase,
        status,
        karakteristik_bahaya,
        lokasi_pengambilan,
        created_at,
        profiles:pelapor_id (
          nama_lengkap,
          nama_lab,
          jurusan
        ),
        units:unit_id (
          nama_unit,
          jurusan
        ),
        tps_storage_logs (
          id,
          posisi_rak_tps,
          status_neraca,
          tgl_masuk_tps,
          tgl_jatuh_tempo,
          tgl_pengeluaran,
          nama_transporter,
          nomor_festronik
        )
      `)
      .neq("status", "draft")
      .order("created_at", { ascending: false });

    if (ticketError) throw ticketError;

    const allTickets = (tickets || []) as any[];

    // Tiket yang valid dalam neraca inventaris (diajukan, terverifikasi, masuk_tps, diangkut_pihak3, selesai)
    const validTickets = allTickets.filter((t) =>
      ["diajukan", "terverifikasi", "masuk_tps", "diangkut_pihak3", "selesai"].includes(t.status)
    );

    // Kalkulasi volume neraca
    let totalVolume = 0;
    let cairVolume = 0;
    let padatVolume = 0;

    validTickets.forEach((t) => {
      const vol = Number(t.volume) || 0;
      totalVolume += vol;
      const isPadat =
        t.fase === "padat" ||
        (t.satuan && t.satuan.toLowerCase().includes("kg"));
      if (isPadat) {
        padatVolume += vol;
      } else {
        cairVolume += vol;
      }
    });

    const cairPct =
      totalVolume > 0
        ? Math.round((cairVolume / totalVolume) * 100)
        : 100;
    const padatPct = totalVolume > 0 ? 100 - cairPct : 0;

    // Kapasitas TPS: hitung tiket yang saat ini tersimpan di TPS
    const storedTickets = allTickets.filter((t) => {
      if (t.status === "masuk_tps") return true;
      const logs = Array.isArray(t.tps_storage_logs) ? t.tps_storage_logs : [];
      return logs.some((l: any) => l.status_neraca === "tersimpan");
    });

    const storedCount = storedTickets.length;
    const maxCapacityDrums = 20;
    const tpsPercent = Math.min(
      100,
      Math.round((storedCount / maxCapacityDrums) * 100)
    );

    // Kepatuhan form unit (rasio laporan valid terhadap total laporan yang diajukan)
    const complianceRate =
      allTickets.length > 0
        ? ((validTickets.length / allTickets.length) * 100).toFixed(1).replace(".", ",")
        : "100";

    // Format logbook TPS untuk tampilan tabel publik
    const now = Date.now();
    const formattedLogs = allTickets.map((t: any) => {
      const tpsLog =
        Array.isArray(t.tps_storage_logs) && t.tps_storage_logs.length > 0
          ? t.tps_storage_logs[0]
          : null;

      const karakteristikList = Array.isArray(t.karakteristik_bahaya)
        ? t.karakteristik_bahaya
        : t.karakteristik_bahaya
        ? [t.karakteristik_bahaya]
        : ["Limbah Terklasifikasi"];
      const karakteristikStr = karakteristikList.join(", ");

      // Nama unit / lab yang representatif dari relasi database
      const unitName =
        t.units?.nama_unit ||
        (t.profiles?.nama_lab
          ? `${t.profiles.nama_lab}${t.profiles.jurusan ? ` (${t.profiles.jurusan})` : ""}`
          : null) ||
        t.lokasi_pengambilan ||
        "Unit POLIMDO";

      const isDispatched =
        t.status === "diangkut_pihak3" ||
        tpsLog?.status_neraca === "dikeluarkan";

      const isStored =
        t.status === "masuk_tps" || tpsLog?.status_neraca === "tersimpan";
      const isVerified = t.status === "terverifikasi";
      const isSubmitted = t.status === "diajukan";

      let statusDisplay = "Tersimpan Aman";
      let statusBadge = "bg-emerald-50 text-[#064e3b] border-emerald-200";

      if (isDispatched) {
        statusDisplay = "Telah Diangkut (Pihak 3)";
        statusBadge = "bg-teal-50 text-teal-800 border-teal-200";
      } else if (isStored) {
        statusDisplay = tpsLog?.posisi_rak_tps
          ? `TPS (${tpsLog.posisi_rak_tps})`
          : "Tersimpan di TPS";
        statusBadge = "bg-emerald-50 text-[#064e3b] border-emerald-200";
      } else if (isVerified) {
        statusDisplay = "Terverifikasi K3L";
        statusBadge = "bg-blue-50 text-blue-800 border-blue-200";
      } else if (isSubmitted) {
        statusDisplay = "Menunggu Penjemputan TPS";
        statusBadge = "bg-amber-50 text-amber-800 border-amber-200";
      }

      let sisaWaktuStr = "-";
      if (isDispatched) {
        sisaWaktuStr = "Telah Diangkut";
      } else if (tpsLog?.tgl_jatuh_tempo) {
        const dueTime = new Date(tpsLog.tgl_jatuh_tempo).getTime();
        const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          sisaWaktuStr = `Lewat ${Math.abs(diffDays)} Hari!`;
        } else if (diffDays === 0) {
          sisaWaktuStr = "Hari Ini (Jatuh Tempo)";
        } else {
          sisaWaktuStr = `${diffDays} Hari`;
        }
      } else if (isStored) {
        sisaWaktuStr = "90 Hari (Maks TPS)";
      } else if (isVerified || isSubmitted) {
        sisaWaktuStr = "Proses Masuk TPS";
      }

      const tglDisplay = tpsLog?.tgl_masuk_tps || t.created_at;

      return {
        kode: t.id,
        bahan: t.nama_limbah || "Limbah B3",
        karakteristik: karakteristikStr,
        tipeBadge: getCharacteristicBadge(karakteristikStr),
        unit: unitName,
        volume: `${t.volume ?? 0} ${t.satuan || "Liter"}`,
        tglMasuk: formatIndonesianDate(tglDisplay),
        sisaWaktu: sisaWaktuStr,
        status: statusDisplay,
        statusBadge: statusBadge,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics: {
            totalTerinventarisasi: {
              value: totalVolume.toLocaleString("id-ID", {
                minimumFractionDigits: totalVolume % 1 === 0 ? 0 : 1,
                maximumFractionDigits: 1,
              }),
              unit: "Liter",
              subtext: `${cairPct}% Terolah B3/KL • ${padatVolume > 0 ? `+${padatVolume} Kg Padat` : "Fase Cair Sesuai PP 22/2021"}`,
            },
            kepatuhanUnit: {
              value: `${complianceRate}%`,
              subtext: "Laboran & Dosen Terdaftar Aktif",
            },
            kapasitasTps: {
              value: `${tpsPercent}%`,
              subtext: `${storedCount} Drum Terisi (Batas Maks. ${maxCapacityDrums} Drum)`,
            },
            totalUnits: {
              value: (unitCount || 30).toString(),
              subtext: "Unit Pelapor Aktif se-POLIMDO",
            },
          },
          logs: formattedLogs,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data statistik neraca",
      },
      { status: 500 }
    );
  }
}
