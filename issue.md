# Rencana Pengembangan Fitur Detail Kos & Kelola Properti Admin

Issue ini berisi daftar tugas (Task List) untuk mengimplementasikan permintaan pembaruan pada halaman Detail Kos dan fitur Kelola Properti di dashboard Admin. Rencana ini disusun agar bisa dieksekusi secara bertahap oleh Junior Programmer atau AI Model.

## 1. Perubahan Skema Database (`prisma/schema.prisma`)
- [x] **Model `Property`**:
  - `rules` (`String?`): Untuk menyimpan peraturan kos.
  - `rental_terms` (`String?`): Untuk menyimpan ketentuan pengajuan sewa.
  - `youtube_url` (`String?`): URL video YouTube pemilik kos.
- [x] **Model `RoomType`**:
  - `specifications` (`String?`): Untuk menyimpan spesifikasi tipe kamar (misal: "3x3 meter", "Kapasitas 1 Orang").
- [x] Jalankan `npx prisma db push` dan generate Prisma Client.

## 2. Pembaruan Data Dummy (`prisma/seed.ts` & `data_kos_subang.json`)
- [x] **`data_kos_subang.json`**: Tambahkan data dummy untuk field baru (`rules`, `rental_terms`, `youtube_url` di setiap objek).
- [x] **`prisma/seed.ts`**: Update script seeding agar membaca dan memasukkan field-field baru tersebut (termasuk `specifications` tiap kamar) ke database saat inisialisasi awal.

## 3. Halaman Detail Kos Frontend (`src/app/kos/[id]/page.tsx`)
Lakukan refactor dan penambahan UI berikut:
- [x] **Fullscreen Image Gallery:** Buat agar ketika user mengklik foto properti, akan muncul modal/lightbox fullscreen yang menampilkan slider/carousel gambar (bisa digeser/swipe).
- [x] **Tab/Tombol Video YouTube:** Di area media (foto properti), tambahkan tombol/tab untuk beralih antara "Foto" dan "Video". Tampilkan iframe video YouTube jika kos memiliki video.
- [x] **Layouting Foto & Card Amankan Kamar:** 
  - Ubah susunan layout atas. Buat bagian foto properti melebar (full ke kanan/full width container). 
  - Pindahkan posisi card "Amankan Kamar" menjadi di bawah bagian foto properti (namun fungsinya tetap sama seperti sebelumnya).
- [x] **Sticky In-Page Navigation:** Tambahkan navbar lokal yang berisi anchor link (Foto Properti, Fasilitas Kamar, Tipe, dll). Navbar ini awalnya tersembunyi/tidak ada di paling atas, tapi akan muncul (sticky) begitu user melakukan scroll ke bawah melewati bagian foto properti.
- [x] **Refactor Menampilkan Fasilitas:**
  - Ganti label bagian "Fasilitas Bersama & Bangunan" menjadi **"Fasilitas Umum"**.
  - **Fasilitas Kamar** jangan lagi ditaruh di dalam pilihan list tipe kamar. Buat satu Card/Section khusus bernama "Fasilitas Kamar" yang diletakkan *di atas* section "Fasilitas Umum".
  - Isi dari section "Fasilitas Kamar" harus reaktif (berubah dinamis) berdasarkan "Tipe Kamar" yang sedang diklik/dipilih oleh user di bagian Amankan Kamar/Daftar Tipe Kamar.
- [x] **Section Baru:**
  - Tampilkan data spesifikasi tipe kamar (kalo tipe A ukurannya berapa, dll).
  - Buat section untuk menampilkan `rules` (Peraturan Kos).
  - Buat section untuk menampilkan `rental_terms` (Ketentuan Pengajuan Sewa).

## 4. Halaman Kelola Properti Admin (`src/app/admin/properties/...`)
Update form tambah dan edit properti:
- [x] **Input Video:** Tambahkan input text field untuk memasukkan URL YouTube.
- [x] **Input Aturan & Ketentuan:** Tambahkan input textarea / rich text editor untuk "Peraturan Kos" dan "Ketentuan Pengajuan Sewa".
- [x] **Input Spesifikasi Kamar:** Pada bagian form yang mengelola `RoomType`, tambahkan input untuk field spesifikasi kamar.

---

### Tahapan Eksekusi:
1. **Tahap 1: Backend & Data** [SELESAI]
   - Edit `schema.prisma`.
   - Update `data_kos_subang.json` dan `seed.ts`.
   - Jalankan seed ulang untuk memastikan database siap.
2. **Tahap 2: Admin Dashboard** [SELESAI]
   - Update form `properties` di Admin supaya pemilik/admin bisa mengisi/mengedit data baru tersebut. Pastikan proses save/update berjalan lancar.
3. **Tahap 3: Frontend - UI/UX Halaman Detail** [SELESAI]
   - Rombak layout hero image agar full width dan form "Amankan Kamar" berada di bawahnya.
   - Implementasikan Lightbox/Gallery dan fitur Video.
   - Implementasikan Sticky In-Page Navigation (dengan scroll listener).
   - Implementasikan Card Dinamis untuk Fasilitas Kamar.
   - Tambahkan section Spesifikasi, Peraturan, dan Ketentuan sewa di bawahnya.
