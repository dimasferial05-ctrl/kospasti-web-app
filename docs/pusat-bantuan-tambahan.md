# Hasil Audit: Fitur Tersembunyi (Blind Spots) untuk Pusat Bantuan Tambahan

Berdasarkan perbandingan dengan data Pusat Bantuan yang sudah ada (`src/lib/data/help-center.ts`) dan eksplorasi lanjutan pada sistem, berikut adalah 8 (*delapan*) fitur dan alur penting dari perspektif pengguna (*end-user*) maupun mitra yang **benar-benar baru dan belum terdokumentasi**.

Semua penjelasan di bawah ini telah disesuaikan dengan bahasa non-teknis yang ramah dan mudah dipahami oleh masyarakat umum.

---

## 1. Memahami Arti Status Pesanan Kos Anda
- **Kategori:** Pencari Kos (User)
- **Lokasi Route:** `/src/app/profil/page.tsx` (Tab Riwayat Pesanan)
- **Mengapa Harus Tahu:** Setelah melakukan pemesanan, pengguna sering merasa cemas tentang kelanjutan prosesnya. Mengetahui arti dari masing-masing status pesanan akan memberikan ketenangan.

**Draft Penjelasan:**
Saat Anda melihat daftar Riwayat Pesanan di halaman Profil, Anda akan menemukan label status:
*   **Menunggu Pembayaran DP (Kuning):** Segera selesaikan pembayaran DP melalui QRIS sesuai batas waktu agar kamar tidak diambil orang lain.
*   **Menunggu Konfirmasi Pemilik (Biru):** Pembayaran DP Anda berhasil. Saat ini, pemilik kos sedang memeriksa ketersediaan kamar.
*   **Disetujui (Hijau):** Selamat! Kamar sudah resmi diamankan untuk Anda. Anda sudah bisa menghubungi pemilik kos untuk persiapan hari *check-in*.
*   **Ditolak / Refund Diproses (Merah):** Mohon maaf, pemilik kos tidak dapat menerima pesanan Anda (biasanya karena kamar baru saja penuh secara *offline*). Dana DP Anda dijamin aman 100% dan sedang diproses pengembaliannya (*refund*).

---

## 2. Ketentuan Ubah Profil & Kenapa Alamat Email Tidak Bisa Diganti
- **Kategori:** Pencari Kos (User)
- **Lokasi Route:** `/src/app/profil/page.tsx` (Tab Data Diri)
- **Mengapa Harus Tahu:** Mencegah kebingungan saat mencoba mengganti alamat email yang terkunci, atau saat gagal mengunggah foto profil karena terlalu besar.

**Draft Penjelasan:**
*   **Alamat Email Terkunci:** Anda tidak dapat mengubah alamat email yang sudah terdaftar karena terhubung langsung dengan sistem keamanan kami (terutama jika Anda masuk menggunakan Google). Jika harus menggunakan email baru, silakan buat akun baru.
*   **Nomor WhatsApp:** Pastikan nomor WhatsApp selalu aktif karena akan diberikan kepada pemilik kos saat pesanan disetujui.
*   **Foto Profil:** Pastikan ukuran foto tidak lebih dari 2 MB (format JPG/PNG/WebP).

---

## 3. Tips Memaksimalkan Fitur Kos Favorit (Wishlist)
- **Kategori:** Pencari Kos (User)
- **Lokasi Route:** `/src/app/favorit/page.tsx`
- **Mengapa Harus Tahu:** Banyak pengguna menyimpan kos favorit namun tidak tahu bahwa mereka bisa memfilter dan mencari secara spesifik di dalam daftar favorit tersebut.

**Draft Penjelasan:**
Di halaman **Kos Favorit Saya**, Anda tidak hanya melihat daftar kos yang tersimpan, tetapi Anda juga dapat:
*   **Menyortir Cepat:** Menggunakan tab filter (Putra, Putri, Campur) khusus pada kos yang sudah disimpan.
*   **Pencarian Spesifik:** Mencari nama kos dari koleksi favorit Anda.
*   **Melihat Peta Terbatas:** Langsung membandingkan lokasi semua kos favorit Anda sekaligus dalam satu tampilan peta terpadu dengan mengeklik tombol "Lihat di Peta".

---

## 4. Kapan dan Bagaimana Saya Bisa Memberikan Ulasan Kos?
- **Kategori:** Pencari Kos (User)
- **Lokasi Route:** `/src/app/kos/[id]/page.tsx` (Bagian Ulasan)
- **Mengapa Harus Tahu:** Pengguna mungkin mencari tombol "Tulis Ulasan" namun tidak menemukannya jika mereka belum pernah menyewa kos tersebut, sehingga mereka mengira fiturnya rusak.

**Draft Penjelasan:**
KosPasti menjamin bahwa semua ulasan yang tampil adalah ulasan asli dari penghuni sungguhan (*Penyewa Terverifikasi*). 
Oleh karena itu, tombol **"Tulis Ulasan"** hanya akan muncul secara otomatis di halaman detail kos **jika Anda sudah pernah menyewa kos tersebut** dan status pesanan Anda telah Disetujui/Selesai. Anda dapat memberikan rating bintang (1-5) dan menceritakan pengalaman Anda terkait kebersihan, keamanan, atau keramahan pemilik kos.

---

## 5. Cara Mendapatkan Titik Koordinat Peta (Latitude & Longitude)
- **Kategori:** Pemilik Kos (Mitra)
- **Lokasi Route:** `/src/app/partner/register/page.tsx`
- **Mengapa Harus Tahu:** Banyak pemilik kos awam kebingungan saat diminta memasukkan titik *Latitude* dan *Longitude* saat mendaftarkan properti baru mereka.

**Draft Penjelasan:**
Untuk memastikan lokasi kos Anda akurat di peta pencarian KosPasti, Anda wajib memasukkan titik koordinat. Ikuti langkah mudah ini menggunakan Google Maps:
1. Buka aplikasi Google Maps di HP atau *browser* komputer Anda.
2. Cari dan sentuh/tahan titik lokasi akurat bangunan kos Anda di peta hingga muncul **pin merah**.
3. Di HP, geser menu di bawah layar ke atas untuk melihat deretan angka (contoh: `-6.5622, 107.7680`). Di komputer, angka ini muncul langsung di kotak pencarian atau saat Anda klik kanan pada pin.
4. Angka pertama sebelum koma adalah **Latitude** (contoh: -6.5622), dan angka setelah koma adalah **Longitude** (contoh: 107.7680). Salin kedua angka tersebut ke kolom formulir KosPasti.

---

## 6. Fitur AI Pembuat Deskripsi Promosi Kos Otomatis
- **Kategori:** Pemilik Kos (Mitra)
- **Lokasi Route:** `/src/app/partner/dashboard/properties` (Saat Menambah/Edit Kos)
- **Mengapa Harus Tahu:** Banyak pemilik kos merasa kesulitan atau membuang banyak waktu untuk merangkai kata-kata promosi (*copywriting*) yang menarik perhatian pencari kos.

**Draft Penjelasan:**
Kini Anda tidak perlu lagi pusing memikirkan kalimat promosi untuk kos Anda! KosPasti menyediakan fitur **"Generate Deskripsi dengan AI"** di dalam formulir penambahan properti.

**Cara Kerjanya:**
1. Anda cukup mengisi fasilitas, harga, aturan, dan tipe kamar di formulir.
2. Klik tombol pembuatan deskripsi otomatis berbasis AI (Kecerdasan Buatan).
3. Dalam hitungan detik, sistem kami akan merangkaikan semua data yang Anda isi menjadi sebuah paragraf promosi profesional dan menarik.
4. Anda masih bisa mengedit teks hasil buatan AI tersebut sebelum menyimpannya.

---

## 7. Sistem Escrow: Kapan Saya Menerima Uang DP Penyewa?
- **Kategori:** Pemilik Kos (Mitra)
- **Lokasi Route:** N/A (Konsep Bisnis & Keuangan)
- **Mengapa Harus Tahu:** Pertanyaan paling sering ditanyakan oleh Mitra Baru. Mereka sering bingung mengapa penyewa tidak mentransfer langsung ke rekening mereka, melainkan ke QRIS atas nama KosPasti.

**Draft Penjelasan:**
Untuk menjamin keamanan dan mencegah penipuan dari kedua belah pihak, KosPasti menggunakan sistem **Rekening Bersama (Escrow)**.
1. Saat penyewa setuju untuk menyewa, mereka akan mentransfer DP (Uang Muka) ke sistem KosPasti terlebih dahulu.
2. Dana tersebut akan kami amankan (*hold*).
3. Setelah pesanan Anda **setujui**, Anda bisa menyambut calon penyewa untuk *check-in*.
4. Tim Admin KosPasti akan **mencairkan (meneruskan)** dana DP tersebut langsung ke rekening bank pribadi Anda sesuai dengan jadwal *payout* setelah penyewa berhasil masuk ke kos.

---

## 8. Update Ketersediaan Kamar Cepat Tanpa Login (Magic Link)
- **Kategori:** Pemilik Kos (Mitra)
- **Lokasi Route:** `/src/app/update/[token]/page.tsx`
- **Mengapa Harus Tahu:** Membuka website KosPasti dan melakukan *login* hanya untuk memperbarui angka ketersediaan kamar seringkali dianggap merepotkan oleh pemilik kos yang sibuk.

**Draft Penjelasan:**
Selain menggunakan Dasbor Mitra, KosPasti juga memiliki **Tautan Ajaib (Magic Link) khusus untuk Update Stok Kamar**. 
Tautan ini memungkinkan Anda untuk langsung mengubah jumlah ketersediaan kamar kosong dari *browser* HP Anda secara instan **tanpa perlu memasukkan email dan password (*login*)**. Sangat aman dan praktis untuk pemilik kos yang memiliki perputaran penyewa sangat cepat!
