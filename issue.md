# [Feature] Berita Acara Digital Serah Terima Kondisi Kamar (Check-in Inspection Checklist)

## Ringkasan & Keselarasan Bisnis
Fitur **Deposit Jaminan Kerusakan (Escrow)** telah aktif di KosPasti untuk melindungi pemilik kos dari kerugian akibat kerusakan fasilitas kamar. Namun pada praktiknya, pemotongan atau klaim deposit saat penyewa *checkout* (`POST /api/partner/bookings/[id]/checkout`) sangat rentan menimbulkan **sanggahan (dispute)** antara mahasiswa dan pemilik kos jika tidak ada bukti autentik kondisi awal kamar saat hari pertama *check-in*. 

Tanpa dokumentasi awal yang disepakati bersama, penyewa sering mengklaim bahwa fasilitas (misalnya AC bocor, dinding kotor/retak, noda kasur, atau kran rusak) memang sudah rusak sebelum mereka masuk.

**Solusi Bisnis & Teknis:**
1. Tambahkan model `CheckinInspection` di Prisma yang mencatat kondisi fisik fasilitas utama kamar:
   - **AC** (`ac_condition`, `ac_notes`, `ac_photo_url`)
   - **Kasur / Tempat Tidur** (`bed_condition`, `bed_notes`, `bed_photo_url`)
   - **Dinding & Plafon** (`walls_condition`, `walls_notes`, `walls_photo_url`)
   - **Kamar Mandi & Sanitasi** (`bathroom_condition`, `bathroom_notes`, `bathroom_photo_url`)
   - Catatan umum (`general_notes`) dan foto pendukung opsional.
2. Form digital serah terima kamar terintegrasi pada hari *check-in*:
   - Pemilik kos atau mahasiswa mengambil foto kondisi fasilitas secara langsung dari kamera HP / unggah galeri.
   - Foto otomatis diunggah dan disimpan ke **Supabase Storage** (bucket `kospasti-media/inspections/...`) dengan fallback lokal.
3. Setelah diserahkan dan dikonfirmasi, berita acara dikunci secara permanen (`is_locked: true`) sebagai **Baseline Condition**.
4. Bukti inspeksi ini menjadi dasar hukum digital yang objektif bagi Admin dan Pemilik Kos saat menyelesaikan klaim atau sanggahan deposit kerusakan saat *checkout*.

---

## 1. Perubahan Data Model (`prisma/schema.prisma`)

Tambahkan model `CheckinInspection` pada `prisma/schema.prisma`:

```prisma
model CheckinInspection {
  id                    String    @id @default(uuid())
  booking_id            String    @unique
  booking               Booking   @relation(fields: [booking_id], references: [id], onDelete: Cascade)
  
  inspector_role        String    @default("PARTNER") // "PARTNER" | "TENANT" | "ADMIN"
  inspected_at          DateTime  @default(now())
  
  // 1. Kondisi Air Conditioner (AC)
  ac_condition          String    @default("GOOD") // "GOOD" | "DAMAGED" | "NOT_AVAILABLE"
  ac_notes              String?
  ac_photo_url          String?
  
  // 2. Kondisi Kasur & Springbed
  bed_condition         String    @default("GOOD") // "GOOD" | "DAMAGED" | "NOT_AVAILABLE"
  bed_notes             String?
  bed_photo_url         String?
  
  // 3. Kondisi Dinding, Cat & Plafon
  walls_condition       String    @default("GOOD") // "GOOD" | "DAMAGED" | "NOT_AVAILABLE"
  walls_notes           String?
  walls_photo_url       String?
  
  // 4. Kondisi Kamar Mandi & Sanitasi
  bathroom_condition    String    @default("GOOD") // "GOOD" | "DAMAGED" | "NOT_AVAILABLE"
  bathroom_notes        String?
  bathroom_photo_url    String?
  
  // Catatan & Ringkasan Umum
  general_notes         String?
  additional_photos     String?   // JSON string: array URL foto tambahan ["url1", "url2"]
  
  // Status Kunci Baseline
  is_locked             Boolean   @default(true) // Dikunci agar tidak dapat direvisi sepihak setelah check-in
  tenant_confirmed_at   DateTime? // Tanggal mahasiswa memverifikasi / menyetujui BAST digital
  
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  @@index([booking_id])
  @@index([inspected_at])
}
```

Perbarui juga relasi pada `model Booking` di `prisma/schema.prisma`:
```prisma
model Booking {
  // ... field yang sudah ada ...
  checkin_inspection    CheckinInspection?
}
```

Jalankan perintah berikut untuk memperbarui Prisma Client dan skema DB:
```bash
npx prisma generate
npx prisma db push
```

---

## 2. API Pembuatan & Pengambilan Berita Acara Inspeksi (`/api/bookings/[id]/inspection`)

Buat berkas Route Handler di `src/app/api/bookings/[id]/inspection/route.ts`:

### A. Endpoint `GET` (Melihat Berita Acara Inspeksi)
- **Akses:** Diizinkan untuk Penyewa sah (`user_token`), Pemilik kos sah (`partner_token`), atau Admin.
- **Logika:**
  1. Validasi autentikasi cookie pemanggil.
  2. Ambil data `booking` beserta relasi `checkin_inspection`, `property`, `room_unit`, dan `room_type`.
  3. Lakukan pengecekan Anti-IDOR:
     - Jika pengguna adalah mahasiswa: `booking.user_id === userPayload.userId`.
     - Jika pengguna adalah pemilik: `booking.property.owner_id === ownerPayload.ownerId`.
  4. Kembalikan data inspeksi lengkap dengan status HTTP 200. Jika belum ada inspeksi, kembalikan `{ success: true, inspection: null }`.

### B. Endpoint `POST` (Submit Berita Acara & Unggah Foto)
- **Format Input:** `multipart/form-data`
- **Fields:**
  - `ac_condition`, `ac_notes`, `ac_file` (opsional)
  - `bed_condition`, `bed_notes`, `bed_file` (opsional)
  - `walls_condition`, `walls_notes`, `walls_file` (opsional)
  - `bathroom_condition`, `bathroom_notes`, `bathroom_file` (opsional)
  - `general_notes` (opsional)
  - `additional_files` (opsional, multiple images)
- **Logika:**
  1. Validasi sesi pemanggil (hanya pemilik kos atau mahasiswa bersangkutan).
  2. Validasi status booking: hanya pesanan yang berstatus `APPROVED`, `ACCEPTED`, atau `COMPLETED` yang dapat diinspeksi.
  3. Unggah foto-foto fasilitas menggunakan `saveUploadedFile(file, "inspections")` dari `src/lib/upload.ts` (otomatis masuk ke Supabase Storage bucket `kospasti-media/inspections/...` dengan fallback penyimpanan lokal).
  4. Simpan atau lakukan upsert record `CheckinInspection` ke database dengan status `is_locked = true`.
  5. Kirimkan notifikasi In-App dan tautan WhatsApp bahwa Berita Acara Serah Terima Kamar telah selesai didokumentasikan.

---

## 3. Integrasi Alur Check-in & Serah Terima Kunci

Buka `src/app/api/partner/bookings/[id]/checkin/route.ts`:
- Saat mitra menekan tombol **"Konfirmasi Check-In"**:
  - Jika form inspeksi disertakan pada request body / multipart saat konfirmasi check-in, simpan data inspeksi secara atomik di dalam `prisma.$transaction`.
  - Jika sudah ada `CheckinInspection`, otomatis hubungkan dan sertakan ringkasan BAST ke notifikasi WhatsApp mahasiswa:
    `📋 *Berita Acara Kamar:* Kondisi fasilitas awal telah terdokumentasi (AC: ${ac}, Kasur: ${bed}, Kamar Mandi: ${bath}). Akses kuitansi & dokumen: ${appUrl}/receipt/${id}`.

---

## 4. Antarmuka UI Komponen

### A. Modal Form Inspeksi Kamar (`src/components/partner/CheckinInspectionModal.tsx`)
- Tampilkan form checklist visual yang ramah mobile (mengacu pada `docs/DESIGN.md`):
  - Kartu per fasilitas:
    - **AC:** Pilihan status (Baik / Cacat Awal / Tidak Ada), input catatan, dan tombol kamera/upload foto.
    - **Kasur:** Pilihan status, input catatan, tombol upload foto.
    - **Dinding:** Pilihan status, input catatan, tombol upload foto.
    - **Kamar Mandi:** Pilihan status, input catatan, tombol upload foto.
  - Preview thumbnail foto langsung saat file dipilih sebelum submit.
  - Indikator loading saat proses upload foto ke Supabase Storage.

### B. Lembar Tampilan BAST Digital (`src/app/inspection/[bookingId]/page.tsx` atau Tab di `/receipt/[bookingId]`)
- Tampilkan Berita Acara Serah Terima (BAST) Digital:
  - Header resmi dengan Nomor Kuitansi & Nomor SPK.
  - Detail Kamar: Nama Kos, Tipe Kamar, dan Nomor Kamar Fisik (Unit Room).
  - Grid 4 kotak dokumentasi kondisi foto baseline (AC, Kasur, Dinding, Kamar Mandi) lengkap dengan badge status hijau ("Kondisi Baik") atau kuning ("Cacat Awal").
  - Catatan serah terima dan stempel waktu penguncian baseline (`Dikunci secara sistem pada: ...`).
  - Desain *print-friendly* (bisa dicetak / diunduh sebagai PDF).

### C. Integrasi pada Modal Checkout Kamar (`src/app/partner/dashboard/bookings/page.tsx`)
- Pada modal konfirmasi checkout, jika pemilik memilih kondisi kamar `"Ada Kerusakan (DAMAGED)"`:
  - Tampilkan tombol/tautan: **"Lihat Foto Kondisi Awal Saat Check-In"** yang membuka modal perbandingan kondisi baseline, sehingga pemilik dapat memvalidasi apakah kerusakan tersebut memang terjadi selama masa sewa penyewa.

---

## 5. Rencana Pengujian Otomatis (`test/checkin-inspection.test.ts`)

Buat berkas pengujian `test/checkin-inspection.test.ts` menggunakan Vitest:
1. **Model & Indeks Skema:**
   - Memvalidasi indeks komposit dan relasi `CheckinInspection` terhadap `Booking`.
2. **Endpoint `GET /api/bookings/[id]/inspection`:**
   - Mengembalikan 401 jika unauthenticated.
   - Mengembalikan 403 jika diakses oleh user/mitra yang bukan pemilik pesanan (Anti-IDOR).
   - Mengembalikan data inspeksi lengkap jika diakses oleh pihak yang sah.
3. **Endpoint `POST /api/bookings/[id]/inspection`:**
   - Menolak upload jika ukuran file melebihi batas atau format file tidak diizinkan.
   - Berhasil menyimpan data inspeksi dan mengunci baseline (`is_locked === true`).
   - Mencegah manipulasi data inspeksi jika kamar sudah dicheckout.
4. **Validasi Integrasi Checkout:**
   - Memastikan data inspeksi awal terbaca dengan benar saat proses evaluasi klaim deposit jaminan.

---

## 6. Standar Koding & Pedoman Proyek (`docs/`)
- **Desain & UI:** Wajib mengikuti `docs/DESIGN.md` (warna `emerald-600`, background `slate-50`, radius `rounded-2xl`, button `active:scale-95`, tidak kaku/AI slop).
- **Arsitektur:** Mengacu pada `docs/PROJECT_INSTRUCTIONS.md` (Next.js App Router, TypeScript, Prisma ORM, Tailwind CSS).
- **Anti-Breaking:** Tidak mengubah struktur data `Booking` atau merusak alur checkout deposit yang sudah berjalan.
- **Zero Build Error:** Wajib lolos `npx tsc --noEmit` dan seluruh test vitest harus `PASSED`.

---

## Checklist Implementasi (Junior Developer / AI Prompt Checklist)
- [x] Tambahkan model `CheckinInspection` dan relasi ke `Booking` di `prisma/schema.prisma`.
- [x] Jalankan `npx prisma generate` dan `npx prisma db push`.
- [x] Buat Route Handler `src/app/api/bookings/[id]/inspection/route.ts` (`GET` dan `POST`).
- [x] Buat komponen form inspeksi `src/components/partner/CheckinInspectionModal.tsx` dengan upload foto fasilitas.
- [x] Hubungkan modal inspeksi pada alur check-in di `src/app/partner/dashboard/bookings/page.tsx`.
- [x] Buat komponen/halaman penampil BAST Digital di `src/app/inspection/[bookingId]/page.tsx` atau tab kuitansi di `/receipt/[bookingId]`.
- [x] Tampilkan tautan bukti foto kondisi awal pada modal checkout saat klaim kerusakan dipilih.
- [x] Buat test suite lengkap di `test/checkin-inspection.test.ts`.
- [x] Jalankan pengujian: `npx vitest run test/checkin-inspection.test.ts`.
- [x] Jalankan `npx tsc --noEmit` untuk verifikasi TypeScript.
