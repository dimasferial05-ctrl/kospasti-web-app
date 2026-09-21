"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  QrCode,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  BedDouble,
  Receipt,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface BookingDetail {
  id: string;
  studentName: string;
  studentWhatsapp: string;
  moveInDate: string;
  status: string;
  createdAt: string;
  property: {
    id: string;
    name: string;
    address: string | null;
    price_per_month: number;
    image_url: string | null;
    gender_type: string;
  } | null;
  roomType: {
    id: string;
    name: string;
    price_per_month: number;
    image_url: string | null;
  } | null;
  pricing: {
    rentPrice: number;
    adminFee: number;
    totalPrice: number;
  };
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
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

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadBooking() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Gagal memuat detail pesanan");
        }
        if (isMounted) {
          setBooking(result.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Fetch booking detail error:", err);
          setFetchError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat rincian pesanan"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || "Gagal mengonfirmasi pembayaran"
        );
      }

      router.push(`/success/${bookingId}`);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.";
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  const rentPrice = booking?.pricing?.rentPrice ?? 0;
  const adminFee = booking?.pricing?.adminFee ?? 5000;
  const totalPrice = booking?.pricing?.totalPrice ?? rentPrice + adminFee;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-5xl mx-auto">
        {/* Tombol Kembali / Header Brand */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pembayaran Aman</span>
          </div>
        </div>

        {/* Wrapper Dua Kolom (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* KOLOM KIRI: Ringkasan Pesanan & Panduan */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ringkasan Pesanan</h2>
              <p className="text-sm text-slate-500">
                Periksa kembali detail pesanan Anda sebelum melakukan pembayaran.
              </p>
            </div>

            {fetchError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Informasi Pesanan</p>
                  <p className="text-xs text-amber-700 mt-0.5">{fetchError}</p>
                </div>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3.5">
              {/* ID Booking & Status */}
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">ID Booking</p>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {bookingId || "BKG-12345"}
                  </p>
                </div>
                {booking?.status && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      booking.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                )}
              </div>

              {/* Detail Properti & Kamar */}
              {isLoading ? (
                <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Memuat detail pesanan...</span>
                </div>
              ) : booking ? (
                <div className="border-b border-slate-100 pb-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{booking.property?.name || "Kos"}</span>
                  </div>
                  {booking.roomType && (
                    <div className="flex items-center gap-2 pl-0.5 text-slate-600">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Tipe: {booking.roomType.name}</span>
                    </div>
                  )}
                  {booking.moveInDate && (
                    <div className="flex items-center gap-2 pl-0.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Mulai Masuk: {formatDate(booking.moveInDate)}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Tipe Pembayaran */}
              <div className="border-b border-slate-100 pb-3">
                <p className="text-xs text-slate-500">Tipe Pembayaran</p>
                <p className="text-sm font-semibold text-slate-800">
                  Booking Fee (Escrow)
                </p>
              </div>

              {/* Rincian Harga / Breakdown */}
              <div className="space-y-2 pt-1 border-b border-slate-100 pb-3.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Biaya Sewa Kos (1 Bulan)</span>
                  <span className="font-medium text-slate-800">
                    {isLoading
                      ? "..."
                      : booking
                      ? formatRupiah(rentPrice)
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Biaya Layanan / Admin
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                      Flat
                    </span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatRupiah(adminFee)}
                  </span>
                </div>
              </div>

              {/* Total Tagihan */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs text-slate-500">Total Tagihan</p>
                  <p className="text-xs text-slate-400">Sudah termasuk biaya admin</p>
                </div>
                <p className="text-xl font-bold text-blue-600 tracking-tight">
                  {isLoading
                    ? "..."
                    : booking
                    ? formatRupiah(totalPrice)
                    : formatRupiah(totalPrice)}
                </p>
              </div>
            </div>

            {/* Panduan Pembayaran */}
            <div className="bg-slate-50/80 rounded-xl p-4 text-left border border-slate-100">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Panduan Pembayaran:
              </h2>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>Buka aplikasi Gopay, OVO, DANA, BCA, atau M-Banking Anda.</li>
                <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                <li>Arahkan kamera ke QR Code di samping atau di bawah.</li>
                <li>Konfirmasi pembayaran dan masukkan PIN Anda.</li>
              </ol>
            </div>
          </div>

          {/* KOLOM KANAN: Kartu Pembayaran QRIS */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden text-center p-6 sm:p-8">
              {/* Header Card & Badge QRIS */}
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center bg-slate-900 text-white font-extrabold tracking-widest text-xs px-3 py-1 rounded-md uppercase">
                  QRIS
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Pembayaran DP Kos
                </h1>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Gunakan aplikasi e-Wallet atau M-Banking Anda untuk menyelesaikan pesanan.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="my-6 p-4 sm:p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center transition-all hover:border-slate-300">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <QrCode className="w-44 h-44 sm:w-48 sm:h-48 text-slate-800" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  NMID: ID1020000123456 • KOSPASTI
                </p>
                {bookingId && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ref ID: <span className="font-mono text-slate-600">{bookingId}</span>
                  </p>
                )}
                <div className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  Nominal: {formatRupiah(totalPrice)}
                </div>
              </div>

              {/* Tombol Simulasi Pembayaran */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Simulasikan Pembayaran Berhasil</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-slate-400 mt-8">
          KosPasti Instant Checkout &bull; Pembayaran Otomatis & Terverifikasi
        </p>
      </div>
    </div>
  );
}
