# KosPasti Web App

KosPasti adalah aplikasi web inovatif yang menjembatani pencari kos (mahasiswa) dengan pemilik kos (Ibu Kos). Aplikasi ini didesain dengan pendekatan minimalis, menghadirkan sistem pemesanan kos yang mulus bagi mahasiswa dan sistem manajemen ketersediaan kamar yang sangat mudah bagi pemilik kos (tanpa *password*, cukup menggunakan **Magic Link** via WhatsApp).

## 🌟 MVP Features (Minimum Viable Product)

- **Pencarian & Filter Kos:** Mahasiswa dapat mencari dan menyaring properti kos sesuai kebutuhan.
- **Detail Properti:** Menampilkan informasi fasilitas, harga, tipe kos (putra/putri), dan ketersediaan kamar.
- **Sistem Booking & Escrow Dummy:** Formulir pemesanan kamar lengkap dengan simulasi pembayaran QRIS (Dummy).
- **Magic Link Auth:** Pemilik kos tidak perlu *login* menggunakan *password*. Sistem mengirimkan tautan unik (Magic Link) sekali pakai ke WhatsApp untuk memperbarui ketersediaan kamar dalam hitungan detik.
- **Admin Dashboard:** Panel admin rahasia (berbasis PIN) untuk mengelola data properti, memantau *booking* mahasiswa, dan memvalidasi (Setujui/Tolak) transaksi.

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

- **Framework Utama:** Next.js 14+ (App Router)
- **Bahasa Pemrograman:** TypeScript
- **Styling:** Tailwind CSS
- **Database & ORM:** SQLite + Prisma
- **Testing:** Vitest

## 📚 Libraries Digunakan

- `lucide-react`: Ikon SVG minimalis nan indah.
- `clsx` & `tailwind-merge`: Utilitas manipulasi *class* untuk Tailwind.
- `shadcn/ui` (*Radix UI primitives*): Komponen dasar bebas kerangka yang aksesibel.

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
   Buka peramban (browser) dan akses `http://localhost:3000`. Akses halaman admin di `http://localhost:3000/admin` (gunakan PIN: `778899`).

## 🧪 Cara Test Aplikasi

Aplikasi ini menggunakan **Vitest** untuk menguji API *(Integration Testing)* maupun Komponen React *(Unit Testing)*. Saat ini terdapat >140 skenario pengujian dengan tingkat kelulusan 100%.

Untuk menjalankan *test suite*, jalankan perintah:
```bash
npm run test
```
Ini akan mengeksekusi semua file *test* yang berada di dalam *folder* `test/` dan menampilkan hasilnya pada konsol.
