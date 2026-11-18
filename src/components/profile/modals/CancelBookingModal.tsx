"use client";

import React from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { BookingItem } from "@/types/profile";

export interface CancelBookingModalProps {
  booking: BookingItem | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  reasonCategory: string;
  setReasonCategory: (val: string) => void;
  customReason: string;
  setCustomReason: (val: string) => void;
  bankName: string;
  setBankName: (val: string) => void;
  customBank: string;
  setCustomBank: (val: string) => void;
  accountNumber: string;
  setAccountNumber: (val: string) => void;
  accountHolder: string;
  setAccountHolder: (val: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CancelBookingModal({
  booking,
  onClose,
  onSubmit,
  reasonCategory,
  setReasonCategory,
  customReason,
  setCustomReason,
  bankName,
  setBankName,
  customBank,
  setCustomBank,
  accountNumber,
  setAccountNumber,
  accountHolder,
  setAccountHolder,
  isSubmitting,
  error,
}: CancelBookingModalProps) {
  if (!booking) return null;

  const isPaidOrApproved = ["PAID", "APPROVED", "ACCEPTED"].includes(
    booking.status?.toUpperCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-float space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isPaidOrApproved
                ? "Pengajuan Pembatalan & Refund"
                : "Batalkan Pemesanan"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kos:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {booking.property.name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pembatalan"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isPaidOrApproved ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              Dana DP Anda dijamin aman melalui sistem escrow KosPasti. Mohon berikan informasi rekening atau akun e-wallet Anda untuk proses pengembalian dana.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Alasan Pembatalan <span className="text-rose-500">*</span>
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Perubahan rencana kuliah/studi">Perubahan rencana kuliah/studi</option>
                <option value="Salah memilih tipe kamar atau lokasi">Salah memilih tipe kamar atau lokasi</option>
                <option value="Menemukan alternatif hunian lain">Menemukan alternatif hunian lain</option>
                <option value="Tidak jadi merantau">Tidak jadi merantau</option>
                <option value="Lainnya">Alasan lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Keterangan Tambahan
              </label>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Jelaskan secara singkat alasan pembatalan..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Bank / E-Wallet Tujuan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">Bank BNI</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="DANA">DANA</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                {bankName === "Lainnya" && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama bank/e-wallet"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="mt-1.5 w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nomor Rekening / No HP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1234567890 / 0812xxx"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nama Pemilik Rekening (Sesuai Buku Tabungan / Akun) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap pemilik rekening"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim Pengajuan...</span>
                  </>
                ) : (
                  <span>Kirim Pengajuan Pembatalan</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Modal pembatalan untuk pesanan PENDING (belum bayar) */
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pesanan ini belum dibayar. Jika Anda membatalkan, pesanan akan langsung ditutup dan kamar akan kembali tersedia untuk penyewa lain.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Alasan Pembatalan
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Perubahan rencana kuliah/studi">Perubahan rencana kuliah/studi</option>
                <option value="Salah memilih tipe kamar atau lokasi">Salah memilih tipe kamar atau lokasi</option>
                <option value="Menemukan alternatif hunian lain">Menemukan alternatif hunian lain</option>
                <option value="Tidak jadi merantau">Tidak jadi merantau</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <span>Ya, Batalkan Pesanan</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
