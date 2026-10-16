import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

    // 1. Ambil total unit terdaftar
    const { count: unitCount } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true });

    // 2. Ambil tiket untuk menghitung volume neraca dan metrik
    const { data: tickets, error: ticketError } = await supabase
      .from("b3_tickets")
      .select("id, volume, satuan, fase, status, karakteristik_bahaya, created_at");

    if (ticketError) throw ticketError;

    // 3. Ambil logbook TPS dengan relasi b3_tickets
    const { data: logs, error: logError } = await supabase
      .from("tps_storage_logs")
      .select(`
        id,
        ticket_id,
        tgl_masuk_tps,
        tgl_jatuh_tempo,
        posisi_rak_tps,
        tgl_pengeluaran,
        nama_transporter,
        nomor_festronik,
        status_neraca,
        b3_tickets (
          id,
          nama_limbah,
          kode_limbah,
          volume,
          satuan,
          fase,
          karakteristik_bahaya,
          lokasi_pengambilan,
          status
        )
      `)
      .order("tgl_masuk_tps", { ascending: false });

    if (logError) throw logError;

    // Kalkulasi volume neraca
    const allTickets = tickets || [];
    const validTickets = allTickets.filter((t) =>
      ["masuk_tps", "terverifikasi", "diangkut_pihak3", "selesai"].includes(t.status)
    );

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

    // Hitung persentase fase
    const cairPct =
      totalVolume > 0
        ? Math.round((cairVolume / totalVolume) * 100)
        : 100;
    const padatPct = totalVolume > 0 ? 100 - cairPct : 0;

    // Kepatuhan Form Unit (tiket diproses valid / total diajukan)
    const complianceRate =
      allTickets.length > 0
        ? ((validTickets.length / allTickets.length) * 100).toFixed(1).replace(".", ",")
        : "100";

    // Kapasitas TPS
    const storedLogs = (logs || []).filter(
      (l) => l.status_neraca === "tersimpan"
    );
    const storedCount = storedLogs.length;
    const maxCapacityDrums = 20;
    const tpsPercent = Math.min(
      100,
      Math.max(storedCount > 0 ? 5 : 0, Math.round((storedCount / maxCapacityDrums) * 100))
    );

    // Format tabel logbook TPS
    const now = Date.now();
    const formattedLogs = (logs || []).map((l: any) => {
      const ticket = l.b3_tickets;
      const karakteristikList = Array.isArray(ticket?.karakteristik_bahaya)
        ? ticket.karakteristik_bahaya
        : ticket?.karakteristik_bahaya
        ? [ticket.karakteristik_bahaya]
        : ["Limbah Terklasifikasi"];

      const karakteristikStr = karakteristikList.join(", ");
      const isDispatched = l.status_neraca === "dikeluarkan";

      let sisaWaktuStr = "Telah Diangkut";
      if (!isDispatched && l.tgl_jatuh_tempo) {
        const dueTime = new Date(l.tgl_jatuh_tempo).getTime();
        const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          sisaWaktuStr = `Lewat ${Math.abs(diffDays)} Hari!`;
        } else if (diffDays === 0) {
          sisaWaktuStr = "Hari Ini (Jatuh Tempo)";
        } else {
          sisaWaktuStr = `${diffDays} Hari`;
        }
      }

      return {
        kode: l.ticket_id || ticket?.id || "-",
        bahan: ticket?.nama_limbah || "Limbah B3",
        karakteristik: karakteristikStr,
        tipeBadge: getCharacteristicBadge(karakteristikStr),
        unit: ticket?.lokasi_pengambilan || "Unit POLIMDO",
        volume: `${ticket?.volume ?? 0} ${ticket?.satuan || "Liter"}`,
        tglMasuk: formatIndonesianDate(l.tgl_masuk_tps),
        sisaWaktu: sisaWaktuStr,
        status: isDispatched ? "Telah Diangkut (Pihak 3)" : "Tersimpan Aman",
        statusBadge: isDispatched
          ? "bg-teal-50 text-teal-800 border-teal-200"
          : "bg-emerald-50 text-[#064e3b] border-emerald-200",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalTerinventarisasi: {
            value: totalVolume.toLocaleString("id-ID", {
              minimumFractionDigits: totalVolume % 1 === 0 ? 0 : 1,
              maximumFractionDigits: 1,
            }),
            unit: "Liter",
            subtext: `${cairPct}% Terolah B3/KL • ${padatPct > 0 ? `+${padatPct}% kg Padat` : "Fase Cair Sesuai PP 22/2021"}`,
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
            value: (unitCount || 21).toString(),
            subtext: "Unit Pelapor Aktif se-POLIMDO",
          },
        },
        logs: formattedLogs,
      },
    });
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
