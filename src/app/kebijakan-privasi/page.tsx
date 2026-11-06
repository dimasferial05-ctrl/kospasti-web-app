import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavTabs } from "@/components/legal/LegalNavTabs";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Mail,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | KosPasti",
  description:
    "Kebijakan privasi resmi platform KosPasti. Perlindungan data pribadi pengguna dan kepatuhan penuh terhadap Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).",
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-4 border border-emerald-200/60 dark:border-emerald-800/60">
            <Shield className="w-3.5 h-3.5" />
            <span>Kepatuhan UU PDP No. 27/2022 • Berlaku Efektif per 1 Maret 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kebijakan Privasi &amp; Perlindungan Data
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            KosPasti berkomitmen penuh untuk melindungi privasi serta keamanan data pribadi seluruh pengguna, baik pencari kos maupun pemilik properti kos, dengan standar keamanan tertinggi.
          </p>
        </div>

        {/* Tab Navigation */}
        <LegalNavTabs />

        {/* Highlight Card: Data Protection Standard */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 sm:p-6 mb-10 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Jaminan Kepatuhan Perlindungan Data Pribadi
              </h3>
              <p>
                Seluruh aktivitas pemrosesan, penyimpanan, dan pengelolaan informasi pribadi di KosPasti dijalankan dengan berpedoman pada Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Kami tidak pernah memperjualbelikan data Anda kepada pihak ketiga mana pun untuk tujuan periklanan tanpa izin eksplisit.
              </p>
            </div>
          </div>
        </div>

        {/* Content Clauses */}
        <div className="space-y-10 sm:space-y-12 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Pasal 1 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                1
              </span>
              Data Pribadi yang Kami Kumpulkan
            </h2>
            <p className="mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              KosPasti mengumpulkan informasi yang Anda berikan secara langsung saat berinteraksi dengan layanan kami:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Data Identitas &amp; Kontak
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Nama lengkap, alamat email aktif, nomor WhatsApp/telepon genggam, foto profil, dan dokumen identitas resmi (KTP atau Kartu Tanda Mahasiswa) untuk keperluan verifikasi akun penyewa atau legalitas kepemilikan kos.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Data Transaksi &amp; Pemesanan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Riwayat booking, rincian kamar kos yang dipilih, tanggal mulai sewa, durasi sewa, bukti bayar, dan status pencairan dana escrow. Rincian nomor kartu kredit/debit Anda diproses langsung oleh mitra payment gateway berlisensi PCI-DSS Level 1 dan tidak pernah disimpan di server kami.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Data Log Akses &amp; Perangkat
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Alamat IP, tipe peramban web (browser), sistem operasi perangkat, cookie sesi, serta koordinat lokasi perkiraan (apabila Anda memberikan izin akses lokasi untuk menemukan kos terdekat dari kampus/tempat kerja).
                </p>
              </div>
            </div>
          </section>

          {/* Pasal 2 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                2
              </span>
              Tujuan Pemrosesan Data Pribadi
            </h2>
            <ul className="space-y-2.5 list-disc pl-5 text-xs sm:text-sm">
              <li>
                <strong className="text-slate-900 dark:text-white">Menyediakan Layanan Inti:</strong> Memproses reservasi kamar kos, memvalidasi ketersediaan riil, dan memfasilitasi transaksi pembayaran sewa yang aman.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Perlindungan Escrow 12 Jam:</strong> Mengelola penampungan dana aman dan memverifikasi kesesuaian check-in fisik sebelum meneruskan dana ke pemilik properti.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Pencegahan Penipuan (Fraud Prevention):</strong> Memverifikasi keabsahan identitas akun pengguna dan pemilik kos untuk menciptakan ekosistem sewa kos yang terpercaya.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Komunikasi Layanan Transaksional:</strong> Mengirimkan invoice pemesanan, konfirmasi pembayaran, pengingat jadwal check-in, dan penanganan tiket keluhan pelanggan.
              </li>
            </ul>
          </section>

          {/* Pasal 3 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                3
              </span>
              Pengungkapan Data kepada Pihak Ketiga
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <p>
                KosPasti tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak mana pun. Data Anda hanya dibagikan secara terbatas dalam kondisi berikut:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Kepada Mitra Pemilik Kos</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Hanya data esensial (nama penyewa, kontak terverifikasi, dan tanggal check-in) yang dibagikan untuk kepentingan koordinasi penyerahan kunci kamar.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Penyedia Layanan Pembayaran</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Mitra gerbang pembayaran (Payment Gateway) berizin Bank Indonesia untuk memproses settlement pembayaran sewa secara otomatis dan aman.
                  </p>
                </div>
              </div>
              <p className="pt-2 text-slate-500 dark:text-slate-400">
                Data juga dapat diungkapkan apabila diwajibkan oleh proses hukum resmi atau perintah tertulis dari lembaga penegak hukum yang berwenang di Indonesia.
              </p>
            </div>
          </section>

          {/* Pasal 4 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                4
              </span>
              Keamanan, Penyimpanan, dan Enkripsi Data
            </h2>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <p>
                Kami menerapkan standar pengamanan teknis dan organisasional yang ketat:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-slate-900 dark:text-white">Enkripsi Data:</strong> Setiap pengiriman data melalui platform dilindungi protokol keamanan SSL/TLS (Transport Layer Security) 256-bit.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Kontrol Akses Terbatas:</strong> Hanya staf berwenang yang dapat mengakses data pribadi untuk keperluan investigasi sengketa atau bantuan teknis dengan logging audit terlacak.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Penyimpanan Aman:</strong> Database kami ditempatkan pada infrastruktur cloud bereputasi tinggi dengan cadangan berkala dan sistem pencegahan intrusi terdistribusi.
                </li>
              </ul>
            </div>
          </section>

          {/* Pasal 5 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                5
              </span>
              Hak Subjek Data Anda
            </h2>
            <p className="mb-3 text-xs sm:text-sm">
              Sesuai ketentuan UU Perlindungan Data Pribadi No. 27 Tahun 2022, Anda memiliki hak-hak hukum berikut atas data pribadi Anda:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1">Akses &amp; Koreksi</h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Hak untuk meminta salinan data pribadi Anda serta memperbaiki informasi profil yang tidak akurat kapan saja.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1">Penghapusan Akun</h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Hak untuk meminta penutupan akun dan penghapusan data pribadi (right to be forgotten) jika tidak ada sengketa transaksi aktif.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1">Penarikan Persetujuan</h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Hak untuk mencabut izin pemrosesan data tertentu atau memilih keluar dari komunikasi pemasaran opsional.
                </p>
              </div>
            </div>
          </section>

          {/* Pasal 6 */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black">
                6
              </span>
              Kontak Data Protection Officer (DPO) &amp; Pertanyaan
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <p>
                Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau ingin mengajukan permohonan terkait hak data pribadi Anda, Anda dapat menghubungi tim kepatuhan data kami melalui:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Petugas Perlindungan Data KosPasti</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Email Resmi: privacy@kospasti.id • CS Helpdesk: 24/7 Responsif</div>
                </div>
                <Link
                  href="/bantuan"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim Tiket Privasi</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Footer Assistance Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-bold">Ingin Mengajukan Pertanyaan Hak Data?</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Pusat Bantuan KosPasti menyediakan formulir pengajuan penyesuaian atau penghapusan data secara mudah dan transparan.
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

