import React from "react";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";

export function PartnerCTASection() {
  const pillars = [
    {
      icon: Building2,
      title: "Manajemen Kamar Terpusat",
      desc: "Pantau status kamar kosong vs terisi, masa sewa, dan data identitas penghuni dalam satu dashboard.",
    },
    {
      icon: MessageCircle,
      title: "Otomasi Penagihan WhatsApp",
      desc: "Sistem otomatis mengirim pengingat jatuh tempo sewa dan invoice resmi ke nomor WhatsApp penyewa.",
    },
    {
      icon: Wallet,
      title: "Pencairan Dana Langsung",
      desc: "Uang sewa diteruskan otomatis ke rekening bank Anda dengan rekapitulasi laporan keuangan yang rapi.",
    },
    {
      icon: Users,
      title: "Pemasaran Properti Terarah",
      desc: "Kos Anda dipromosikan langsung ke ribuan mahasiswa dan pekerja yang mencari hunian setiap harinya.",
    },
  ];

  return (
    <section id="mitra" className="py-20 sm:py-28 bg-slate-900 text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-slate-800">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
              Portal Pemilik &amp; Pengelola Properti
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 leading-tight">
              Punya Properti Kos? Kelola Cerdas &amp; Maksimalkan Okupansi
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Tinggalkan pembukuan manual. Bergabunglah menjadi Mitra KosPasti untuk menikmati otomasi manajemen kamar, penagihan sewa otomatis, dan perlindungan transaksi resmi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95"
            >
              <span>Daftar Sebagai Mitra Kos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Tim%20KosPasti,%20saya%20ingin%20konsultasi%20kemitraan%20properti%20kos."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Konsultasi Kemitraan</span>
            </a>
          </div>
        </div>

        {/* 4 Clean Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
