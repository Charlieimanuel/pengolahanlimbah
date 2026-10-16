# Panduan Deployment SIM-LB3 di VPS Lokal Indonesia (Domain: polimdo.ac.id)

Panduan praktis langkah-demi-langkah untuk melakukan *deployment* mandiri (*self-hosted*) aplikasi **SIM-LB3 POLIMDO** menggunakan **VPS Cloud Provider Lokal Indonesia** (seperti IDCloudHost, Biznet Gio, DomaiNesia, dll.) dan dihubungkan ke subdomain resmi kampus **`limbahb3.polimdo.ac.id`**.

---

## 1. Pemilihan Provider & Spesifikasi Paket VPS Lokal

Pilihlah salah satu provider Cloud VPS Indonesia terpercaya dengan lokasi *datacenter* di **Jakarta / Indonesia** agar akses dari kampus POLIMDO Manado sangat cepat (latensi rendah < 20 ms):

### Rekomendasi Provider VPS Lokal:
1. **IDCloudHost** (Cloud VPS KVM - Datacenter Jakarta) — *Sangat direkomendasikan, pembayaran mudah via QRIS/VA*.
2. **Biznet Gio** (NEO Lite / GIO Cloud - Datacenter Midplaza Jakarta).
3. **DomaiNesia** atau **Rumahweb** (Cloud VPS Indonesia).

### Spesifikasi Paket yang Direkomendasikan:
* **Sistem Operasi**: **Ubuntu 22.04 LTS** atau **Ubuntu 24.04 LTS (64-bit)**
* **Processor (vCPU)**: Minimal 2 Core (Disarankan 4 Core)
* **Memori (RAM)**: **4 GB RAM** (Disarankan 6 GB - 8 GB untuk performa maksimal Next.js + Supabase)
* **Penyimpanan**: Minimal 40 GB – 60 GB SSD / NVMe
* **Alamat IP**: 1x IPv4 Publik Statis (*Public Static IPv4*)

> 💡 **Catatan**: Setelah memesan VPS, Anda akan menerima email/dashboard berisi **IP Publik VPS** (contoh: `103.187.xxx.xxx`) dan kata sandi *root*.

---

## 2. Pengaturan DNS Subdomain di Kampus (UPT TIK POLIMDO)

Hubungi Tim Pengelola Domain / Jaringan UPT TIK POLIMDO dan minta pembuatan **A Record** baru:

```text
Tipe Record : A
Subdomain   : limbahb3 (atau k3l / sim-lb3)
Domain Penuh: limbahb3.polimdo.ac.id
Target IP   : [Masukkan IP Publik VPS Lokal Anda]
TTL         : 3600 (1 Jam)
```

> **Verifikasi DNS**: Cek di komputer Anda via Command Prompt / Terminal:
> ```bash
> ping limbahb3.polimdo.ac.id
> ```
> Jika sudah merespons dengan IP VPS Anda, DNS sudah aktif!

---

## 3. Masuk ke VPS & Instalasi Prasyarat

Buka **PowerShell** / **Terminal Windows** di laptop Anda, lalu hubungkan ke VPS:

```bash
ssh root@IP_PUBLIK_VPS_ANDA
```
*(Ketik kata sandi root saat diminta)*.

### A. Perbarui Sistem Operasi
```bash
apt update && apt upgrade -y
```

### B. Pasang Paket Dasar & Firewall
```bash
apt install -y curl git ufw nginx certbot python3-certbot-nginx htop
```

### C. Pasang Docker & Docker Compose Engine Resmi
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### D. Amankan Firewall VPS (UFW)
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## 4. Unduh Kode & Konfigurasi Lingkungan Produksi

### A. Siapkan Folder Aplikasi
```bash
mkdir -p /var/www/limbah-b3
cd /var/www/limbah-b3
```

### B. Ambil Kode Proyek
Anda bisa melakukan `git clone` dari repositori GitHub/GitLab Anda:
```bash
git clone <URL_REPOSITORY_ANDA> .
```
*(Atau upload folder proyek dari laptop menggunakan WinSCP / FileZilla)*.

### C. Buat File `.env` Produksi
```bash
cp .env.example .env
nano .env
```

Sesuaikan nilai-nilai berikut di dalam file `.env`:
```env
# 1. URL Domain Resmi Kampus
SITE_URL=https://limbahb3.polimdo.ac.id
NEXT_PUBLIC_SUPABASE_URL=https://limbahb3.polimdo.ac.id/api-db

# 2. Keamanan Database PostgreSQL di VPS
POSTGRES_PASSWORD=PolimdoLimbahB3_Aman2026!
DATABASE_URL=postgres://postgres:PolimdoLimbahB3_Aman2026!@localhost:5432/postgres

# 3. Kunci Kriptografi JWT Supabase
JWT_SECRET=rahasia-kunci-jwt-super-aman-polimdo-b3-2026-secure

# 4. Layanan Email (Notifikasi Lupa Sandi Akun)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=email.kampus@gmail.com
SMTP_PASS=password-aplikasi-16-karakter
SMTP_FROM="SIM-LB3 POLIMDO <email.kampus@gmail.com>"
```
*Tekan `Ctrl + O`, `Enter` lalu `Ctrl + X` untuk menyimpan di editor nano.*

---

## 5. Menjalankan Database & Backend Supabase

### A. Jalankan Container Supabase
```bash
docker compose -f docker-compose.supabase.yml up -d
```

Periksa status container yang sedang berjalan:
```bash
docker ps
```
Pastikan container `supabase-db`, `supabase-kong`, `supabase-auth`, dan `supabase-meta` berstatus *Up (healthy)*.

### B. Injeksi Skema Database & Migrasi
Jalankan perintah ini satu kali untuk membuat tabel dan aturan keamanan RLS:
```bash
docker exec -i supabase-db psql -U postgres -d postgres < supabase/schema.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/01_setup_auth.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/02_fix_auth_mfa.sql
```

### C. Buat Akun Petugas Admin K3L Default
Pasang dependensi sementara di server untuk menjalankan seeding:
```bash
npm install -g tsx
tsx src/scripts/setup-admin.ts
```
*(Akun admin resmi `admin@polimdo.ac.id` dengan sandi `AdminK3L2026!` berhasil dibuat)*.

---

## 6. Menjalankan Frontend Next.js

Jalankan container aplikasi web Next.js secara *standalone*:
```bash
docker compose up -d --build
```
Aplikasi web Next.js sekarang aktif di latar belakang pada port internal `3000`.

---

## 7. Konfigurasi Nginx & Sertifikat SSL HTTPS (Let's Encrypt)

Agar pengguna dapat membuka website secara aman (`https://limbahb3.polimdo.ac.id`), kita gunakan Nginx sebagai gerbang utama (*Reverse Proxy*):

### A. Buat Konfigurasi Virtual Host Nginx
```bash
nano /etc/nginx/sites-available/limbahb3.polimdo.ac.id
```

Tempelkan konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name limbahb3.polimdo.ac.id;

    client_max_body_size 50M;

    # 1. Forward ke Aplikasi Web Next.js (Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Forward ke Gateway API Supabase (Port 8000)
    location /api-db/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### B. Aktifkan Konfigurasi Nginx
```bash
ln -s /etc/nginx/sites-available/limbahb3.polimdo.ac.id /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### C. Pasang Sertifikat SSL HTTPS Gratis (Let's Encrypt)
```bash
certbot --nginx -d limbahb3.polimdo.ac.id
```
- Masukkan alamat email Anda untuk pemberitahuan sertifikat.
- Setujui syarat penggunaan (*Terms of Service*).
- Pilih opsi **Redirect HTTP to HTTPS** (otomatis).

---

## 8. Backup Otomatis Database di VPS (Kepatuhan Regulasi PP 22/2021)

Data inventaris limbah B3 kampus wajib disimpan dengan aman. Buat pencadangan (*backup*) otomatis setiap hari Minggu pukul 02:00 malam:

```bash
mkdir -p /var/backups/limbah-b3
nano /usr/local/bin/backup-limbah-b3.sh
```

Isi file backup:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/limbah-b3"
DATE=$(date +"%Y%m%d_%H%M%S")

# Dump database PostgreSQL dari container
docker exec supabase-db pg_dump -U postgres postgres | gzip > "$BACKUP_DIR/db_limbah_b3_$DATE.sql.gz"

# Hapus backup yang usianya lebih dari 90 hari untuk menghemat ruang disk
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +90 -delete
```

Aktifkan izin dan jadwalkan cron:
```bash
chmod +x /usr/local/bin/backup-limbah-b3.sh
(crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/backup-limbah-b3.sh") | crontab -
```

---

## 9. Cara Update Aplikasi di Masa Mendatang (Maintenance)

Jika Anda melakukan perubahan kode dan ingin meng-update server:
```bash
cd /var/www/limbah-b3
git pull origin main
docker compose up -d --build
```
Aplikasi akan langsung diperbarui tanpa waktu henti (*zero-downtime*) dan database tetap aman.

---

## 10. Pengujian Akhir
Buka browser dan kunjungi:
- **`https://limbahb3.polimdo.ac.id`**
- Pastikan status gembok hijau HTTPS aktif.
- Coba login dengan akun:
  - **Email**: `admin@polimdo.ac.id`
  - **Password**: `AdminK3L2026!`
- Akses menu Verifikasi Tiket, Logbook TPS, dan Neraca Limbah untuk memastikan semua sistem berfungsi normal.
