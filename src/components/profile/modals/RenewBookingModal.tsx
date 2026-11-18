"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Calendar, Home, AlertCircle, Loader2, X, ArrowRight, ShieldCheck } from "lucide-react";
import { BookingItem } from "@/types/profile";

export interface RenewBookingModalProps {
  booking: BookingItem | null;
  onClose: () => void;
  onSuccess?: (newBookingId: string) => void;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function RenewBookingModal({
  booking,
  onClose,
  onSuccess,
}: RenewBookingModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  // Hitung estimasi tanggal sewa periode baru (+1 bulan kalender penuh)
  const prevMoveIn = new Date(booking.move_in_date);
  const nextPeriodDate = new Date(prevMoveIn);
  nextPeriodDate.setMonth(nextPeriodDate.getMonth() + 1);

  const nextEndDate = new Date(nextPeriodDate);
  nextEndDate.setMonth(nextEndDate.getMonth() + 1);

  const rentalAmount =
    booking.room_type?.price_per_month ??
    booking.property?.price_per_month ??
    booking.amount ??
    0;

  const handleConfirmRenew = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses perpanjangan sewa.");
      }

      if (onSuccess) {
        onSuccess(data.data.id);
      }

      // Arahkan ke halaman checkout pembayaran
      router.push(data.data.checkoutUrl || `/checkout/${data.data.id}`);
    } catch (err: unknown) {
      console.error("Gagal perpanjang sewa:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperpanjang sewa.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-float space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Perpanjang Sewa Kos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lanjutkan masa tinggal Anda tanpa risiko kamar diserobot orang lain.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Ringkasan Kamar & Periode */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <Home className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kos & Kamar yang Ditempati</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {booking.property?.name || "Kos"}
              </div>
              {booking.room_type?.name && (
                <div className="text-slate-600 dark:text-slate-300 text-xs">
                  Tipe: {booking.room_type.name}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode Perpanjangan Baru</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {formatDate(nextPeriodDate.toISOString())} s.d. {formatDate(nextEndDate.toISOString())}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Otomatis menambah masa tinggal 1 bulan kalender penuh
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Biaya Sewa Bulanan:</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(rentalAmount)}
            </span>
          </div>
        </div>

        {/* Informasi Perlindungan Escrow */}
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Kamar Anda otomatis diamankan dan pembayaran dilindungi oleh sistem Rekening Bersama KosPasti.
          </span>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmRenew}
            disabled={isSubmitting}
            data-testid="confirm-renew-button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-soft hover:shadow-float transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
