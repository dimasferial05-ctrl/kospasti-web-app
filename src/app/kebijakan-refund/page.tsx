import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavTabs } from "@/components/legal/LegalNavTabs";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Refund & Pembatalan | KosPasti",
  description:
    "Kebijakan pengembalian dana resmi (Refund Policy), garansi proteksi dana sewa escrow 12 jam, dan prosedur penyelesaian dispute di KosPasti.",
};

export default function KebijakanRefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-4 border border-emerald-200/60 dark:border-emerald-800/60">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Transparansi Pengembalian Dana • Berlaku Efektif per 1 Maret 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kebijakan Refund &amp; Pembatalan Sewa
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Di KosPasti, uang Anda aman bersama kami. Melalui sistem Rekening Bersama (Escrow 12 Jam), kami melindungi hak penyewa dan pemilik properti secara adil, transparan, dan terpercaya.
          </p>
        </div>

        {/* Tab Navigation */}
        <LegalNavTabs />

        {/* Highlight Card: Escrow Guarantee */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 sm:p-6 mb-10 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Garansi 100% Uang Kembali (Anti-Zonk Escrow 12 Jam)
              </h3>
              <p>
                Pembayaran uang sewa atau Down Payment (DP) yang Anda bayarkan tidak langsung diserahkan kepada Pemilik Kos. Dana tersebut diamankan di rekening penampung resmi KosPasti hingga 12 jam setelah waktu check-in tiba, memberikan Anda waktu cukup untuk memeriksa keaslian kamar dan fasilitas di lokasi.
              </p>
            </div>
          </div>
        </div>

        {/* Content Clauses */}
        <div className="space-y-10 sm:space-y-12 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Pasal 1: Kriteria Full Refund 100% */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-black">
                1
              </span>
              Kondisi Pengembalian Dana Penuh 100% (Full Refund)
            </h2>
            <p className="mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Penyewa berhak menerima pengembalian dana 100% tanpa potongan biaya sewa apabila terjadi kondisi berikut:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Kamar Tidak Sesuai Fisik (Dispute Valid)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Kamar kos tidak sesuai secara material dengan informasi foto pada listing (misalnya: kamar ternyata sudah terisi orang lain, kos fiktif, atau fasilitas pokok seperti air bersih dan listrik padam total).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Pembatalan Sepihak oleh Pemilik Kos</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pemilik Kos membatalkan reservasi secara sepihak setelah pembayaran diverifikasi oleh sistem tanpa persetujuan Penyewa.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Batas Waktu Konfirmasi Terlewati (Expired)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pemilik Kos tidak memberikan tanggapan atau konfirmasi penerimaan dalam waktu maksimal 24 jam sejak pemesanan dibuat oleh penyewa.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Force Majeure Terbukti</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Terjadi bencana alam, kebakaran, atau kondisi kahar yang menyebabkan properti kos tidak aman atau tidak dapat dihuni sama sekali pada tanggal check-in.
                </p>
              </div>
            </div>
          </section>

          {/* Pasal 2: Aturan Pembatalan oleh Penyewa */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                2
              </span>
              Ketentuan Pembatalan Sukarela oleh Penyewa
            </h2>
            <p className="mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Apabila Penyewa memutuskan untuk membatalkan pesanan karena alasan pribadi, kebijakan persentase pengembalian dana diatur berdasarkan jangka waktu sebelum jadwal check-in:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs shrink-0 mt-0.5">
                  100%
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Lebih dari 7 Hari Sebelum Tanggal Check-in
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Penyewa berhak atas pengembalian dana 100% dari total nilai uang muka/sewa yang telah dibayarkan (dikurangi biaya administrasi kanal pembayaran pihak ketiga jika ada).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-black text-xs shrink-0 mt-0.5">
                  50%
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Antara 3 sampai 7 Hari Sebelum Tanggal Check-in
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Penyewa berhak atas pengembalian dana sebesar 50% dari uang muka/sewa yang telah dibayarkan. Sisa 50% akan diteruskan kepada Pemilik Kos sebagai kompensasi penahanan ketersediaan kamar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-black text-xs shrink-0 mt-0.5">
                  0%
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Kurang dari 3 Hari (72 Jam) Sebelum Tanggal Check-in
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Pembayaran tidak dapat dikembalikan (non-refundable). Seluruh dana akan diserahkan kepada Pemilik Kos karena penutupan peluang kamar bagi calon penyewa lain pada periode sibuk tersebut.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pasal 3: Prosedur Pengajuan Sengketa (Dispute) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                3
              </span>
              Prosedur Pengajuan Dispute Kamar Tidak Sesuai
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <p>
                Untuk memanfaatkan perlindungan Garansi Escrow 12 Jam, Penyewa wajib mengikuti tahapan berikut:
              </p>
              <ol className="space-y-2.5 list-decimal pl-5">
                <li>
                  <strong>Tiba di Lokasi &amp; Pengecekan:</strong> Kunjungi properti kos dan lakukan inspeksi kondisi kamar, kebersihan, kunci, dan fasilitas pendukung.
                </li>
                <li>
                  <strong>Ajukan Laporan Sebelum 12 Jam Berakhir:</strong> Jika ditemukan ketidaksesuaian material, buka halaman <em>Riwayat Booking</em> di aplikasi KosPasti lalu klik tombol <em>Laporkan Masalah / Dispute</em> atau hubungi Customer Support resmi kami.
                </li>
                <li>
                  <strong>Lampirkan Bukti Valid:</strong> Unggah foto atau rekaman video beresolusi jelas yang memperlihatkan kondisi fisik kamar yang tidak sesuai dengan listing.
                </li>
                <li>
                  <strong>Investigasi Tim KosPasti:</strong> Tim resolusi sengketa KosPasti akan menahan sementara pencairan dana ke Pemilik Kos dan memvalidasi laporan dalam kurun waktu 1x24 jam.
                </li>
              </ol>
            </div>
          </section>

          {/* Pasal 4: Metode & SLA Pengembalian Dana */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                4
              </span>
              Metode dan SLA Pengembalian Dana (Refund SLA)
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Waktu Proses (SLA)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Pengembalian dana diproses dalam <strong>1 hingga 3 hari kerja bank</strong> terhitung sejak permohonan refund disetujui secara resmi oleh tim kepatuhan KosPasti.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Metode Penyaluran Refund</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Dana akan dikembalikan secara otomatis ke sumber pembayaran awal (misal saldo e-wallet / limit kartu kredit) atau ditransfer ke rekening bank atas nama Penyewa terdaftar.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Assistance Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-bold">Kamar Kos Anda Bermasalah?</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Jangan khawatir. Laporkan segera ke Customer Support KosPasti sebelum periode garansi escrow 12 jam Anda habis.
              </p>
            </div>
            <Link
              href="/bantuan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-soft transition-colors shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Buka Tiket Pengaduan</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

