"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  ArrowRight,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

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
    <section id="mitra" className="relative">
      <AuroraBackground className="py-20 sm:py-28 bg-slate-950 text-white relative w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          {/* Header Content with Motion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-slate-800/80"
          >
            <div className="max-w-2xl">

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 leading-tight">
                Punya Properti Kos? Kelola Cerdas &amp; Maksimalkan Okupansi
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Tinggalkan pembukuan manual. Bergabunglah menjadi Mitra KosPasti untuk menikmati otomasi manajemen kamar, penagihan sewa otomatis, dan perlindungan transaksi resmi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
              >
                <span>Daftar Sebagai Mitra Kos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Tim%20KosPasti,%20saya%20ingin%20konsultasi%20kemitraan%20properti%20kos."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:border-slate-600"
              >
                <span>Konsultasi Kemitraan</span>
              </a>
            </div>
          </motion.div>

          {/* 4 Clean Value Pillars Grid with Motion */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md flex flex-col justify-between hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all duration-300 shadow-xl group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AuroraBackground>
    </section>
  );
}
