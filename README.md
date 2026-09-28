# KosPasti Web App

KosPasti adalah platform cerdas dan inovatif yang menghubungkan pencari kos (mahasiswa/karyawan) dengan pemilik kos secara efisien. Dibangun dengan fokus pada kecepatan dan kemudahan (UX), aplikasi ini menghadirkan sistem pencarian kos interaktif dan pemesanan yang mulus bagi pengguna, serta sistem manajemen ketersediaan kamar yang sangat praktis bagi pemilik kos tanpa perlu menghafal *password* (menggunakan **Magic Link** via WhatsApp).

Selain itu, KosPasti juga dilengkapi dengan integrasi Peta (Google Maps) untuk pencarian berbasis lokasi, serta fitur kecerdasan buatan (AI) yang siap membantu memberikan rekomendasi kos terbaik.

## 🌟 Fitur Utama (MVP)

- **Pencarian Cerdas & Peta Interaktif:** Pencarian kos dengan filter lengkap dan visualisasi lokasi menggunakan Google Maps.
- **Asisten AI Terintegrasi:** Rekomendasi dan asisten pencarian cerdas bertenaga Gemini AI.
- **Detail Properti Komprehensif:** Informasi ketersediaan, fasilitas, harga, galeri foto, serta kebijakan kos.
- **Sistem Booking & Pembayaran (Dummy):** Formulir pemesanan kamar real-time dengan integrasi simulasi pembayaran QRIS.
- **Akses Tanpa Password (Magic Link):** Pemilik kos mengelola ketersediaan kamar hanya dengan sekali klik melalui tautan unik di WhatsApp.
- **Dashboard Admin:** Panel kontrol terpusat (berbasis PIN rahasia) untuk mengelola data kos, menyetujui transaksi, dan melihat statistik performa.

## 🏗️ Architecture & Folder Structure

Aplikasi ini dibangun di atas arsitektur *Monorepo* ringan menggunakan **Next.js App Router**, yang mencakup *frontend* (React) dan *backend* (API Routes) di dalam satu basis kode.

### Penamaan & Struktur Folder Utama:
```text
kospasti-web-app/
├── docs/                  # Dokumentasi proyek (PRODUCT_WIKI, isu, dsb.)
├── prisma/                # Skema database SQLite dan file 'seed.ts' untuk dummy data
├── src/
│   ├── app/               # Next.js App Router (Halaman & Endpoint API)
│   │   ├── admin/         # Halaman Dashboard Admin
│   │   ├── api/           # Backend REST API Routes
│   │   ├── checkout/      # Halaman Pemesanan & Pembayaran
│   │   ├── property/      # Halaman Detail Kos
│   │   ├── update/        # Halaman khusus Pemilik Kos (Akses via Magic Link)
│   │   ├── layout.tsx     # Root layout & navigasi utama
│   │   └── page.tsx       # Halaman Beranda (Search & List Kos)
│   ├── components/        # Komponen React yang dapat digunakan ulang (Reusable)
│   │   └── ui/            # Komponen dasar antarmuka dari shadcn/ui
│   └── lib/               # Konfigurasi utilitas inti (Prisma client, class merger)
└── test/                  # Kumpulan Unit Test & Integration Test (Vitest)
```

## 🔌 Available APIs

Sistem *backend* menyediakan kumpulan REST API berikut untuk mendukung fungsionalitas UI:

**Properti & Pencarian:**
- `GET /api/properties` - Mengambil daftar kos (dengan filter pencarian).
- `GET /api/properties/[id]` - Mengambil detail dari satu kos secara spesifik.

**Transaksi & Booking:**
- `POST /api/bookings` - Membuat pesanan (booking) kamar baru.

**Magic Link (Autentikasi Pemilik Kos):**
- `POST /api/magic-link/generate` - Membuat *token* Magic Link baru untuk dikirim ke nomor WA pemilik kos.
- `GET /api/magic-link/validate?token=...` - Memvalidasi ketersediaan dan status kadaluarsa token.
- `PATCH /api/magic-link/update` - Memperbarui jumlah ketersediaan kamar (diakses oleh token valid).

**Admin Panel:**
- `GET /api/admin/stats` - Mengambil data statistik (Total booking, kos aktif, dsb).
- `GET /api/admin/properties` - Mengambil data seluruh properti untuk dikelola admin.
- `GET /api/admin/bookings` - Mengambil riwayat *booking* mahasiswa.
- `PATCH /api/admin/bookings/[id]` - Mengubah status transaksi *booking* (Setujui/Tolak).

## 🗄️ Database Schema

Database menggunakan relasi standar *SQL* melalui **Prisma ORM**. Terdapat 4 model utama:

1. **Owner:** Pemilik properti (kos).
   - `id`, `name`, `whatsapp_number` (Unique)
2. **Property:** Data kos yang disewakan.
   - `id`, `name`, `price_per_month`, `available_rooms`, `gender_type`, `facilities`, `image_url`
   - Berelasi dengan *Owner* (One-to-Many).
3. **Booking:** Catatan transaksi dari mahasiswa.
   - `id`, `student_name`, `student_whatsapp`, `move_in_date`, `status` (PENDING/SUCCESS/REJECTED/CANCELLED).
   - Berelasi dengan *Property* (One-to-Many).
4. **MagicLink:** Penyimpanan token unik autentikasi.
   - `id`, `token` (Unique), `expires_at`, `is_used`
   - Berelasi dengan *Owner* (One-to-Many).

## 💻 Technology Stack

- **Framework Utama:** Next.js 16 (App Router) + React 19
- **Bahasa Pemrograman:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database & ORM:** SQLite + Prisma
- **Testing:** Vitest

## 📚 Libraries Digunakan

- `@google/genai`: Integrasi Gemini AI untuk fitur kecerdasan buatan.
- `@vis.gl/react-google-maps`: Komponen Peta interaktif dari Google Maps.
- `@base-ui/react`: Komponen *headless* modern dari MUI Base.
- `shadcn/ui` & `lucide-react`: Primitif antarmuka aksesibel dan ikon SVG minimalis.
- `clsx` & `tailwind-merge`: Utilitas manipulasi *class* dinamis untuk Tailwind.

## 🚀 Setup Project & Cara Menjalankan

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di lingkungan lokal komputer Anda:

1. **Kloning Repositori & Masuk ke Folder Proyek**
   ```bash
   git clone https://github.com/dimasferial05-ctrl/kospasti-web-app.git
   cd kospasti-web-app
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Inisialisasi Database (SQLite)**
   ```bash
   npx prisma db push
   ```

4. **Isi Database dengan Dummy Data (Opsional)**
   Agar aplikasi tidak kosong, sangat disarankan untuk menjalankan *seed*.
   ```bash
   npx prisma db seed
   ```

5. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Buka peramban (browser) dan akses `http://localhost:3000`. Akses halaman admin di `http://localhost:3000/admin`.

## 🧪 Cara Test Aplikasi

Aplikasi ini menggunakan **Vitest** untuk menguji API *(Integration Testing)* maupun Komponen React *(Unit Testing)*. Saat ini terdapat >140 skenario pengujian dengan tingkat kelulusan 100%.

Untuk menjalankan *test suite*, jalankan perintah:
```bash
npm run test
```
Ini akan mengeksekusi semua file *test* yang berada di dalam *folder* `test/` dan menampilkan hasilnya pada konsol.
