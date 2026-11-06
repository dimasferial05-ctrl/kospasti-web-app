import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavTabs } from "@/components/legal/LegalNavTabs";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  ShieldCheck,
  CheckCircle2,
  Scale,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | KosPasti",
  description:
    "Syarat dan ketentuan resmi penggunaan platform KosPasti, hak dan kewajiban penyewa dan pemilik kos, serta mekanisme escrow sewa aman.",
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-4 border border-emerald-200/60 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dokumen Legal Resmi • Berlaku Efektif per 1 Maret 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Syarat &amp; Ketentuan Penggunaan
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Selamat datang di KosPasti. Harap membaca seluruh ketentuan ini dengan cermat sebelum mengakses, mendaftar, atau melakukan transaksi pemesanan kos di platform kami.
          </p>
        </div>

        {/* Tab Navigation */}
        <LegalNavTabs />

        {/* Highlight Card: Escrow & Legal Notice */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 sm:p-6 mb-10 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Prinsip Kunci: Kepastian &amp; Keamanan Transaksi
              </h3>
              <p>
                Dengan mengakses atau menggunakan platform KosPasti, Anda menyetujui untuk terikat secara hukum oleh Syarat &amp; Ketentuan ini. KosPasti beroperasi sebagai penyelenggara sistem elektronik perantara yang memfasilitasi transaksi sewa kos dengan sistem penahanan dana sewa aman (Escrow) selama 12 jam setelah check-in fisik.
              </p>
            </div>
          </div>
        </div>

        {/* Content Articles */}
        <div className="space-y-10 sm:space-y-12 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Pasal 1 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                1
              </span>
              Definisi Istilah
            </h2>
            <ul className="space-y-3 pl-2 sm:pl-3">
              <li>
                <strong className="text-slate-900 dark:text-white">Platform KosPasti:</strong> Layanan aplikasi berbasis web dan mobile yang dikelola oleh tim pengembang KosPasti untuk menghubungkan Pencari Kos dan Pemilik Kos.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Penyewa / Pencari Kos:</strong> Pengguna terdaftar yang memesan atau menyewa kamar kos melalui Platform.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Pemilik Kos:</strong> Mitra terdaftar yang memiliki kewenangan sah atas properti kos yang diiklankan di Platform.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Booking ID:</strong> Kode unik identifikasi transaksi sewa yang dihasilkan saat pemesanan kamar berhasil dibuat.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Garansi Escrow 12 Jam:</strong> Sistem penampungan pembayaran sewa bulan pertama oleh Platform, di mana dana baru akan diteruskan ke Pemilik Kos setelah 12 jam sejak Penyewa tiba di lokasi dan kamar dinyatakan sesuai.
              </li>
            </ul>
          </section>

          {/* Pasal 2 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                2
              </span>
              Akun Pengguna &amp; Verifikasi Identitas
            </h2>
            <div className="space-y-3.5">
              <p>
                2.1. Untuk menggunakan fitur pemesanan kamar atau mempublikasikan kos, Pengguna wajib membuat akun menggunakan email aktif dan nomor WhatsApp yang valid.
              </p>
              <p>
                2.2. Pengguna menjamin bahwa seluruh data identitas yang diberikan (termasuk nama lengkap, nomor identitas KTP/KTM, dan kontak darurat) adalah akurat, sah, dan dapat dipertanggungjawabkan secara hukum.
              </p>
              <p>
                2.3. Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi dan keamanan akunnya. KosPasti tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Pengguna dalam menjaga kredensial akun.
              </p>
            </div>
          </section>

          {/* Pasal 3 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                3
              </span>
              Pemesanan &amp; Pembayaran Down Payment (DP)
            </h2>
            <div className="space-y-3.5">
              <p>
                3.1. Pemesanan kamar kos dianggap sah apabila Penyewa telah menyelesaikan pembayaran Down Payment (DP) atau sewa periode pertama melalui kanal pembayaran resmi yang disediakan Platform.
              </p>
              <p>
                3.2. Platform menyediakan berbagai metode pembayaran aman (Transfer Virtual Account, QRIS, E-Wallet, dan Kartu Pembayaran). KosPasti tidak pernah meminta transfer dana ke rekening pribadi atas nama staf atau perseorangan di luar rekening penampung resmi mitra payment gateway.
              </p>
              <p>
                3.3. Pelunasan sewa untuk bulan-bulan berikutnya dilakukan sesuai kesepakatan antara Penyewa dan Pemilik Kos, baik melalui platform maupun kesepakatan tertulis langsung antar pihak.
              </p>
            </div>
          </section>

          {/* Pasal 4 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                4
              </span>
              Perlindungan Escrow 12 Jam &amp; Konfirmasi Check-in
            </h2>
            <div className="space-y-3.5">
              <p>
                4.1. Dana pembayaran sewa yang dibayarkan Penyewa akan ditahan sementara di rekening escrow KosPasti demi menjamin keamanan transaksi kedua belah pihak.
              </p>
              <p>
                4.2. Penyewa memiliki waktu <strong>12 (dua belas) jam</strong> sejak jadwal waktu check-in resmi untuk melakukan pengecekan fisik kamar kos dan fasilitas yang dijanjikan.
              </p>
              <p>
                4.3. Apabila kamar sesuai, dana akan otomatis dicairkan ke rekening Pemilik Kos setelah batas waktu 12 jam berlalu tanpa adanya laporan sengketa (dispute) dari Penyewa.
              </p>
              <p>
                4.4. Apabila kamar tidak sesuai secara material (kamar tidak tersedia, fasilitas utama rusak/tidak ada, atau kos fiktif), Penyewa berhak mengajukan dispute dengan melampirkan bukti foto/video sebelum 12 jam berakhir.
              </p>
            </div>
          </section>

          {/* Pasal 5 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                5
              </span>
              Hak &amp; Kewajiban Para Pihak
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Kewajiban Penyewa
                </h3>
                <ul className="text-xs sm:text-sm space-y-2 text-slate-600 dark:text-slate-400 list-disc pl-4">
                  <li>Melakukan check-in sesuai tanggal dan jam yang telah disepakati.</li>
                  <li>Mematuhi tata tertib kos setempat yang ditetapkan oleh Pemilik Kos.</li>
                  <li>Tidak menyalahgunakan kamar kos untuk kegiatan melanggar hukum, narkotika, atau asusila.</li>
                  <li>Menjaga kebersihan dan keutuhan fasilitas bersama di lingkungan kos.</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Kewajiban Pemilik Kos
                </h3>
                <ul className="text-xs sm:text-sm space-y-2 text-slate-600 dark:text-slate-400 list-disc pl-4">
                  <li>Menyediakan kamar kos dalam kondisi bersih, layak huni, dan siap pakai sesuai listing.</li>
                  <li>Memastikan fasilitas yang diiklankan berfungsi dengan baik pada saat serah terima kunci.</li>
                  <li>Tidak membatalkan reservasi secara sepihak setelah pembayaran diverifikasi sistem.</li>
                  <li>Menghormati privasi dan keamanan penyewa selama masa sewa berlangsung.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pasal 6 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                6
              </span>
              Batasan Tanggung Jawab Platform
            </h2>
            <div className="space-y-3.5">
              <p>
                6.1. KosPasti bertindak sebagai penyedia platform perantara digital dan fasilitator pembayaran terpercaya. KosPasti bukan merupakan pemilik tanah, bangunan, maupun pengelola operasional harian fisik properti kos, kecuali dinyatakan secara khusus.
              </p>
              <p>
                6.2. KosPasti tidak bertanggung jawab atas perselisihan interpersonal antara Penyewa dan Pemilik Kos di luar cakupan transaksi pemesanan awal dan masa garansi escrow 12 jam.
              </p>
              <p>
                6.3. KosPasti dibebaskan dari tuntutan hukum atas kerugian tidak langsung, kehilangan barang bawaan pribadi, atau force majeure (bencana alam, huru-hara, atau gangguan jaringan telekomunikasi nasional).
              </p>
            </div>
          </section>

          {/* Pasal 7 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                7
              </span>
              Perubahan Ketentuan &amp; Hukum yang Berlaku
            </h2>
            <div className="space-y-3.5">
              <p>
                7.1. KosPasti berhak memperbarui atau memodifikasi Syarat &amp; Ketentuan ini sewaktu-waktu demi kepatuhan regulasi dan peningkatan layanan. Perubahan akan diinformasikan melalui laman ini beserta tanggal revisi terbaru.
              </p>
              <p>
                7.2. Syarat &amp; Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Negara Kesatuan Republik Indonesia. Setiap sengketa yang timbul akan diupayakan diselesaikan melalui musyawarah untuk mufakat terlebih dahulu sebelum dibawa ke yurisdiksi pengadilan negeri di Indonesia.
              </p>
            </div>
          </section>

          {/* Footer Assistance Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-bold">Punya Pertanyaan Mengenai Ketentuan Ini?</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Tim Customer Support dan Legal KosPasti siap membantu menjelaskan hak serta kewajiban Anda sebelum bertransaksi.
              </p>
            </div>
            <Link
              href="/bantuan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-soft transition-colors shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Pusat Bantuan</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

