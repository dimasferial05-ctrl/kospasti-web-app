import React from "react";
import Link from "next/link";
import { Home, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

export function RoleCardsSection() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50/70">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro text */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-extrabold">KosPasti</strong> hadir untuk memberikan kepastian dan kenyamanan sewa kos bagi pencari hunian maupun pemilik properti.
          </p>
        </div>

        {/* 2 Floating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Pencari Kos */}
          <div className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-soft hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center animate-float">
            {/* Illustration / Graphic Icon Container */}
            <div className="w-24 h-24 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300 shadow-xs">
              <Home className="w-12 h-12 stroke-[1.5]" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
              Saya Pencari Kos
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mb-6 font-normal">
              Temukan kamar kos impian dengan kepastian fasilitas, ulasan asli, dan garansi pembayaran aman.
            </p>

            <ul className="flex flex-col gap-2.5 text-xs text-slate-500 mb-8 text-left w-full max-w-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ketersediaan kamar terupdate real-time</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transaksi aman via Escrow Midtrans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Garansi 100% uang kembali</span>
              </li>
            </ul>

            <div className="mt-auto w-full">
              <Link
                href="/search"
                className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-lg active:scale-98"
              >
                <span>Cari Kos Sekarang</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 2: Pemilik Kos */}
          <div className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-soft hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center animate-float-slow">
            {/* Illustration / Graphic Icon Container */}
            <div className="w-24 h-24 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-teal-100 transition-all duration-300 shadow-xs">
              <Building2 className="w-12 h-12 stroke-[1.5]" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
              Saya Pemilik Kos
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mb-6 font-normal">
              Kelola kamar kos secara otomatis, otomasi penagihan via WhatsApp, dan maksimalkan okupansi properti Anda.
            </p>

            <ul className="flex flex-col gap-2.5 text-xs text-slate-500 mb-8 text-left w-full max-w-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Dashboard manajemen kamar terpusat</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Notifikasi penagihan WhatsApp otomatis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Pencairan dana langsung ke rekening</span>
              </li>
            </ul>

            <div className="mt-auto w-full">
              <a
                href="#mitra"
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-300 transition-all flex items-center justify-center gap-2 shadow-xs group-hover:border-emerald-600 group-hover:text-emerald-600 active:scale-98"
              >
                <span>Pelajari Kemitraan Mitra</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
