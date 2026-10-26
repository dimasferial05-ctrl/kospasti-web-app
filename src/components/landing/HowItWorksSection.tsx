import React from "react";
import { ThemeImage } from "@/components/ui/ThemeImage";

export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Cari Kos & Filter Kebutuhan",
      description:
        "Gunakan pencarian cerdas berbasis AI atau filter fasilitas, rentang harga, dan lokasi strategis di sekitar kampus atau kantor.",
    },
    {
      number: "2",
      title: "Tanya Pemilik & Cek Ulasan",
      description:
        "Hubungi pemilik langsung via WhatsApp dan baca ulasan jujur dari penghuni yang terverifikasi.",
    },
    {
      number: "3",
      title: "Booking & Bayar dengan Escrow",
      description:
        "Selesaikan transaksi via QRIS atau Virtual Account bank resmi. Uang sewa aman tersimpan hingga Anda sukses check-in.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="w-8 h-0.5 bg-slate-900 dark:bg-emerald-400 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            KosPasti mempermudah proses sewa kos hanya dalam 3 langkah mudah:
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Aplikasi Progressive Web App (PWA) yang responsif dan nyaman digunakan di Laptop, Tablet, maupun Smartphone Anda.
          </p>
        </div>

        {/* 2-Column: Desktop + Mobile PWA Images Showcase on Left + Numbered Steps on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Responsive Desktop + Mobile Overlap Showcase */}
          <div className="lg:col-span-6 flex justify-center relative pb-10 sm:pb-12">
            {/* Desktop Preview Frame */}
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
              {/* Desktop Image View */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative aspect-[16/10]">
                <ThemeImage
                  srcLight="/images/desktop-preview.jpeg"
                  srcDark="/images/desktop-dark-preview.jpeg"
                  alt="Tampilan Desktop KosPasti Web App"
                  fill
                  className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
            </div>

            {/* Overlapping Mobile Smartphone Mockup on Bottom-Right */}
            <div className="absolute -bottom-4 right-0 sm:-right-2 w-36 sm:w-44 h-72 sm:h-84 bg-slate-950 rounded-[28px] p-2 shadow-xl border-2 border-slate-800 z-20">
              {/* Smartphone Top Speaker Notch */}
              <div className="w-12 h-2.5 bg-slate-800 rounded-full mx-auto mb-1.5" />
              {/* Smartphone Image Container */}
              <div className="w-full h-[calc(100%-14px)] rounded-[20px] overflow-hidden bg-white dark:bg-slate-900 shadow-inner relative">
                <ThemeImage
                  srcLight="/images/mobile-preview.jpeg"
                  srcDark="/images/mobile-dark-preview.jpeg"
                  alt="Tampilan Mobile PWA KosPasti"
                  fill
                  className="object-cover object-top"
                  sizes="200px"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Numbered Step List */}
          <div className="lg:col-span-6 flex flex-col gap-8 sm:gap-10">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group flex items-start gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono shrink-0 leading-none group-hover:scale-110 transition-transform">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
