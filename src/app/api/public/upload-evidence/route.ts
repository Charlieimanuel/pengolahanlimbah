import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File foto wajib diunggah." },
        { status: 400 }
      );
    }

    const mimeType = (file.type || "").toLowerCase();
    const fileNameLower = (file.name || "").toLowerCase();
    const ext = fileNameLower.split(".").pop() || "jpg";
    const cleanExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";

    // Validasi tipe file gambar fleksibel (kompatibel penuh dengan kamera HP / iOS / Android)
    const isImage =
      mimeType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif", "jfif", "svg"].includes(cleanExt);

    if (!isImage) {
      return NextResponse.json(
        { success: false, error: "Format file tidak didukung. Harap unggah file foto (JPG, PNG, WebP, dsb)." },
        { status: 400 }
      );
    }

    // Maksimal 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran file foto maksimal adalah 20 MB." },
        { status: 400 }
      );
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `pelaporan/${uniqueId}.${cleanExt}`;
    const localFileName = `${uniqueId}.${cleanExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Simpan salinan lokal di public/uploads sebagai jaminan 100% ketersediaan
    let localUrl: string | null = null;
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, localFileName), buffer);
      localUrl = `/uploads/${localFileName}`;
    } catch (localErr) {
      console.warn("[Upload Evidence] Warning saving local copy:", localErr);
    }

    // 2. Upload ke Supabase Storage (bucket bukti-limbah)
    let publicUrl: string | null = null;
    try {
      const supabase = createAdminClient();

      let uploadContentType = mimeType;
      if (!uploadContentType || uploadContentType === "application/octet-stream") {
        if (cleanExt === "png") uploadContentType = "image/png";
        else if (cleanExt === "webp") uploadContentType = "image/webp";
        else if (cleanExt === "gif") uploadContentType = "image/gif";
        else uploadContentType = "image/jpeg";
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bukti-limbah")
        .upload(fileName, buffer, {
          contentType: uploadContentType,
          upsert: true,
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from("bukti-limbah")
          .getPublicUrl(fileName);
        if (pubData?.publicUrl) {
          publicUrl = pubData.publicUrl;
        }
      } else {
        console.warn("[Upload Evidence] Supabase storage upload warning:", uploadError.message);
      }
    } catch (storageErr) {
      console.warn("[Upload Evidence] Supabase storage exception:", storageErr);
    }

    // Gunakan URL Supabase Storage sebagai prioritas, fallback ke localUrl
    const finalUrl = publicUrl || localUrl;

    if (!finalUrl) {
      return NextResponse.json(
        { success: false, error: "Gagal menyimpan berkas foto ke server." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      fileName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah foto.";
    console.error("[Upload Evidence] Fatal Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
