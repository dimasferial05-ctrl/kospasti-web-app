"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Bagaimana sistem pembayaran aman (Escrow) di KosPasti melindungi penyewa?",
      answer:
        "Saat Anda membayar uang sewa, dana disimpan di rekening penampung resmi. Pemilik kos baru menerima pencairan dana setelah Anda berhasil check-in dan mengonfirmasi bahwa kondisi kamar serta fasilitas sesuai dengan informasi yang tertera.",
    },
    {
      question: "Apa yang terjadi jika fasilitas kamar kos tidak sesuai saat tiba di lokasi?",
      answer:
        "Anda memiliki waktu 24 jam setelah jadwal check-in untuk melaporkan kendala melalui aplikasi. Tim bantuan KosPasti akan memediasi, dan Anda berhak mendapatkan garansi pengembalian dana (100% refund) jika terdapat ketidaksesuaian signifikan.",
    },
    {
      question: "Bagaimana cara pemilik kos mendaftar sebagai mitra KosPasti?",
      answer:
        "Cukup klik tombol 'Daftar Sebagai Mitra' di bagian atas atau bawah halaman ini. Isi data properti dan tipe kamar. Tim verifikasi kami akan memvalidasi data Anda dalam waktu maksimal 1x24 jam sebelum listing kos aktif.",
    },
    {
      question: "Metode pembayaran apa saja yang didukung oleh KosPasti?",
      answer:
        "Kami mendukung pembayaran instan via QRIS (BCA, GoPay, OVO, Dana, ShopeePay) dan Virtual Account (BCA, Mandiri, BRI, BNI, Permata), serta transfer antar bank tanpa ribet konfirmasi manual.",
    },
    {
      question: "Apakah ada biaya administrasi tersembunyi bagi pencari kos?",
      answer:
        "Tidak ada. Semua rincian harga sewa, deposit (jika ada), dan biaya layanan dijabarkan secara transparan sebelum Anda melakukan checkout. Tidak ada pungutan liar atau biaya siluman.",
    },
    {
      question: "Bagaimana cara kerja notifikasi WhatsApp otomatis?",
      answer:
        "Nomor WhatsApp yang Anda daftarkan akan secara otomatis menerima konfirmasi booking, invoice resmi, tiket check-in, dan pengingat jatuh tempo sewa berikutnya secara terjadwal.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-28 bg-white border-t border-slate-200/80 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header (without '? Tanya Jawab' pill badge) */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="w-8 h-0.5 bg-slate-900 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="mt-3.5 text-slate-600 text-sm sm:text-base leading-relaxed">
            Semua jawaban atas keraguan dan pertanyaan penting seputar penggunaan platform KosPasti.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-slate-50 border-emerald-300/80 shadow-soft ring-1 ring-emerald-500/10"
                    : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
