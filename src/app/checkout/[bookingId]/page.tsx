"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrCode, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      router.push(`/success/${bookingId}`);
    }, 1500);
  };

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

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="border-b border-slate-100 pb-3">
                <p className="text-xs text-slate-500">ID Booking</p>
                <p className="font-mono text-sm font-semibold text-slate-800">
                  {bookingId || "BKG-12345"}
                </p>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <p className="text-xs text-slate-500">Tipe Pembayaran</p>
                <p className="text-sm font-semibold text-slate-800">
                  Booking Fee (Escrow)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Tagihan</p>
                <p className="text-lg font-bold text-blue-600">
                  Rp 100.000{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (Contoh)
                  </span>
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
