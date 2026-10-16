import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:8000";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc5MTk1NDg1OSwiZXhwIjoyMTA3MzE0ODU5fQ.WJVqbSOYuXiar0WSEiNXz8vHCx0gSw_eexZPUeXFLPY";

function getEmailTemplate(otpCode: string, recipientName: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Otorisasi Pemulihan Kata Sandi SIM-LB3</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f3; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
              <td style="background-color: #064e3b; padding: 28px 32px; text-align: center;">
                <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.12); border-radius: 20px; font-size: 11px; font-weight: 700; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  POLITEKNIK NEGERI MANADO
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                  SIM-LB3 POLIMDO
                </h1>
                <p style="margin: 6px 0 0 0; color: #a7f3d0; font-size: 12px; font-weight: 500;">
                  Sistem Informasi Manajemen Pengelolaan Limbah B3
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 32px 32px 24px 32px;">
                <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                  Halo, ${recipientName}
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                  Kami menerima permintaan otorisasi untuk mengatur ulang kata sandi akun SIM-LB3 Anda. Gunakan kode verifikasi di bawah ini untuk melanjutkan proses:
                </p>

                <!-- OTP Code Box -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #059669; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                    KODE OTORISASI PEMULIHAN
                  </div>
                  <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #064e3b; font-family: 'Courier New', Courier, monospace;">
                    ${otpCode}
                  </div>
                  <div style="font-size: 11px; color: #059669; margin-top: 8px; font-weight: 500;">
                    Berlaku selama 15 menit
                  </div>
                </div>

                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 14px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #991b1b;">
                    <strong>PENTING:</strong> Jangan berikan kode otorisasi ini kepada siapa pun, termasuk pihak yang mengatasnamakan UPT K3L atau pengelola IT POLIMDO.
                  </p>
                </div>

                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  Jika Anda tidak merasa mengajukan permintaan pemulihan ini, Anda dapat mengabaikan email ini. Akun Anda tetap aman.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 32px;">
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 0;">
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #475569;">
                  UPT K3 & Pengelolaan Laboratorium Terpadu POLIMDO
                </p>
                <p style="margin: 0; font-size: 10px; color: #94a3b8; line-height: 1.4;">
                  Jl. Kampus Polimdo, Buha, Mapanget, Kota Manado, Sulawesi Utara<br>
                  Email: k3@polimdo.ac.id • Layanan Darurat K3: (0431) 811-911
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { step } = body;

    const adminClient = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // =========================================================================
    // STEP 1: REQUEST OTP (Kirim Kode Otorisasi ke Email)
    // =========================================================================
    if (step === "request") {
      const { idNumber, email } = body;

      if (!idNumber && !email) {
        return NextResponse.json(
          { error: "NIP/NIDN/NIM atau Email wajib diisi." },
          { status: 400 }
        );
      }

      let targetEmail = (email || "").trim().toLowerCase();
      let recipientName = "Sivitas Akademika POLIMDO";
      let userId: string | null = null;

      // 1. Cari berdasarkan NIP/NIDN/NIM jika disediakan
      if (idNumber && idNumber.trim()) {
        const { data: profileByNip } = await adminClient
          .from("profiles")
          .select("id, email, nama_lengkap")
          .ilike("nip_nim", idNumber.trim())
          .maybeSingle();

        if (profileByNip) {
          targetEmail = profileByNip.email?.toLowerCase().trim() || targetEmail;
          recipientName = profileByNip.nama_lengkap || recipientName;
          userId = profileByNip.id;
        }
      }

      // 2. Jika belum ditemukan atau tidak pakai NIP, cari berdasarkan email
      if (!userId && targetEmail) {
        const { data: profileByEmail } = await adminClient
          .from("profiles")
          .select("id, email, nama_lengkap")
          .ilike("email", targetEmail)
          .maybeSingle();

        if (profileByEmail) {
          targetEmail = profileByEmail.email?.toLowerCase().trim() || targetEmail;
          recipientName = profileByEmail.nama_lengkap || recipientName;
          userId = profileByEmail.id;
        }
      }

      // 3. Fallback: Cari di auth.users jika di profiles belum ada
      if (!userId && targetEmail) {
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const foundUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === targetEmail
        );
        if (foundUser) {
          userId = foundUser.id;
          recipientName =
            (foundUser.user_metadata?.full_name as string) || recipientName;
        }
      }

      if (!targetEmail || !userId) {
        return NextResponse.json(
          {
            error:
              "Data akun dengan NIP/NIM atau Email tersebut tidak terdaftar di sistem SIM-LB3.",
          },
          { status: 404 }
        );
      }

      // Generate 6-digit numeric OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 menit

      // Nonaktifkan OTP sebelumnya yang belum digunakan untuk email ini
      await adminClient
        .from("password_reset_otps")
        .update({ used: true })
        .eq("email", targetEmail)
        .eq("used", false);

      // Simpan OTP baru ke database
      const { error: insertErr } = await adminClient
        .from("password_reset_otps")
        .insert({
          email: targetEmail,
          otp_code: otpCode,
          expires_at: expiresAt,
          used: false,
        });

      if (insertErr) {
        console.error("[SIM-LB3] Gagal menyimpan OTP ke DB:", insertErr);
        return NextResponse.json(
          { error: "Gagal memproses kode otorisasi. Silakan coba lagi." },
          { status: 500 }
        );
      }

      // Cek ketersediaan kredensial SMTP
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = Number(process.env.SMTP_PORT) || 465;

      if (!smtpUser || !smtpPass) {
        console.warn(
          `[SIM-LB3 NOTICE] SMTP_USER atau SMTP_PASS belum disetel di .env.local!\n` +
          `============================================================\n` +
          `KODE OTORISASI UNTUK [${targetEmail}]: ${otpCode}\n` +
          `============================================================`
        );
        return NextResponse.json({
          success: true,
          email: targetEmail,
          warning:
            "Kredensial SMTP belum diisi di .env.local. Kode otorisasi dicatat di log server untuk pengujian.",
          debugOtp: otpCode, // Membantu user saat setup awal sebelum memasukkan password email
        });
      }

      // Kirim email via Nodemailer
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const fromAddress =
          process.env.SMTP_FROM || `"SIM-LB3 POLIMDO" <${smtpUser}>`;

        await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject: `[SIM-LB3 POLIMDO] Kode Otorisasi Pemulihan Kata Sandi: ${otpCode}`,
          html: getEmailTemplate(otpCode, recipientName),
        });

        console.log(`[SIM-LB3] Email kode otorisasi berhasil dikirim ke: ${targetEmail}`);

        return NextResponse.json({
          success: true,
          email: targetEmail,
          message: `Kode otorisasi berhasil dikirimkan ke alamat email ${targetEmail}.`,
        });
      } catch (mailErr: unknown) {
        const errMsg = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error("[SIM-LB3] Kesalahan saat mengirim email:", errMsg);
        return NextResponse.json(
          {
            error: `Gagal mengirim email ke ${targetEmail}. Pastikan konfigurasi SMTP di file .env.local sudah sesuai. Detail: ${errMsg}`,
          },
          { status: 500 }
        );
      }
    }

    // =========================================================================
    // STEP 2: VERIFY OTP
    // =========================================================================
    if (step === "verify") {
      const { email, otpCode } = body;

      if (!email || !otpCode) {
        return NextResponse.json(
          { error: "Email dan kode verifikasi wajib diisi." },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otpCode.trim();

      const { data: record, error: findErr } = await adminClient
        .from("password_reset_otps")
        .select("*")
        .eq("email", cleanEmail)
        .eq("otp_code", cleanOtp)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findErr || !record) {
        return NextResponse.json(
          { error: "Kode otorisasi tidak valid atau telah digunakan." },
          { status: 400 }
        );
      }

      if (new Date(record.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "Kode otorisasi telah kadaluarsa. Silakan minta kode baru." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Kode otorisasi valid.",
      });
    }

    // =========================================================================
    // STEP 3: RESET PASSWORD (Update Kata Sandi Baru di Supabase Auth)
    // =========================================================================
    if (step === "reset") {
      const { email, otpCode, newPassword } = body;

      if (!email || !otpCode || !newPassword) {
        return NextResponse.json(
          { error: "Email, kode otorisasi, dan kata sandi baru wajib diisi." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi minimal 6 karakter." },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otpCode.trim();

      // Verifikasi OTP kembali
      const { data: record, error: findErr } = await adminClient
        .from("password_reset_otps")
        .select("*")
        .eq("email", cleanEmail)
        .eq("otp_code", cleanOtp)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findErr || !record) {
        return NextResponse.json(
          { error: "Sesi verifikasi tidak valid atau telah kadaluarsa." },
          { status: 400 }
        );
      }

      if (new Date(record.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "Kode otorisasi telah kadaluarsa. Silakan minta kode baru." },
          { status: 400 }
        );
      }

      // Cari user ID di Supabase Auth
      const { data: usersData, error: userListErr } =
        await adminClient.auth.admin.listUsers();

      if (userListErr || !usersData?.users) {
        return NextResponse.json(
          { error: "Gagal mengakses data autentikasi pengguna." },
          { status: 500 }
        );
      }

      const targetUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (!targetUser) {
        return NextResponse.json(
          { error: "Akun pengguna tidak ditemukan di auth server." },
          { status: 404 }
        );
      }

      // Update password di Supabase Auth
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(
        targetUser.id,
        { password: newPassword }
      );

      if (updateErr) {
        console.error("[SIM-LB3] Gagal memperbarui kata sandi:", updateErr);
        return NextResponse.json(
          { error: updateErr.message || "Gagal memperbarui kata sandi." },
          { status: 500 }
        );
      }

      // Tandai OTP sebagai telah digunakan
      await adminClient
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", record.id);

      return NextResponse.json({
        success: true,
        message: "Kata sandi berhasil diperbarui. Silakan login kembali.",
      });
    }

    return NextResponse.json({ error: "Step tidak valid." }, { status: 400 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan server internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
