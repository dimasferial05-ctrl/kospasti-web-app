"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building,
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  X,
  FileCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { HelpTooltip } from "@/components/ui/Tooltip";
import { CancelBookingModal } from "@/components/profile/modals/CancelBookingModal";
import { RenewBookingModal } from "@/components/profile/modals/RenewBookingModal";
import { BookingItem, UserProfile } from "@/types/profile";

export interface BookingsTabProps {
  bookings: BookingItem[];
  isLoadingBookings: boolean;
  isOnline: boolean;
  isOfflineBookings: boolean;
  bookingsLastSyncedAt: string | null;
  user: UserProfile | null;
  onBookingsUpdated?: () => void;
}

export function BookingsTab({
  bookings,
  isLoadingBookings,
  isOnline,
  isOfflineBookings,
  bookingsLastSyncedAt,
  user,
  onBookingsUpdated,
}: BookingsTabProps) {
  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelReasonCategory, setCancelReasonCategory] = useState("Perubahan rencana kuliah/studi");
  const [cancelCustomReason, setCancelCustomReason] = useState("");
  const [cancelBankName, setCancelBankName] = useState("BCA");
  const [cancelCustomBank, setCancelCustomBank] = useState("");
  const [cancelAccountNumber, setCancelAccountNumber] = useState("");
  const [cancelAccountHolder, setCancelAccountHolder] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Dispute Modal State
  const [disputeBooking, setDisputeBooking] = useState<BookingItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);

  // Renewal Modal State
  const [renewingBooking, setRenewingBooking] = useState<BookingItem | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const renderStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    if (upper === "ACCEPTED" || upper === "CONFIRMED" || upper === "APPROVED" || upper === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Disetujui</span>
          <HelpTooltip text="Pesanan telah disetujui pemilik kos. Anda dapat langsung berkomunikasi untuk persiapan check-in." />
        </span>
      );
    }
    if (upper === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Clock className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
          <span>Check-In Dikonfirmasi Mitra</span>
          <HelpTooltip text="Mitra mengonfirmasi Anda telah check-in. Terdapat masa tenggang 12 jam untuk melaporkan masalah jika ada kendala." />
        </span>
      );
    }
    if (upper === "DISPUTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>Dalam Sanggahan (Dispute)</span>
          <HelpTooltip text="Anda telah mengajukan sanggahan/masalah. Tim Admin KosPasti sedang menginvestigasi laporan Anda." />
        </span>
      );
    }
    if (upper === "PAYOUT_PENDING" || upper === "PAYOUT_PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Selesai</span>
          <HelpTooltip text="Check-in selesai dan masa sewa telah aktif." />
        </span>
      );
    }
    if (upper === "PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Menunggu Konfirmasi Pemilik</span>
          <HelpTooltip text="DP Anda telah terverifikasi lunas. Pemilik kos sedang memeriksa ketersediaan kamar untuk menyetujui pesanan Anda." />
        </span>
      );
    }
    if (upper === "REFUND_REQUESTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Menunggu Pengembalian Dana</span>
          <HelpTooltip text="Pengajuan pembatalan telah diterima. Pemilik kos sedang memproses pengembalian dana ke rekening/e-wallet Anda." />
        </span>
      );
    }
    if (upper === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-sky-600" />
          <span>Dana Telah Dikembalikan</span>
          <HelpTooltip text="Pengembalian dana telah selesai ditransfer oleh pemilik kos." />
        </span>
      );
    }
    if (upper === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span>Dibatalkan</span>
          <HelpTooltip text="Pesanan ini telah dibatalkan." />
        </span>
      );
    }
    if (upper === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Ditolak Pemilik</span>
          <HelpTooltip text="Pesanan tidak dapat dipenuhi pemilik kos." />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Menunggu Pembayaran DP</span>
        <HelpTooltip text="Silakan selesaikan pembayaran DP Anda sesuai batas waktu invoice untuk mengunci kamar kos." />
      </span>
    );
  };

  const handleOpenCancelModal = (booking: BookingItem) => {
    setCancellingBooking(booking);
    setCancelReasonCategory("Perubahan rencana kuliah/studi");
    setCancelCustomReason("");
    setCancelBankName("BCA");
    setCancelCustomBank("");
    setCancelAccountNumber("");
    setCancelAccountHolder(user?.name || booking.student_name || "");
    setCancelError(null);
  };

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    const isPaidOrApproved = ["PAID", "APPROVED", "ACCEPTED"].includes(cancellingBooking.status?.toUpperCase());

    const finalReason =
      cancelReasonCategory === "Lainnya"
        ? cancelCustomReason.trim()
        : cancelCustomReason.trim()
        ? `${cancelReasonCategory} - ${cancelCustomReason.trim()}`
        : cancelReasonCategory;

    const finalBank = cancelBankName === "Lainnya" ? cancelCustomBank.trim() : cancelBankName;

    if (isPaidOrApproved) {
      if (!finalReason) {
        setCancelError("Alasan pembatalan wajib diisi.");
        return;
      }
      if (!finalBank) {
        setCancelError("Nama Bank atau E-Wallet tujuan pengembalian dana wajib diisi.");
        return;
      }
      if (!cancelAccountNumber.trim()) {
        setCancelError("Nomor rekening atau nomor akun e-wallet tujuan wajib diisi.");
        return;
      }
      if (!cancelAccountHolder.trim()) {
        setCancelError("Nama lengkap pemilik rekening tujuan wajib diisi.");
        return;
      }
    }

    try {
      setIsSubmittingCancel(true);
      setCancelError(null);

      const res = await fetch(`/api/user/bookings/${cancellingBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: finalReason,
          bankName: finalBank,
          accountNumber: cancelAccountNumber.trim(),
          accountHolder: cancelAccountHolder.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setCancelError(data?.error || "Gagal memproses pembatalan pesanan.");
        return;
      }

      setCancelSuccessMsg(data.message || "Pesanan berhasil dibatalkan.");
      setTimeout(() => setCancelSuccessMsg(null), 5000);
      setCancellingBooking(null);
      if (onBookingsUpdated) {
        onBookingsUpdated();
      }
    } catch (err) {
      console.error("Gagal mengirim pembatalan:", err);
      setCancelError("Terjadi kesalahan jaringan saat memproses pembatalan.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div>
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Pemesanan Kos</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Daftar semua permohonan dan transaksi sewa kos yang pernah Anda buat.
        </p>
      </div>

      {(!isOnline || isOfflineBookings) && (
        <OfflineBanner
          title="Mode Offline: Riwayat Pesanan Tersimpan"
          message="Anda dapat tetap membuka dan mencetak Bukti Sewa (E-Receipt) dari pesanan yang tersimpan di perangkat."
          lastSyncedAt={bookingsLastSyncedAt}
          className="mb-6"
        />
      )}

      {/* Banner Feedback Pembatalan */}
      {cancelSuccessMsg && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {isLoadingBookings ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
          <p className="text-sm">Memuat riwayat pesanan...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Belum Ada Riwayat Pesanan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Anda belum pernah mengajukan sewa kos. Temukan kos impian Anda sekarang!
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            <span>Cari Kos Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {disputeSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{disputeSuccessMsg}</span>
            </div>
          )}
          {bookings.map((booking) => {
            const canCancel = ["PENDING", "PAID", "APPROVED", "ACCEPTED"].includes(
              booking.status?.toUpperCase()
            );

            return (
              <div
                key={booking.id}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition-colors flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      {booking.property?.image_url ? (
                        <Image
                          src={booking.property.image_url}
                          alt={booking.property.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <Building className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {booking.property?.name || "Kos"}
                        </h3>
                        {booking.property?.gender_type && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {booking.property.gender_type}
                          </span>
                        )}
                      </div>

                      {booking.property?.address && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{booking.property.address}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rencana Masuk: {formatDate(booking.move_in_date)}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Dipesan pada: {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:items-end items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {renderStatusBadge(booking.status)}

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Biaya Sewa</span>
                      <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(booking.property?.price_per_month || 0)}
                        <span className="text-xs font-medium text-slate-500">/bln</span>
                      </span>
                      {Boolean(booking.security_deposit && booking.security_deposit > 0) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                            <span>
                              Deposit {formatRupiah(booking.security_deposit || 0)}:{" "}
                              {booking.deposit_status === "REFUNDED"
                                ? "Dikembalikan"
                                : booking.deposit_status === "CLAIMED"
                                ? "Selesai Diklaim"
                                : "Ditahan Escrow"}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 w-full sm:w-auto justify-end">
                      {booking.status?.toUpperCase() === "PENDING" && (
                        <Link
                          href={`/checkout/${booking.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer text-center"
                        >
                          <span>Bayar Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {["ACCEPTED", "APPROVED", "PAID", "COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"].includes(booking.status?.toUpperCase()) && (
                        <>
                          <Link
                            href={`/contract/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`contract-btn-${booking.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Kontrak SPK</span>
                          </Link>

                          <Link
                            href={`/receipt/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`receipt-btn-${booking.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Kuitansi Resmi</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setRenewingBooking(booking)}
                            data-testid={`renew-btn-${booking.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Perpanjang Sewa</span>
                          </button>
                        </>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Batalkan Pesanan</span>
                        </button>
                      )}

                      {booking.property?.id && (
                        <Link
                          href={`/kos/${booking.property.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline px-2 py-1"
                        >
                          <span>Lihat Kos</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grace period & Dispute Banner for COMPLETED booking */}
                {booking.status?.toUpperCase() === "COMPLETED" && (() => {
                  const confirmedAt = booking.checkin_confirmed_at
                    ? new Date(booking.checkin_confirmed_at)
                    : null;
                  const deadline = confirmedAt
                    ? new Date(confirmedAt.getTime() + 12 * 60 * 60 * 1000)
                    : null;
                  const isWithinGracePeriod = deadline ? Date.now() < deadline.getTime() : false;

                  if (isWithinGracePeriod && deadline) {
                    const diffMs = deadline.getTime() - Date.now();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    return (
                      <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Check-In Dikonfirmasi Mitra (Masa Tenggang 12 Jam)</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                            Sisa waktu pengajuan masalah kamar:{" "}
                            <strong className="text-indigo-700 dark:text-indigo-300">
                              {diffHours} jam {diffMins} menit lagi
                            </strong>
                            . Jika tidak ada sanggahan, dana akan otomatis diteruskan ke mitra.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeBooking(booking);
                            setDisputeReason("");
                            setDisputeError(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                        >
                          Laporkan Masalah
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Check-in selesai dan masa tenggang telah berakhir. Selamat menikmati kamar kos Anda!</span>
                    </div>
                  );
                })()}

                {/* Dispute Info Banner */}
                {booking.status?.toUpperCase() === "DISPUTED" && (
                  <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Laporan Kendala (Dispute) Sedang Ditangani</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Tim Admin KosPasti sedang menginvestigasi laporan Anda dan menahan pencairan dana ke mitra. Kami akan segera menghubungi Anda.
                    </p>
                    {booking.cancellation_reason && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                        <strong>Keterangan masalah:</strong> {booking.cancellation_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Info Pembatalan / Refund Details jika ada */}
                {((booking.cancellation_reason && booking.status?.toUpperCase() !== "DISPUTED") || booking.refund_bank_name || booking.refund_note) && (
                  <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl text-xs space-y-1">
                    {booking.cancellation_reason && booking.status?.toUpperCase() !== "DISPUTED" && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Alasan Pembatalan:</strong>{" "}
                        {booking.cancellation_reason}
                      </p>
                    )}
                    {booking.refund_bank_name && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Rekening Tujuan Refund:</strong>{" "}
                        {booking.refund_bank_name} - {booking.refund_account_number} a.n. {booking.refund_account_holder}
                      </p>
                    )}
                    {booking.refund_note && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                        <strong>Catatan Refund:</strong> {booking.refund_note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pembatalan Pesanan */}
      <CancelBookingModal
        booking={cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        onSubmit={handleSubmitCancel}
        reasonCategory={cancelReasonCategory}
        setReasonCategory={setCancelReasonCategory}
        customReason={cancelCustomReason}
        setCustomReason={setCancelCustomReason}
        bankName={cancelBankName}
        setBankName={setCancelBankName}
        customBank={cancelCustomBank}
        setCustomBank={setCancelCustomBank}
        accountNumber={cancelAccountNumber}
        setAccountNumber={setCancelAccountNumber}
        accountHolder={cancelAccountHolder}
        setAccountHolder={setCancelAccountHolder}
        isSubmitting={isSubmittingCancel}
        error={cancelError}
      />

      {/* Modal Laporkan Masalah / Dispute */}
      {disputeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-float space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Laporkan Masalah Check-In
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {disputeBooking.property.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisputeBooking(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {disputeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{disputeError}</span>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Pengajuan masalah akan menahan dana sewa Anda di sistem Escrow KosPasti agar tidak dicairkan ke pemilik kos. Tim Admin akan memverifikasi laporan Anda secepatnya.
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!disputeReason.trim()) {
                  setDisputeError("Mohon deskripsikan masalah yang Anda alami.");
                  return;
                }

                setIsSubmittingDispute(true);
                setDisputeError(null);

                try {
                  const res = await fetch(`/api/user/bookings/${disputeBooking.id}/dispute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: disputeReason.trim() }),
                  });

                  const data = await res.json();
                  if (!res.ok || !data.success) {
                    throw new Error(data.error || "Gagal mengajukan dispute.");
                  }

                  setDisputeSuccessMsg("Laporan masalah Anda berhasil diajukan. Tim Admin akan segera menghubungi Anda.");
                  setDisputeBooking(null);
                  if (onBookingsUpdated) {
                    onBookingsUpdated();
                  }
                } catch (err: unknown) {
                  setDisputeError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim laporan.");
                } finally {
                  setIsSubmittingDispute(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Jelaskan Masalah / Kendala <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Contoh: Kamar tidak sesuai foto, pemilik tidak dapat dihubungi saat check-in, atau fasilitas utama rusak."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmittingDispute}
                  onClick={() => setDisputeBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingDispute ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Kirim Laporan Masalah</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Perpanjangan Sewa */}
      <RenewBookingModal
        booking={renewingBooking}
        onClose={() => setRenewingBooking(null)}
        onSuccess={() => {
          setRenewingBooking(null);
          if (onBookingsUpdated) {
            onBookingsUpdated();
          }
        }}
      />
    </div>
  );
}
