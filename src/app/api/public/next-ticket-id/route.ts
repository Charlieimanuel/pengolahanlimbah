import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidate = searchParams.get("candidate")?.trim();
    const currentYear = new Date().getFullYear();
    const prefix = `B3-${currentYear}-`;

    const supabase = createAdminClient();

    // Ambil seluruh tiket tahun berjalan untuk menentukan sequence number berikutnya
    const { data: tickets, error } = await supabase
      .from("b3_tickets")
      .select("id")
      .ilike("id", `${prefix}%`);

    if (error) {
      console.error("Gagal mengambil daftar ID tiket:", error.message);
      // Fallback aman jika query gagal
      const fallbackId = `B3-${currentYear}-${Math.floor(100 + Math.random() * 900)}`;
      return NextResponse.json({
        success: true,
        nextId: fallbackId,
        available: true,
      });
    }

    const existingIds = new Set<string>(
      (tickets || []).map((t) => (t.id ? t.id.trim().toUpperCase() : ""))
    );

    // Jika kandidat ID diberikan dan belum pernah dipakai, maka kandidat tersebut valid
    if (candidate) {
      const candidateUpper = candidate.toUpperCase();
      if (!existingIds.has(candidateUpper)) {
        return NextResponse.json({
          success: true,
          nextId: candidate,
          available: true,
        });
      }
    }

    // Hitung nomor urut terbesar dari ID yang berformat B3-YYYY-NNN
    let maxNum = 0;
    for (const t of tickets || []) {
      if (!t.id) continue;
      const match = t.id.trim().match(/^B3-\d{4}-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    // Cari sequence number berikutnya yang belum dipakai
    let candidateNum = maxNum + 1;
    let padLength = Math.max(3, String(candidateNum).length);
    let nextId = `${prefix}${String(candidateNum).padStart(padLength, "0")}`;

    while (existingIds.has(nextId.toUpperCase())) {
      candidateNum++;
      padLength = Math.max(3, String(candidateNum).length);
      nextId = `${prefix}${String(candidateNum).padStart(padLength, "0")}`;
    }

    return NextResponse.json({
      success: true,
      nextId,
      available: candidate ? false : true,
      year: currentYear,
      sequence: candidateNum,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Kesalahan API next-ticket-id:", msg);
    const fallbackYear = new Date().getFullYear();
    return NextResponse.json(
      {
        success: false,
        nextId: `B3-${fallbackYear}-${Math.floor(100 + Math.random() * 900)}`,
        message: msg,
      },
      { status: 500 }
    );
  }
}
