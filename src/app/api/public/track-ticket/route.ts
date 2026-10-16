import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatIndonesianDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Parameter nomor tiket wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Query ticket by exact id (case-insensitive)
    const { data: ticket, error } = await supabase
      .from("b3_tickets")
      .select(`
        id,
        nama_limbah,
        kode_limbah,
        volume,
        satuan,
        fase,
        status,
        lokasi_pengambilan,
        catatan_verifikasi,
        created_at,
        verified_at
      `)
      .ilike("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!ticket) {
      return NextResponse.json({
        success: false,
        found: false,
        message: `Tiket dengan kode ${id} tidak ditemukan di sistem.`,
      });
    }

    // Pemetaan status ke visual UI
    let stage = "Laporan Diterima";
    let stageColor = "bg-blue-100 text-blue-800 border-blue-200";
    let statusNote = "Menunggu Antrean Review K3L";

    switch (ticket.status) {
      case "draft":
        stage = "Draf Laporan";
        stageColor = "bg-slate-100 text-slate-800 border-slate-200";
        statusNote = "Belum diajukan oleh pelapor";
        break;
      case "diajukan":
        stage = "Menunggu Verifikasi";
        stageColor = "bg-amber-100 text-amber-800 border-amber-200";
        statusNote = "Sedang dalam antrean review Tim K3L";
        break;
      case "terverifikasi":
        stage = "Terverifikasi K3L";
        stageColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
        statusNote = ticket.catatan_verifikasi || "Tervalidasi Tim K3L POLIMDO";
        break;
      case "masuk_tps":
        stage = "Tersimpan di TPS";
        stageColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
        statusNote =
          ticket.catatan_verifikasi || "Tersimpan aman di TPS B3 Kampus";
        break;
      case "diangkut_pihak3":
        stage = "Diangkut Pihak ke-3";
        stageColor = "bg-teal-100 text-teal-800 border-teal-200";
        statusNote = "Telah diserahkan ke transporter berizin KLHK";
        break;
      case "selesai":
        stage = "Tercatat di Neraca";
        stageColor = "bg-teal-100 text-teal-800 border-teal-200";
        statusNote = "Resmi Dibukukan Neraca Massa POLIMDO";
        break;
      case "ditolak":
        stage = "Laporan Ditolak";
        stageColor = "bg-rose-100 text-rose-800 border-rose-200";
        statusNote =
          ticket.catatan_verifikasi || "Perlu revisi atau tidak memenuhi standar";
        break;
    }

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        id: ticket.id,
        stage,
        stageColor,
        desc: `${ticket.nama_limbah} (${ticket.lokasi_pengambilan || "Unit POLIMDO"}) • Vol: ${ticket.volume} ${ticket.satuan || "Liter"}`,
        date: formatIndonesianDate(ticket.created_at),
        statusNote,
      },
    });
  } catch (error: any) {
    console.error("Error tracking ticket:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal melacak tiket" },
      { status: 500 }
    );
  }
}
