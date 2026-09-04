"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowLeft, Receipt } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* Header Card Sukses */}
        <div className="bg-green-500 p-6 sm:p-8 text-center text-white flex flex-col items-center justify-center">
          <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-xs">
            <CheckCircle2 className="w-16 h-16 text-white animate-bounce-short" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pembayaran DP Berhasil!
          </h1>
          <p className="text-sm text-green-100 mt-1">
            Transaksi Anda telah berhasil diverifikasi oleh sistem.
          </p>
        </div>

        {/* Body Card: Struk Digital */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rincian Transaksi
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ID Transaksi</span>
              <span className="font-mono font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                {bookingId || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Metode Pembayaran</span>
              <span className="font-semibold text-slate-900">QRIS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Waktu Pembayaran</span>
              <span className="text-slate-900 font-medium">Hari Ini</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status</span>
              <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full">
                Lunas (DP)
              </span>
            </div>
          </div>

          {/* Kotak Pemberitahuan Escrow */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 items-start mt-6">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-blue-900">
                Dana Anda Aman
              </h2>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Sistem Escrow KosPasti menahan dana DP Anda. Uang ini baru akan diteruskan ke Ibu Kos SETELAH Anda tiba di lokasi dan melakukan check-in.
              </p>
            </div>
          </div>

          {/* Tombol Navigasi */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3.5 rounded-xl font-semibold mt-6 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
