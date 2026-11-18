export const ALLOWED_STATUSES = [
  "PENDING",
  "PAID",
  "SUCCESS",
  "CONFIRMED",
  "ACCEPTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED",
  "COMPLETED",
  "DISPUTED",
  "PAYOUT_PENDING",
  "PAYOUT_PAID",
];

/**
 * Status booking yang menempati/menahan inventaris kamar (inventory hold).
 * Menghitung pengurangan/penambahan kamar pada available_rooms.
 * Termasuk status PENDING saat mahasiswa mengamankan kamar dan menunggu pembayaran.
 */
export const RESERVED_BOOKING_STATUSES = [
  "PENDING",
  "PAID",
  "SUCCESS",
  "CONFIRMED",
  "ACCEPTED",
  "APPROVED",
  "COMPLETED",
];

/**
 * Status booking yang telah lunas dan terkonfirmasi secara sah.
 * Digunakan dalam siklus hidup hunian (move-in lifecycle):
 * pengingat H-1 masuk kos, auto check-in, dan pelepasan dana escrow.
 * Secara eksplisit TIDAK menyertakan PENDING (belum bayar).
 */
export const PAID_CONFIRMED_STATUSES = [
  "APPROVED",
  "ACCEPTED",
  "PAID",
  "SUCCESS",
  "CONFIRMED",
];

/**
 * @deprecated Gunakan RESERVED_BOOKING_STATUSES untuk logika inventaris/kamar atau PAID_CONFIRMED_STATUSES untuk siklus hunian.
 */
export const ACTIVE_BOOKING_STATUSES = RESERVED_BOOKING_STATUSES;
