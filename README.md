# 🏡 KosPasti Web App

<div align="center">

![KosPasti Desktop Preview](public/images/desktop-preview.jpeg)

**Platform Cerdas Ekosistem Pencarian, Pemesanan, dan Manajemen Kos Terintegrasi**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-v6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PWA Ready](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

</div>

---

## 📖 Tentang KosPasti

**KosPasti** adalah platform *prop-tech* modern yang dirancang khusus untuk menjembatani mahasiswa, karyawan, dan pencari hunian sewa dengan pemilik kos secara transparan, aman, dan tanpa repot. Dibangun dengan fokus utama pada kecepatan akses, estetika visual premium *(anti-AI Slop)*, serta kemudahan antarmuka (UX) di perangkat bergerak (*mobile-first*).

KosPasti menghadirkan ekosistem menyeluruh yang terdiri dari:
1. **Portal Publik & Pencarian** untuk penyewa kamar.
2. **Portal Pengelola Kos (Mitra)** untuk otomasi pengelolaan properti, ulasan, profil, dan pencairan dana sewa.
3. **Panel Admin Terpusat** untuk pengawasan operasional, moderasi properti, manajemen lokasi wilayah, dan verifikasi keuangan.

---

## ✨ Fitur Unggulan

### 1. 🔍 Portal Pencari Kos (Penyewa / Mahasiswa)
- **Pencarian Cerdas & Peta Interaktif:** Pencarian berbasis radius jarak (*Haversine Formula*), nama kos, gender (Putra/Putri/Campur), dan harga sewa. Terintegrasi langsung dengan Google Maps interaktif.
- **299 Titik Master Lokasi Subang:** Pencarian akurat berdasarkan kampus, sekolah, rumah sakit, landmark, pabrik, dan kecamatan di seluruh wilayah Subang.
- **Perbandingan Kos Interaktif (`/compare`):** Fitur pembanding hingga 3 kos sekaligus secara berdampingan (harga, fasilitas, tipe kamar, kebijakan hewan/jam malam, dan jarak ke kampus).
- **Penjadwalan Survei Kos Langsung (`/survey`):** Formulir janji temu survei kos offline dengan pemilik kos, pemilihan slot waktu kunjungan, dan sinkronisasi otomatis via WhatsApp Magic Link.
- **Verifikasi Identitas Cerdas (AI-Assisted Tenant KYC):**
  - Unggah foto KTP / Kartu Tanda Mahasiswa (KTM).
  - Ekstraksi OCR otomatis dan pencocokan nama berbasis AI Gemini Multimodal Vision (`@google/genai`).
  - Lencana centang hijau **"Penyewa Terverifikasi"** pada profil, pesan obrolan (*Chat*), dan formulir booking.
  - Penyamaran (*masking*) nomor NIK/NIM sesuai regulasi kepatuhan privasi (UU Perlindungan Data Pribadi / PDP).
- **Detail Kos Komprehensif:** 
  - Multi-tipe kamar (*Standard*, *Deluxe*, *Suite*) beserta spesifikasi dimensi dan sisa ketersediaan kamar.
  - Galeri media foto dan video interaktif lengkap dengan penampil layar penuh (*Lightbox Modal*).
  - Aturan kos, tata tertib, fasilitas lengkap, dan simulasi estimasi jarak ke tempat kuliah/kerja.
- **Sistem Ulasan & Rating Nyata:** Transparansi ulasan penyewa pasca-booking, rating bintang, dan balasan resmi dari pemilik kos.
- **Pemesanan Mudah (Instant Booking) & Escrow Deposit:** 
  - Formulir pemesanan kamar cepat dengan pilihan tanggal masuk fleksibel.
  - Pembayaran online terintegrasi Midtrans Snap (QRIS, Virtual Account, GoPay/ShopeePay).
  - Penahanan dana sewa dan deposit jaminan kerusakan aman dalam rekening penampung (*Escrow System*).
- **Surat Perjanjian Sewa Digital (SPK Digital di `/contract/[bookingId]`):** Dokumen kontrak sewa resmi digital dengan tanda tangan digital sistem, hak & kewajiban penghuni, dan klausul deposit.
- **Berita Acara Digital Serah Terima Kamar (Check-in BAST di `/inspection/[bookingId]`):**
  - Tampilan dokumen BAST resmi digital siap cetak (*print-friendly* / PDF).
  - Dokumentasi kondisi fisik awal fasilitas kamar (AC, Kasur, Dinding, Kamar Mandi) dengan bukti foto yang dikunci permanen (*baseline*).
  - Konfirmasi digital kesepakatan kondisi kamar antara mahasiswa dan pemilik kos.
- **Kuitansi Pembayaran Digital (`/receipt/[bookingId]`):** Invoice & bukti pelunasan sewa resmi yang tersimpan secara offline-ready di browser pengguna.
- **Tagihan Sewa Berulang (Recurring Invoices):** Otomatisasi penerbitan invoice perpanjangan sewa bulanan dengan pengingat H-7 dan H-3 via WhatsApp Fonnte.
- **Obrolan Langsung & Masking Privasi (`/chat`):** Obrolan *real-time* via Supabase Realtime dengan masking nomor HP/kontak sebelum booking resmi disetujui.
- **Pusat Bantuan & Edukasi Transaksi (`/bantuan`):** Dokumentasi FAQ lengkap untuk penyewa dan pemilik kos mengenai tata cara sewa, garansi ketersediaan, dan pengembalian dana.
- **Wishlist & Kos Tersimpan (`/favorit`):** Simpan kos idaman untuk perbandingan cepat tanpa kehilangan jejak.
- **Dukungan Tema Gelap & Terang:** Tampilan dinamis dan nyaman di mata dengan dukungan *Dark Mode* otomatis berbasis `next-themes`.
- **Progressive Web App (PWA & Offline Cache):** Dapat diinstal langsung di layar utama smartphone Android/iOS maupun desktop dengan dukungan cache offline IndexedDB/LocalStorage.

### 2. 🤝 Portal Mitra KosPasti (`/partner`)
- **Dashboard Statistik & Okupansi:** Metrik *real-time* mengenai total kamar disewa, tingkat hunian (*occupancy rate*), dan estimasi pendapatan bulanan.
- **Manajemen Nomor Kamar & Inventaris Fisik (Room Units):**
  - Penetapan nomor kamar fisik spesifik (misal: "101", "204") dan lantai saat menyetujui pesanan sewa.
  - Pelacakan status unit fisik secara langsung (`VACANT`, `OCCUPIED`, `MAINTENANCE`).
- **Pencatatan Berita Acara Digital (Check-in Inspection Modal):**
  - Form serah terima kamar digital saat hari *check-in* penyewa: ambil foto kondisi fasilitas (AC, Kasur, Dinding, Kamar Mandi) langsung dari kamera HP.
  - Penyimpanan foto ke Supabase Storage dan penguncian baseline otomatis.
  - Akses perbandingan bukti foto awal saat checkout ketika terjadi klaim kerusakan deposit jaminan.
- **Badge Keamanan Penyewa Terverifikasi:** Indikator badge terverifikasi pada calon penyewa di daftar pesanan masuk dan ruang obrolan (*Chat*).
- **Manajemen Jadwal Survei Masuk (`/partner/dashboard/visits`):** Persetujuan atau penjadwalan ulang janji temu survei calon penyewa.
- **Pelepasan Deposit & Checkout Kamar:** Evaluasi kondisi kamar pasca-sewa, opsi pengembalian 100% deposit ke penyewa atau klaim biaya perbaikan fisik.
- **Ekspor Laporan Keuangan:** Unduh rekapitulasi data pesanan dan rincian transaksi keuangan ke format CSV/Excel atau PDF siap cetak.
- **Manajemen Properti & Tipe Kamar:** Kontrol penuh atas ketersediaan kamar, deskripsi fasilitas, harga per bulan, foto galeri, dan aturan hunian.
- **Generator Deskripsi AI Otomatis:** Pembuatan deskripsi promosi kos otomatis berbasis Gemini AI hanya dengan 1 klik.
- **Interaksi Ulasan Penghuni:** Pemilik kos dapat membalas ulasan dan masukan penyewa secara langsung dengan tanda akun resmi pemilik.
- **Manajemen Profil & Foto Avatar:** 
  - Unggah dan ubah foto profil pengelola / logo kos resmi (tersimpan di Supabase Storage / storage lokal aman).
  - Edit nama pengelola dan nomor WhatsApp aktif untuk jalur komunikasi calon penyewa.
- **Pusat Keamanan & Kata Sandi:** Form pembaruan kata sandi mandiri berenkripsi *bcrypt* dengan visibilitas intip sandi.
- **Rekening Pencairan Dana (Payout Method):** Pendaftaran rekening bank (BCA, Mandiri, BRI, BNI) atau dompet digital (GoPay, OVO, DANA) untuk penarikan hasil sewa pasca verifikasi admin.

### 3. 🛡️ Portal Admin KosPasti (`/admin`)
- **Pusat Analitik Operasional:** Ringkasan jumlah transaksi, status properti aktif, total mitra, dan antrean ulasan.
- **Moderasi & Approval Properti:** Meninjau kos baru (*PENDING_REVIEW*), menyetujui publikasi (*PUBLISHED*), atau menolak (*REJECTED*) dengan catatan alasan perbaikan.
- **Manajemen Pemilik Kos & Magic Link:** Kontrol seluruh data mitra serta pembuatan *Magic Link* WhatsApp instan untuk akses cepat tanpa kata sandi.
- **Master Lokasi Wilayah (299 Titik):** Pencarian, filter kategori, penambahan lokasi baru, serta sakelar toggle aktif/nonaktif lokasi.
- **Verifikasi & Pencairan Dana Otomatis (Midtrans Iris):** Validasi nomor rekening mitra dan eksekusi transfer dana sewa via payment gateway Iris Disbursement API.
- **Moderasi Ulasan & Pelaporan:** Sembunyikan atau tindaklanjuti ulasan yang melanggar ketentuan komunitas.

### 4. 🤖 Asisten AI & Visi Cerdas (Gemini Multimodal)
- **Rekomendasi Cerdas Kos (`/api/ai-search`):** Membantu pencari kos menemukan hunian terbaik berdasarkan preferensi anggaran, fasilitas, dan lokasi.
- **Generator Deskripsi Properti AI (`/api/ai/generate-description`):** Membantu pemilik kos membuat deskripsi properti menarik dan profesional secara otomatis.
- **AI-Assisted Tenant KYC (Vision OCR di `/api/user/kyc`):** Membaca kartu KTP/KTM secara multimodal, mengekstrak NIK/NIM dan nama, serta mencocokkan identitas secara otomatis dan privat.

### 5. ⏰ Background Automation (Cron Jobs)
- **Tagihan Sewa Bulanan (`/api/cron/billing-invoices`):** Pembuatan otomatis tagihan sewa bulan ke-2, ke-3, dst. untuk penyewa aktif.
- **Pengingat Jatuh Tempo (`/api/cron/payment-reminder`):** Pengiriman pesan WhatsApp pengingat otomatis pada H-7 dan H-3 sebelum tanggal jatuh tempo sewa.
- **Siklus Hidup Booking (`/api/cron/booking-lifecycle`):** Pembatalan otomatis pesanan yang kedaluwarsa atau belum dibayar dalam batas waktu pembayaran.
- **Pembaruan Bulanan Mitra (`/api/cron/monthly-update`):** Pengiriman notifikasi WhatsApp berkala kepada pemilik kos untuk memastikan ketersediaan kamar selalu akurat.

---

## 🛠️ Arsitektur & Struktur Direktori

Aplikasi ini menggunakan arsitektur monorepo modular berbasis **Next.js 16 App Router**:

```text
kospasti-web-app/
├── docs/                     # Dokumentasi panduan teknis, DESIGN.md, dan product spec
├── prisma/                   # Skema Prisma ORM & script database seeding
│   ├── schema.prisma         # Definisi model entitas database PostgreSQL
│   ├── seed-safe-append.ts   # Script penambahan data dummy aman (tanpa menghapus data)
│   ├── seed-locations.ts     # Script pengisi 299 Master Lokasi Subang
│   └── data_kos_subang.json  # Dataset kos riil wilayah Subang
├── public/                   # Aset publik statis (ikon PWA, manifest, favicon)
├── src/
│   ├── app/                  # Next.js App Router (Halaman & REST API)
│   │   ├── admin/            # Portal Dashboard Admin (/admin, /admin/owners, /admin/locations)
│   │   ├── api/              # Backend API Route Handlers
│   │   │   ├── admin/        # Endpoint khusus operasional admin
│   │   │   ├── partner/      # Endpoint profil, password, properti, & payout mitra
│   │   │   ├── properties/   # Endpoint katalog kos, pencarian, & ulasan
│   │   │   └── user/         # Endpoint sesi pengguna & wishlist
│   │   ├── kos/[id]/         # Halaman Detail Properti Kos Publik
│   │   ├── partner/          # Portal Khusus Pengelola Kos (/partner/dashboard, /profile)
│   │   ├── layout.tsx        # Layout utama aplikasi & penyedia tema
│   │   └── page.tsx          # Halaman Beranda (Discovery & Peta Pencarian)
│   ├── components/           # Komponen React Modular
│   │   ├── features/         # Komponen spesifik fitur (ReviewSection, SearchFilter, dsb.)
│   │   ├── map/              # Komponen peta interaktif Google Maps
│   │   └── ui/               # Primitif antarmuka aksesibel (Button, Card, Input, Toast)
│   └── lib/                  # Utilitas inti (Prisma Client, JWT Auth, Upload Helper)
└── test/                     # Berkas pengujian unit & integrasi (Vitest)
    ├── partner-profile.test.ts
    ├── owner-review-reply-profile.test.ts
    └── ...
```

---

## 🗄️ Skema Database (Prisma ORM)

Database menggunakan **PostgreSQL (Neon Serverless)** yang terhubung via Prisma dengan model-model utama:

- **`Owner`**: Akun mitra pemilik kos (Nama, WhatsApp, Email, Password Terenkripsi, URL Avatar).
- **`Property`**: Data kos (Nama, Harga, Kamar Tersedia, Tipe Gender, Fasilitas, Titik Koordinat, Status Moderasi, Aturan, Syarat Sewa).
- **`RoomType`**: Varian tipe kamar kos beserta fasilitas dan tarif per bulan.
- **`Booking`**: Transaksi pemesanan kamar oleh pengguna (Status: `PENDING`, `APPROVED`, `ACCEPTED`, `COMPLETED`, `REJECTED`, `CANCELLED`).
- **`RoomUnit`**: Inventaris nomor kamar fisik (misal: "101", "204"), nomor lantai, dan status ketersediaan (`VACANT`, `OCCUPIED`, `MAINTENANCE`).
- **`CheckinInspection`**: Berita acara digital serah terima kondisi kamar saat check-in (AC, Kasur, Dinding, Kamar Mandi) dengan bukti foto baseline terkunci.
- **`TenantIdentityVerification`**: Rekam jejak verifikasi identitas cerdas penyewa (KTP/KTM OCR) berbasis Gemini AI dengan skor kemiripan nama dan status verifikasi.
- **`Invoice`**: Tagihan sewa berulang bulanan (*recurring billing*) terintegrasi Midtrans Snap URL dan pengingat jatuh tempo H-7 & H-3.
- **`VisitSchedule`**: Penjadwalan survei kunjungan fisik kos antara pencari kos dan pemilik.
- **`ChatRoom` & `ChatMessage`**: Ruang obrolan langsung penyewa-pemilik terintegrasi Supabase Realtime dengan *masking* privasi kontak.
- **`Notification`**: Pusat notifikasi In-App untuk pembaruan booking, pembayaran, dan sistem.
- **`Review`**: Ulasan bintang, komentar penghuni, dan balasan resmi mitra (`reply`, `replied_at`).
- **`PayoutMethod` & `Payout`**: Rekening pencairan dana mitra dan riwayat transfer bagi hasil sewa via Midtrans Iris.
- **`Location`**: 299 koordinat landmark, sekolah, universitas, dan pusat aktivitas di Subang.
- **`SavedProperty`**: Daftar kos favorit yang disimpan oleh pengguna (Wishlist).
- **`MagicLink`**: Autentikasi token sekali pakai via tautan WhatsApp (update sisa kamar & verifikasi survei).
- **`User`**: Akun penyewa / mahasiswa pencari kos (dengan status `is_identity_verified`).

---

## 💻 Tech Stack & Ketergantungan Utama

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.4 (App Router) | React Server Components & Turbopack |
| **Library UI** | React 19 & Tailwind CSS v4 | Styling modern, performa tinggi, CSS Variables |
| **Bahasa** | TypeScript 5 | *Strict Type-Safety* di seluruh lapisan kode |
| **Database** | PostgreSQL via Neon | Serverless PostgreSQL Database |
| **ORM** | Prisma v6 | Type-safe Database Client & Schema Migration |
| **Peta Interaktif** | `@vis.gl/react-google-maps` | Google Maps Platform API SDK |
| **AI Intelligence**| `@google/genai` | Gemini AI Multimodal SDK (Vision OCR, search, deskripsi) |
| **Media & Storage** | Supabase Storage (`@supabase/supabase-js`) | Penyimpanan cloud publik aman untuk media & dokumen KYC |
| **Payment Gateway** | Midtrans Snap & Iris API | Pembayaran QRIS/VA & pencairan dana otomatis (Disbursement) |
| **WhatsApp Gateway**| Fonnte API (`/api/send`) | Otomasi notifikasi pesan & Magic Link WhatsApp |
| **Keamanan** | `bcryptjs` & `jose` | Hashing kata sandi aman & HTTP-only JWT Cookie Session |
| **PWA** | `@ducanh2912/next-pwa` | Service worker & instalabilitas aplikasi offline-ready |
| **Ikonografi** | `lucide-react` | Set ikon antarmuka SVG modern & konsisten |
| **Animasi** | `motion` & `tw-animate-css` | Micro-interactions yang halus dan elegan |
| **Testing** | Vitest v4 | Test runner ultra-cepat untuk unit & integrasi |

---

## 🚀 Panduan Memulai (Local Setup)

### 1. Kloning Repositori
```bash
git clone https://github.com/dimasferial05-ctrl/kospasti-web-app.git
cd kospasti-web-app
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas contoh atau buat berkas `.env` di direktori *root*:
```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/kospasti?sslmode=require"
JWT_SECRET="kunci-rahasia-jwt-super-aman-kospasti"
ADMIN_PIN="123456"

# Kunci Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyYourGoogleMapsApiKey"

# Kunci Gemini AI (Untuk rekomendasi cerdas, generator deskripsi, & KYC OCR)
GEMINI_API_KEY="AIzaSyYourGeminiApiKey"

# Supabase Storage (Penyimpanan foto media, berita acara, & dokumen identitas)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# WhatsApp Fonnte Gateway (Pengiriman notifikasi otomatis & Magic Link)
FONNTE_TOKEN="your-fonnte-token"

# Midtrans Payment Gateway & Iris Disbursement
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
MIDTRANS_IRIS_API_KEY="IRIS-xxxx"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
```

### 4. Sinkronisasi Skema Database
Pastikan skema Prisma tersinkronisasi ke database Anda:
```bash
npx prisma db push
npx prisma generate
```

### 5. Pengisian Data Awal (Seeding)
Gunakan skrip **Safe Append** agar data database tidak terhapus:
```bash
# Menambahkan kos dummy & kos Subang tanpa menghapus data yang sudah ada:
npx tsx prisma/seed-safe-append.ts

# Mengisi 299 Master Lokasi Subang:
npx tsx prisma/seed-locations.ts
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban:
- **Portal Publik:** [http://localhost:3000](http://localhost:3000)
- **Portal Mitra Kos:** [http://localhost:3000/partner/dashboard](http://localhost:3000/partner/dashboard)
- **Portal Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🧪 Panduan Pengujian (Testing)

> [!WARNING]
> ### ⚠️ ATURAN PENTING EKSEKUSI PENGUJIAN:
> **JANGAN PERNAH** menjalankan `npm test`, `npm run test`, atau `npx vitest run` secara global tanpa argumen berkas spesifik pada lingkungan yang terhubung ke database operasional.
> 
> Beberapa berkas pengujian integrasi global lama berisi perintah pembersihan database (`deleteMany`). Jalankan **HANYA** pengujian unit tertarget untuk fitur yang sedang dikerjakan.

Contoh eksekusi pengujian spesifik yang aman:
```bash
# Menguji modul Profil & Keamanan Akun Mitra:
npx vitest run test/partner-profile.test.ts

# Menguji integrasi balasan ulasan pengelola kos:
npx vitest run test/owner-review-reply-profile.test.ts
```

Memeriksa kualitas dan standar kode:
```bash
npx eslint .
```

---

## 📄 Lisensi & Kontribusi

Proyek ini dikembangkan secara privat untuk ekosistem KosPasti. Seluruh hak cipta dan kepemilikan kode berada di bawah pengawasan **Dimas Ferial Hidayat** & tim pengembang KosPasti.
