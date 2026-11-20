# [CRITICAL SECURITY] Penutupan Celah Payment Bypass pada Residual Endpoint /api/bookings/[id]/pay (CVSS 9.8 / P0)

## 📌 Metadata
- **Tingkat Keparahan:** 🔴 CRITICAL (P0 / CVSS 9.8)
- **Komponen Terdampak:** Backend API, Payment Flow, Escrow System
- **File Utama:** `src/app/api/bookings/[id]/pay/route.ts`
- **File Uji Terkait:** `test/api-bookings-pay.test.ts`, `test/user-booking-pay-auth.test.ts`
- **Target Pelaksana:** Junior Programmer / AI Agent

---

## 1. 📖 Ringkasan Masalah & Konteks Bisnis
KosPasti menggunakan sistem **Rekening Bersama (Escrow)** berbasis **Payment Gateway Midtrans Snap & Iris Disbursement** untuk memastikan keamanan dana penyewa mahasiswa dan pencairan ke mitra pemilik kos. 

Sebelum sistem Midtrans Snap diterapkan, sistem menggunakan rute legacy `POST /api/bookings/[id]/pay` sebagai endpoint simulasi pembayaran manual. Ketika alur pembayaran Midtrans resmi (`/api/bookings/[id]/snap-token` dan `/api/webhooks/payment`) telah diaktifkan, endpoint legacy ini **masih tertinggal aktif di backend**.

### Dampak Finansial & Risiko Eksploitasi:
1. Setiap pengguna yang terotentikasi dapat mengirimkan HTTP request `POST /api/bookings/{bookingId}/pay` secara langsung via cURL, Postman, atau script konsol browser.
2. Backend akan memanggil fungsi `fulfillPaidBooking` dengan `paymentMethod: "SIMULATION_INTERNAL"`.
3. Status booking langsung berubah menjadi `PAID`, kuota kamar terpotong, dokumen Kontrak Digital (SPK) dan Kuitansi Resmi terbit, serta **entitas `Payout` (dana pencairan) untuk pemilik kos langsung dicetak di database**.
4. Akibatnya, pemilik kos berhak mencairkan dana sewa riil dari kas platform, padahal penyewa tidak mentransfer uang sepeser pun ke rekening penampung (Escrow). Ini merupakan **kebocoran finansial langsung 100% (Direct Financial Loss)**.

---

## 2. 📍 Lokasi Kode & Vektor Serangan

### Lokasi Celah
Lihat berkas: `src/app/api/bookings/[id]/pay/route.ts` baris 102–128:
```typescript
const fulfillmentResult = await fulfillPaidBooking({
  bookingId: booking.id,
  paymentMethod: "SIMULATION_INTERNAL",
  paymentGatewayRef: `SIM-${Date.now()}`,
  paidAt: new Date(),
  existingBooking: booking,
});
```

### Skenario Serangan (Proof of Concept):
1. Mahasiswa login dan membuat pesanan sewa kos baru melalui form aplikasi -> Status booking menjadi `PENDING`.
2. Pengguna dialihkan ke halaman `/checkout/[bookingId]`.
3. Alih-alih membayar via Midtrans Snap popup, penyerang mengeksekusi request berikut di terminal / konsol browser:
   ```bash
   curl -X POST https://kospasti.com/api/bookings/{bookingId}/pay \
     -H "Cookie: user_token={token_jwt_user}" \
     -H "Content-Type: application/json"
   ```
4. Backend langsung mengembalikan `HTTP 200 OK: "Pembayaran berhasil dikonfirmasi..."`.
5. Booking berstatus `PAID` dan kamar aman tanpa bayar.

---

## 3. 🛡️ Spesifikasi Solusi Teknis (Technical Architecture)

### A. Prinsip Keamanan Utama (*Single Source of Truth for Payments*)
Satu-satunya jalur sah yang diizinkan untuk menandai pesanan sewa menjadi lunas (`PAID`) adalah **Midtrans Webhook Callback** (`POST /api/webhooks/payment`), yang telah terlindungi verifikasi tanda tangan digital SHA-512 Server Key Midtrans.

### B. Strategi Perbaikan pada Endpoint Legacy `POST /api/bookings/[id]/pay`:
1. **Strict Production Guard (Fail-Closed):**
   Endpoint wajib menolak secara absolut jika berjalan di lingkungan produksi (`process.env.NODE_ENV === "production"`) atau jika flag `ENABLE_PAYMENT_SIMULATION !== "true"`.
   - Mengembalikan respons **HTTP 404 Not Found** (atau **HTTP 410 Gone**) sehingga endpoint tidak dapat dipindai atau dieksploitasi oleh publik.
2. **Internal Secret Protection untuk Mode Development / Test:**
   Jika dijalankan di mode lokal/pengujian non-produksi (`NODE_ENV !== "production"`), eksekusi simulasi hanya boleh diproses jika menyertakan header keamanan khusus (`x-simulation-secret` yang cocok dengan environment variable atau saat dijalankan dalam unit test).
3. **Pembersihan Logika Fulfillment:**
   Pastikan tidak ada rujukan di frontend (`src/app/` dan `src/components/`) yang memanggil `/api/bookings/[id]/pay`. Alur checkout frontend harus 100% menggunakan Midtrans Snap (`/api/bookings/[id]/snap-token`).

---

## 4. 📋 Panduan Implementasi Bertahap (Step-by-Step Tasks)

### Tahap 1: Pengamanan Endpoint Backend (`src/app/api/bookings/[id]/pay/route.ts`)
- [x] Buka file `src/app/api/bookings/[id]/pay/route.ts`.
- [x] Di awal fungsi `POST`, sebelum membaca database atau sesi pengguna, tambahkan pengecekan lingkungan:
  ```typescript
  // 1. Matikan total endpoint simulasi di mode produksi
  const isProduction = process.env.NODE_ENV === "production";
  const isSimulationAllowed = process.env.ENABLE_PAYMENT_SIMULATION === "true" || process.env.NODE_ENV === "test";

  if (isProduction || !isSimulationAllowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Endpoint ini telah dinonaktifkan permanen demi alasan keamanan. Seluruh pembayaran wajib melalui Payment Gateway resmi.",
      },
      { status: 404 }
    );
  }
  ```
- [x] Pastikan jika simulasi dijalankan di lingkungan pengujian/staging, header pengaman tambahan diperiksa, atau berikan pesan log peringatan `[SECURITY AUDIT] Internal payment simulation called on non-production`.

### Tahap 2: Verifikasi Alur Frontend & Checkout
- [x] Lakukan pemeriksaan (*search*) di seluruh folder `src/app/` dan `src/components/` untuk memastikan tidak ada tombol atau kode yang memanggil URL `/api/bookings/[id]/pay`.
- [x] Pastikan halaman `/checkout/[bookingId]` tetap memanggil endpoint resmi:
  1. `GET /api/bookings/[bookingId]` (mengambil detail nominal pesanan).
  2. `POST /api/bookings/[bookingId]/snap-token` (meminta Snap Token dari Midtrans).
  3. `window.snap.pay(snapToken, ...)` (membuka antarmuka pembayaran resmi).

### Tahap 3: Pembaruan & Penambahan Unit Test
- [x] Buka file `test/api-bookings-pay.test.ts` dan `test/user-booking-pay-auth.test.ts`.
- [x] Tambahkan skenario pengujian penolakan produksi:
  - **Uji Coba 1:** Ketika `process.env.NODE_ENV = "production"`, request `POST /api/bookings/[id]/pay` wajib mengembalikan `HTTP 404` dengan pesan penonaktifan.
  - **Uji Coba 2:** Ketika `ENABLE_PAYMENT_SIMULATION` tidak bernilai `"true"`, request wajib ditolak `HTTP 404`.
  - **Uji Coba 3:** Pastikan pengujian simulasi yang lama tetap dapat berjalan secara terisolasi dengan menyetel `process.env.ENABLE_PAYMENT_SIMULATION = "true"`.
- [x] Jalankan test suite: `npx vitest run test/user-booking-pay-auth.test.ts` dan `npx vitest run test/payment-gateway-midtrans.test.ts`.

---

## 5. ✅ Kriteria Penerimaan (Acceptance Criteria)
1. **Produksi Aman (Fail-Closed):**
   Ketika aplikasi di-deploy pada lingkungan produksi (`NODE_ENV === "production"`), pemanggilan `POST /api/bookings/{id}/pay` menghasilkan `HTTP 404 Not Found`.
2. **Tidak Ada Celah Bypass:**
   Tidak ada aktor manapun (baik mahasiswa maupun pihak ketiga) yang dapat mengubah status booking `PENDING` menjadi `PAID` tanpa notifikasi webhook Midtrans yang tervalidasi tanda tangan digitalnya.
3. **Integritas Alur Transaksi:**
   Alur pembayaran resmi via Midtrans Snap di halaman `/checkout/[bookingId]` tetap berfungsi normal tanpa terganggu.
4. **Test Suite Hijau:**
   Semua test terkait autentikasi pembayaran dan gateway Midtrans lulus 100%.

---

## 6. 🧪 Panduan Verifikasi Pengujian Manual
1. **Simulasi Mode Produksi:**
   Jalankan perintah pengujian dengan variabel `NODE_ENV=production`:
   ```bash
   NODE_ENV=production npx vitest run test/user-booking-pay-auth.test.ts
   ```
2. **Pengujian cURL:**
   Kirimkan request tiruan ke endpoint:
   ```bash
   curl -i -X POST http://localhost:3000/api/bookings/test-id/pay
   ```
   Pastikan HTTP status yang kembali adalah `404 Not Found`.
