"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white pt-10 sm:pt-16 pb-0">
      {/* Glow decorative blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-emerald-200/30 via-teal-100/20 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">

        {/* Big centered question headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.18] max-w-3xl">
          Temukan Kos Impian atau{" "}
          <span className="text-emerald-600">Kelola Propertimu?</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          Cari info kos dengan kepastian kamar real-time, transaksi aman bergaransi, atau kembangkan bisnis kos Anda bersama KosPasti.
        </p>

        {/* Floating Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-2xl mt-8 sm:mt-10 p-2 bg-white rounded-2xl sm:rounded-full border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-2 relative z-20"
        >
          <div className="flex items-center gap-3 w-full px-4 py-1.5">
            <Search className="w-5 h-5 text-emerald-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik lokasi, nama kampus, atau fasilitas kos..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-hidden py-1"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-full transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md hover:scale-[1.02] active:scale-98"
          >
            <span>Cari Kos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Map Link */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>Ingin mencari langsung di peta interaktif?</span>
          <Link
            href="/map"
            className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Buka Peta Kos →</span>
          </Link>
        </div>
      </div>

      {/* Hero Architectural / Building Image Banner (Ready for user's custom image) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <div className="relative w-full h-56 sm:h-80 lg:h-96 rounded-t-3xl overflow-hidden border-t border-x border-slate-200/80 shadow-2xl bg-slate-900 group">
          {/* Architectural Image */}
          <Image
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80"
            alt="Modern Kos Building Architecture"
            fill
            priority
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />

          {/* Clean Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

          {/* Banner Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-2 drop-shadow-sm">
                  Ribuan Kamar Kos Siap Huni &amp; Terverifikasi
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-lg drop-shadow-xs">
                  Bebas biaya siluman dengan jaminan pengembalian dana 100% jika kondisi kamar tidak sesuai deskripsi.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/search"
                  className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-lg hover:scale-105"
                >
                  Jelajahi Listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
