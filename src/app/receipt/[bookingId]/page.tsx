"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeImage } from "@/components/ui/ThemeImage";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Home,
  QrCode,
  Loader2,
  AlertCircle,
  Receipt,
} from "lucide-react";

interface BookingReceiptDetail {
  id: string;
  studentName: string;
  studentWhatsapp: string;
  studentEmail: string | null;
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
    owner?: {
      name: string;
      whatsapp_number: string;
    } | null;
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

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function BookingReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    async function loadBooking() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Gagal memuat kuitansi pesanan");
        }
        if (isMounted) {
          setBooking(result.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Terjadi kesalahan saat memuat kuitansi";
          setError(msg);
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

  // Set document title to format default PDF download name
  useEffect(() => {
    if (booking) {
      const receiptNo = `KP-INV-${new Date(booking.createdAt).getFullYear()}${String(
        new Date(booking.createdAt).getMonth() + 1
      ).padStart(2, "0")}-${booking.id.slice(0, 8).toUpperCase()}`;
      document.title = `Kuitansi-KosPasti-${receiptNo}`;
    }
  }, [booking]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Memuat kuitansi resmi KosPasti...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-soft">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Kuitansi Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {error || "Data pesanan tidak dapat diakses atau telah dihapus."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const receiptNo = `KP-INV-${new Date(booking.createdAt).getFullYear()}${String(
    new Date(booking.createdAt).getMonth() + 1
  ).padStart(2, "0")}-${booking.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-6 sm:py-10 px-4 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Inline Print Styles to cleanly isolate receipt */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          .mobile-bottom-nav,
          button,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Screen Only) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            data-testid="print-receipt-button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Main Receipt Sheet (A4 Styled Document) */}
      <main
        id="receipt-sheet"
        className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black"
        style={{ breakInside: "avoid" }}
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          <div className="flex items-start gap-3.5">
            <ThemeImage
              srcLight="/logo.jpg"
              srcDark="/logo-dark.png"
              alt="KosPasti Logo"
              width={44}
              height={44}
              className="w-11 h-11 rounded-xl object-cover shadow-xs shrink-0 print:border print:border-slate-300"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white print:text-black tracking-tight leading-none">
                  KosPasti
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 print:bg-emerald-50 print:text-emerald-800">
                  Resmi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                Platform Sewa Kos &amp; Rekening Bersama Escrow Indonesia
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 print:text-slate-500">
                www.kospasti.id &bull; support@kospasti.id
              </p>
            </div>
          </div>

          {/* Stempel Digital "LUNAS (ESCROW DIJAMIN)" */}
          <div className="flex items-center self-end sm:self-auto">
            <div
              data-testid="digital-stamp"
              className="border-2 border-dashed border-emerald-600 text-emerald-700 dark:text-emerald-400 print:border-emerald-700 print:text-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 print:bg-transparent px-4 py-2 rounded-xl -rotate-6 select-none uppercase font-black text-center shadow-xs"
            >
              <div className="text-sm tracking-widest font-black leading-tight">LUNAS</div>
              <div className="text-[8px] sm:text-[9px] font-bold tracking-tight text-emerald-600 print:text-emerald-700 mt-0.5">
                ESCROW DIJAMIN 12 JAM
              </div>
              <div className="text-[7px] text-slate-400 print:text-slate-500 tracking-wider">
                KOSPASTI OFFICIAL
              </div>
            </div>
          </div>
        </div>

        {/* Document Title & Reference Meta */}
        <div className="py-6 border-b border-slate-100 dark:border-slate-800 print:border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white print:text-black tracking-tight uppercase">
                Voucher Booking &amp; Bukti Pembayaran Resmi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                Tunjukkan dokumen ini saat kedatangan untuk serah terima kunci kamar kos.
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 print:text-slate-500">
                Nomor Kuitansi
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white print:text-black">
                {receiptNo}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 print:border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Waktu Bayar:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">
                {formatDateTime(booking.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Metode Bayar:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                QRIS (Instant Settlement)
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Status Dana:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 print:text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Escrow Diamankan</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Booking ID:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 print:text-black truncate block">
                {booking.id}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Details: Student & Property */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          {/* Kolom 1: Data Penyewa */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 print:bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 print:border-slate-300 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Penyewa (Mahasiswa)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Nama Lengkap:</span>
                <span className="font-bold text-slate-900 dark:text-white print:text-black text-sm">
                  {booking.studentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Nomor WhatsApp:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">
                  {booking.studentWhatsapp || "-"}
                </span>
              </div>
              {booking.studentEmail && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Email Terdaftar:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">
                    {booking.studentEmail}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Rencana Masuk (Check-in):</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-800 text-xs mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(booking.moveInDate)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Data Properti & Pemilik Kos */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 print:bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 print:border-slate-300 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Properti Kos &amp; Kontak Pemilik</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Nama Properti Kos:</span>
                <span className="font-bold text-slate-900 dark:text-white print:text-black text-sm">
                  {booking.property?.name || "Kos Tidak Diketahui"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Tipe Kamar:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black">
                  {booking.roomType?.name || "Kamar Reguler"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Alamat Lengkap:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 print:text-black leading-relaxed">
                  {booking.property?.address || "Alamat lengkap kos akan diberikan pemilik."}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 print:border-slate-300">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Pemilik / Pengelola:</span>
                <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                  {booking.property?.owner?.name || "Pengelola Properti Kos"}
                </span>
                {booking.property?.owner?.whatsapp_number && (
                  <span className="text-slate-600 dark:text-slate-400 print:text-slate-600 block text-[11px]">
                    WhatsApp: {booking.property.owner.whatsapp_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown & Escrow Note */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rincian Pembayaran Lunas</span>
          </div>

          <div className="bg-slate-50/60 dark:bg-slate-800/30 print:bg-white rounded-xl border border-slate-200/80 dark:border-slate-800 print:border-slate-300 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 print:text-slate-700">
              <span>Uang Muka / Sewa Kos Bulan Pertama</span>
              <span className="font-medium text-slate-900 dark:text-white print:text-black">
                {formatRupiah(booking.pricing.rentPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 print:text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>Biaya Layanan &amp; Penjaminan Escrow</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                  Flat
                </span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white print:text-black">
                {formatRupiah(booking.pricing.adminFee)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 print:border-slate-300 flex items-center justify-between font-bold text-sm">
              <span className="text-slate-900 dark:text-white print:text-black">
                Total Pembayaran Diterima
              </span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400 print:text-black">
                {formatRupiah(booking.pricing.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Verification & Handover Instructions */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center gap-6">
          <div className="p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center shrink-0">
            {/* Scannable Dynamic QR Code with Fallback */}
            <div className="w-24 h-24 relative flex items-center justify-center overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `https://kospasti.id/receipt/${booking.id}`
                )}&margin=2`}
                alt={`QR Verifikasi ${booking.id}`}
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallbackEl = document.getElementById("qr-fallback-icon");
                  if (fallbackEl) fallbackEl.style.display = "block";
                }}
              />
              <div id="qr-fallback-icon" style={{ display: "none" }}>
                <QrCode className="w-24 h-24 text-slate-800" />
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase font-bold tracking-wider">
              {booking.id.slice(0, 12)}
            </span>
          </div>

          <div className="space-y-2 text-xs text-left">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white print:text-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instruksi Serah Terima Kunci Kamar:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400 print:text-slate-700 text-[11px] sm:text-xs">
              <li>Tunjukkan voucher ini kepada Pemilik/Pengelola Kos saat Anda tiba di lokasi.</li>
              <li>Pemilik kos akan mencocokkan Booking ID dan menyerahkan kunci kamar kepada Anda.</li>
              <li>
                Lakukan pengecekan fisik kamar kos. Anda dilindungi jaminan garansi penahanan dana sewa
                selama <strong>12 jam</strong> sejak waktu check-in.
              </li>
            </ol>
          </div>
        </div>

        {/* Legal Escrow Notice & Footer */}
        <div className="pt-6 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 print:text-slate-500 leading-relaxed space-y-3">
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 print:bg-transparent print:border-slate-300 print:text-black">
            <strong>Jaminan Transaksi Escrow 12 Jam:</strong> Seluruh pembayaran sewa pada dokumen ini
            ditampung di rekening escrow resmi KosPasti dan baru dicairkan ke pemilik properti 12 jam
            pasca kedatangan. Jika kondisi kamar tidak sesuai secara material, Anda berhak mengajukan
            sengketa (dispute) pengembalian dana 100% melalui menu Riwayat Pemesanan.
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <span>Dicetak secara elektronik melalui sistem resmi KosPasti. Sah tanpa tanda tangan basah.</span>
            <span className="font-mono">Verifikasi: https://kospasti.id/receipt/{booking.id}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
