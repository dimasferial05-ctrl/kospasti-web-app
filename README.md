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
- **Detail Kos Komprehensif:** 
  - Multi-tipe kamar (*Standard*, *Deluxe*, *Suite*) beserta spesifikasi dimensi dan sisa ketersediaan kamar.
  - Galeri media foto dan video interaktif lengkap dengan penampil layar penuh (*Lightbox Modal*).
  - Aturan kos, tata tertib, fasilitas lengkap, dan simulasi estimasi jarak ke tempat kuliah/kerja.
- **Sistem Ulasan & Rating Nyata:** Transparansi ulasan penyewa pasca-booking, rating bintang, dan balasan resmi dari pemilik kos.
- **Pemesanan Mudah (Instant Booking):** Formulir pemesanan kamar cepat dengan pilihan tanggal masuk fleksibel dan simulasi pembayaran instan (QRIS).
- **Wishlist & Kos Tersimpan:** Simpan kos idaman untuk perbandingan cepat tanpa kehilangan jejak.
- **Dukungan Tema Gelap & Terang:** Tampilan dinamis dan nyaman di mata dengan dukungan *Dark Mode* otomatis berbasis `next-themes`.
- **Progressive Web App (PWA):** Dapat diinstal langsung di layar utama smartphone Android/iOS maupun desktop tanpa melalui toko aplikasi.

### 2. 🤝 Portal Mitra KosPasti (`/partner`)
- **Dashboard Statistik & Okupansi:** Metrik *real-time* mengenai total kamar disewa, tingkat hunian (*occupancy rate*), dan estimasi pendapatan bulanan.
- **Manajemen Properti & Tipe Kamar:** Kontrol penuh atas ketersediaan kamar, deskripsi fasilitas, harga per bulan, foto galeri, dan aturan hunian.
- **Interaksi Ulasan Penghuni:** Pemilik kos dapat membalas ulasan dan masukan penyewa secara langsung dengan tanda akun resmi pemilik.
- **Manajemen Profil & Foto Avatar:** 
  - Unggah dan ubah foto profil pengelola / logo kos resmi (tersimpan di server media lokal aman).
  - Edit nama pengelola dan nomor WhatsApp aktif untuk jalur komunikasi calon penyewa.
- **Pusat Keamanan & Kata Sandi:** Form pembaruan kata sandi mandiri berenkripsi *bcrypt* dengan visibilitas intip sandi.
- **Rekening Pencairan Dana (Payout Method):** Pendaftaran rekening bank (BCA, Mandiri, BRI, BNI) atau dompet digital (GoPay, OVO, DANA) untuk penarikan hasil sewa pasca verifikasi admin.

### 3. 🛡️ Portal Admin KosPasti (`/admin`)
- **Pusat Analitik Operasional:** Ringkasan jumlah transaksi, status properti aktif, total mitra, dan antrean ulasan ulasan.
- **Moderasi & Approval Properti:** Meninjau kos baru (*PENDING_REVIEW*), menyetujui publikasi (*PUBLISHED*), atau menolak (*REJECTED*) dengan catatan alasan perbaikan.
- **Manajemen Pemilik Kos & Magic Link:** Kontrol seluruh data mitra serta pembuatan *Magic Link* WhatsApp instan untuk akses cepat tanpa kata sandi.
- **Master Lokasi Wilayah (299 Titik):** Pencarian, filter kategori, penambahan lokasi baru, serta sakelar toggle aktif/nonaktif lokasi.
- **Verifikasi & Pencairan Dana (Payouts):** Validasi nomor rekening mitra dan eksekusi pembayaran hasil sewa kamar.

### 4. 🤖 Asisten AI Rekomendasi
- Terintegrasi dengan **Gemini AI** (`@google/genai`) untuk membantu pencari kos menemukan rekomendasi hunian yang paling sesuai dengan anggaran, preferensi fasilitas, dan lokasi aktivitas pengguna.

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
- **`Booking`**: Transaksi pemesanan kamar oleh pengguna (Status: `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`).
- **`Review`**: Ulasan bintang, komentar penghuni, dan balasan resmi mitra (`reply`, `replied_at`).
- **`PayoutMethod` & `Payout`**: Rekening pencairan dana mitra dan riwayat transfer bagi hasil sewa.
- **`Location`**: 299 koordinat landmark, sekolah, universitas, dan pusat aktivitas di Subang.
- **`SavedProperty`**: Daftar kos favorit yang disimpan oleh pengguna (Wishlist).
- **`MagicLink`**: Autentikasi token sekali pakai via tautan WhatsApp.
- **`User`**: Akun penyewa / mahasiswa pencari kos.

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
| **AI Intelligence**| `@google/genai` | Gemini AI SDK untuk rekomendasi cerdas |
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

# Kunci Gemini AI (Opsional)
GEMINI_API_KEY="AIzaSyYourGeminiApiKey"
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
