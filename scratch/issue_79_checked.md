# Manajemen Pemilik Kos (Owner Management)

**Asignee:** Junior Programmer / AI Agent
**Label:** `enhancement`, `admin-dashboard`, `epic-5`

## 📋 Deskripsi Singkat
Tambahkan halaman baru di Dasbor Admin untuk melihat dan memantau daftar Pemilik Kos (Ibu Kos). Halaman ini penting agar admin dapat melihat detail kontak pemilik kos dan memantau berapa banyak properti yang mereka miliki.

## 🎯 Acceptance Criteria
- [x] Tersedia endpoint `GET /api/admin/owners` yang diamankan menggunakan PIN Admin.
- [x] Endpoint mengembalikan daftar pemilik kos beserta *jumlah properti* yang mereka daftarkan.
- [x] Tersedia halaman antarmuka (UI) di `/admin/owners` yang menampilkan tabel daftar pemilik kos.
- [x] Tabel menampilkan kolom: **Nama Pemilik**, **Nomor WhatsApp**, **Jumlah Kos/Properti**, dan **Tanggal Terdaftar**.
- [x] Terdapat fitur pencarian sederhana berdasarkan nama atau nomor WhatsApp.
- [x] Menu navigasi ke halaman "Pemilik Kos" ditambahkan pada *sidebar/layout* admin.
- [x] Tersedia 100% *unit test* untuk API dan UI halaman baru.

---

## 🛠️ Panduan Implementasi (Step-by-Step)

Untuk programmer yang mengimplementasikan tugas ini, silakan ikuti langkah-langkah detail di bawah ini agar kode rapi dan terhindar dari *bug*.

### Langkah 1: Buat Endpoint API (`src/app/api/admin/owners/route.ts`)
1. Buat folder baru `owners/` di dalam `src/app/api/admin/`.
2. Buat file `route.ts`.
3. Buat sebuah fungsi `GET` yang wajib memvalidasi token dari header `Authorization: Bearer 778899` (Lihat contoh validasi ini di endpoint admin lainnya, misalnya `src/app/api/admin/bookings/route.ts`).
4. Gunakan `prisma.owner.findMany()` untuk mengambil data.
5. Gunakan fitur `include` pada Prisma untuk menghitung (*count*) jumlah `properties` yang direlasikan dengan `Owner` tersebut.
6. Urutkan (*orderBy*) berdasarkan `created_at` secara *descending* (terbaru di atas).
7. Bungkus query dengan blok `try...catch` dan kembalikan response 500 JSON apabila terjadi kesalahan koneksi database.

### Langkah 2: Buat Unit Test untuk API (`test/api-admin-owners.test.ts`)
1. Buat file pengujian baru menggunakan `vitest`.
2. Tulis minimal 3 skenario tes (Gunakan metode simulasi / *mocking* `NextRequest` seperti di tes admin lainnya):
   - **Gagal (401):** Jika token/PIN tidak disertakan atau salah.
   - **Sukses (200):** Menghasilkan *array* daftar pemilik beserta kolom tambahan berupa jumlah properti.
   - **Error DB (500):** Melakukan *spyOn* `prisma.owner.findMany` menjadi *mockRejectedValue* untuk menguji jika database gagal (*down*).

### Langkah 3: Tambahkan Navigasi di Layout Admin (`src/app/admin/layout.tsx`)
1. Buka file `layout.tsx` di dalam folder `admin/`.
2. Cari kumpulan tautan navigasi (seperti menu Dasbor, Properti, Transaksi).
3. Tambahkan satu *link* baru ke `/admin/owners` menggunakan *icon* dari `lucide-react` (misalnya *icon* `Users`).

### Langkah 4: Buat Halaman UI (`src/app/admin/owners/page.tsx`)
1. Buat UI halaman dengan pendekatan _Client Component_ (`"use client"`).
2. Buat status *state* menggunakan `useState` untuk menyimpan:
   - Data `owners` (Daftar pemilik).
   - Status `isLoading` (Bawaan `true`).
   - Pesan `error` (opsional).
   - Teks *search* (untuk mencari nama / WA).
3. Gunakan `useEffect` untuk melakukan `fetch` ke `/api/admin/owners` dengan menyertakan *header* `Authorization: Bearer [pin_di_sessionStorage]`.
4. Jika API mengembalikan 401 Unauthorized, gunakan `router.push('/admin')` agar pengguna kembali ke halaman *login* admin.
5. Buat tabel rapi menggunakan Tailwind CSS. Tampilkan data dari *state*. (Gunakan kode tabel di `/admin/properties/page.tsx` sebagai cetak biru desainnya).
6. Implementasikan filter pencarian secara lokal (*Client-Side Filtering*) menggunakan `Array.prototype.filter` berdasarkan nama dan WhatsApp.

### Langkah 5: Buat Unit Test untuk UI (`test/admin-owners-page.test.tsx`)
1. Simulasikan (*mocking*) `fetch` global untuk mengembalikan data pancingan berupa JSON array berisi pemilik kos fiktif.
2. Buat skenario pengujian:
   - "Halaman menampilkan animasi *loading* di awal".
   - "Data berhasil dirender ke dalam tabel setelah *fetch* selesai".
   - "Pengguna yang belum *login* / pin salah teredireksi kembali ke `/admin`".
   - "Fitur filter/pencarian menyembunyikan data yang tidak cocok dengan kata kunci".

---

> 💡 **Tips Ekstra:**
> * Jangan lupa membiasakan menjalankan perintah `npm run test` di terminal secara berkala saat pengkodean untuk memastikan tidak ada *test* lain yang rusak.
> * Perhatikan penamaan *class* Tailwind. Gunakan perpaduan warna `slate` untuk estetika yang sejuk sesuai dengan pola warna pada halaman admin lain.
