import { SupabaseClient } from "@supabase/supabase-js";
import { Ticket, VerifyInspectionPayload, RejectInspectionPayload } from "./types";

/**
 * Service layer untuk operasi tiket limbah B3
 */
export const ticketService = {
  /**
   * Mengambil daftar tiket dengan relasi pelapor
   */
  async getTickets(supabase: SupabaseClient): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from("b3_tickets")
      .select("*, profiles:pelapor_id(nama_lengkap, nip_nim, email)")
      .order("is_emergency", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((t) => ({
      ...t,
      pelapor: t.profiles as any,
    }));
  },

  /**
   * Mengambil detail satu tiket berdasarkan ID
   */
  async getTicketById(supabase: SupabaseClient, ticketId: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from("b3_tickets")
      .select("*, profiles:pelapor_id(nama_lengkap, nip_nim, email)")
      .eq("id", ticketId)
      .single();

    if (error) return null;
    return {
      ...data,
      pelapor: data.profiles as any,
    };
  },

  /**
   * Verifikasi inspeksi tiket dan catat ke TPS log
   */
  async verifyInspection(
    supabase: SupabaseClient,
    payload: VerifyInspectionPayload
  ): Promise<void> {
    const { ticketId, storageDays, storageRack, verifiedByUserId } = payload;
    const now = new Date();
    const deadlineDate = new Date();
    deadlineDate.setDate(now.getDate() + storageDays);

    const { error: ticketError } = await supabase
      .from("b3_tickets")
      .update({
        status: "masuk_tps",
        verifikator_id: verifiedByUserId || null,
        verified_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", ticketId);

    if (ticketError) throw ticketError;

    const { error: logError } = await supabase.from("tps_storage_logs").insert([
      {
        ticket_id: ticketId,
        tgl_masuk_tps: now.toISOString(),
        tgl_jatuh_tempo: deadlineDate.toISOString(),
        posisi_rak_tps: storageRack,
        status_neraca: "tersimpan",
      },
    ]);

    if (logError) {
      console.warn("Peringatan log TPS:", logError.message);
    }
  },

  /**
   * Menolak laporan tiket
   */
  async rejectInspection(
    supabase: SupabaseClient,
    payload: RejectInspectionPayload
  ): Promise<void> {
    const { ticketId, rejectionReason, verifiedByUserId } = payload;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("b3_tickets")
      .update({
        status: "ditolak",
        verifikator_id: verifiedByUserId || null,
        catatan_verifikasi: rejectionReason,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", ticketId);

    if (error) throw error;
  },
};
