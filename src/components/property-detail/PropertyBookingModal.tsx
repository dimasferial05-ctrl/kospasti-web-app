"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, User, ArrowRight, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { RoomTypeItem } from "@/app/kos/[id]/page";

export interface PropertyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoomType: RoomTypeItem | null;
  studentName: string;
  waNumber: string;
  userAvatar?: string | null;
  moveInDate: string;
  setMoveInDate: (date: string) => void;
  minDate: string;
  isSubmitting: boolean;
  bookingError: string | null;
  setBookingError: (err: string | null) => void;
  dateValidationError: boolean;
  setDateValidationError: (err: boolean) => void;
  onSubmit: () => void;
  pendingBookingNotice: { isOpen: boolean; message: string };
  onClosePendingNotice: () => void;
}

export function PropertyBookingModal({
  isOpen,
  onClose,
  selectedRoomType,
  studentName,
  waNumber,
  userAvatar,
  moveInDate,
  setMoveInDate,
  minDate,
  isSubmitting,
  bookingError,
  setBookingError,
  dateValidationError,
  setDateValidationError,
  onSubmit,
  pendingBookingNotice,
  onClosePendingNotice,
}: PropertyBookingModalProps) {
  const router = useRouter();

  const bookingModalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: () => {
      onClose();
      setBookingError(null);
      setDateValidationError(false);
    },
  });

  const pendingModalRef = useFocusTrap<HTMLDivElement>({
    isOpen: pendingBookingNotice.isOpen,
    onClose: onClosePendingNotice,
  });

  return (
    <>
      {/* 4. BOOKING FORM MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
              setBookingError(null);
              setDateValidationError(false);
            }
          }}
        >
          <div
            ref={bookingModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            aria-describedby="booking-modal-desc"
            className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl shadow-xl border border-transparent dark:border-slate-800 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
          >
            <div>
              <h3
                id="booking-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Konfirmasi Pemesanan
              </h3>
              <p
                id="booking-modal-desc"
                className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
              >
                Pilih rencana tanggal mulai masuk untuk kamar kos ini.
              </p>
            </div>

            {/* Selected Room Type Info */}
            {selectedRoomType && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    Tipe Kamar Dipilih
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedRoomType.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    Rp {selectedRoomType.price_per_month.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">/ bulan</p>
                </div>
              </div>
            )}

            {/* User Profile Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Data Pemesan (Akun Anda)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Terverifikasi
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={studentName || "Foto Profil"}
                      fill
                      className="object-cover rounded-full"
                      unoptimized={
                        userAvatar.startsWith("blob:") || userAvatar.startsWith("data:")
                      }
                    />
                  ) : (
                    <span>
                      {studentName ? (
                        studentName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((w) => w[0].toUpperCase())
                          .join("")
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {studentName || "Pengguna"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {waNumber ? `WhatsApp: ${waNumber}` : "Nomor WhatsApp akun"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-1">
              {bookingError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-2 animate-in fade-in duration-200"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <p className="font-medium leading-relaxed">{bookingError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingError(null)}
                    className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 p-0.5 rounded transition-colors"
                    aria-label="Tutup pemberitahuan error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rencana Tanggal Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={moveInDate}
                  onChange={(e) => {
                    setMoveInDate(e.target.value);
                    if (dateValidationError) setDateValidationError(false);
                    if (bookingError) setBookingError(null);
                  }}
                  required
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors ${
                    dateValidationError
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/40 text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                      : "border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  }`}
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setBookingError(null);
                    setDateValidationError(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSubmit}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200 cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Memproses..." : "Lanjut Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL PERINGATAN PESANAN PENDING (ANTI-SPAM BOOKING) */}
      {pendingBookingNotice.isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClosePendingNotice();
          }}
        >
          <div
            ref={pendingModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-booking-title"
            aria-describedby="pending-booking-desc"
            className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-xl border border-transparent dark:border-slate-800 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3
                  id="pending-booking-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Pesanan Masih Menunggu Pembayaran
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selesaikan pesanan sebelumnya terlebih dahulu
                </p>
              </div>
            </div>

            <p
              id="pending-booking-desc"
              className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800"
            >
              {pendingBookingNotice.message}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClosePendingNotice}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer text-sm order-2 sm:order-1"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => router.push("/profil?tab=bookings")}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-soft hover:shadow-float transition-all cursor-pointer text-sm flex items-center justify-center gap-1.5 order-1 sm:order-2"
              >
                <span>Riwayat Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
