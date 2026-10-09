import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  Sparkles,
  MapPin,
  BellRing,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-24 sm:gap-32">
        {/* Intro Statement */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="w-8 h-0.5 bg-slate-900 dark:bg-emerald-400 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            KosPasti menggabungkan teknologi cerdas &amp; sistem transaksi aman untuk menghadirkan pengalaman sewa kos terbaik di pasar.
          </h2>
          <div className="mt-5">
            <a
              href="#faq"
              className="text-sm sm:text-base font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Pelajari Fitur Keamanan &amp; Escrow</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Feature Story 1: Text Left + Visual Right (Ulasan Terverifikasi & Keamanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Ulasan Asli dari Penghuni, Transparansi Tanpa Rekayasa
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Setiap ulasan dan penilaian fasilitas di KosPasti berasal dari penyewa yang telah diverifikasi pernah tinggal di kos tersebut. Anda dapat mengetahui kondisi nyata kebersihan, sinyal WiFi, kenyamanan lingkungan, dan keramahan pengelola kos sebelum memesan.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ulasan murni dari penyewa terdaftar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Foto kamar dan fasilitas asli tanpa filter berlebihan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Chat langsung dengan pemilik kos di dalam aplikasi</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/search"
                className="text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors group"
              >
                <span>Lihat Standar Kualitas Kos</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Visual Card on Right */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-800 shadow-soft-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                    Terverifikasi
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                    Skor Kepuasan Penghuni
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>4.9</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">dari 120+ ulasan</span>
                </div>
              </div>

              {/* Progress bars of verified factors */}
              <div className="mt-5 flex flex-col gap-3.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Kebersihan Kamar &amp; Toilet</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">5.0 / 5.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Kecepatan WiFi &amp; Fasilitas</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">4.8 / 5.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[96%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Keamanan &amp; Akses 24 Jam</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">4.9 / 5.0</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Review snippet quote */}
              <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;Fasilitas persis seperti di foto aplikasi. Kamar mandinya bersih dan pemiliknya sangat ramah. Booking lewat KosPasti aman banget!&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Feature Story 2: Visual Left + Text Right (AI Search & WhatsApp Otomatis) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Visual Grid on Left */}
          <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center w-full">
            <div className="w-full max-w-md grid grid-cols-2 gap-4">
              {/* Feature Bubble 1 */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-soft hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800 transition-transform group-hover:scale-110">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Pencarian Cerdas AI</div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cari dengan bahasa sehari-hari: &ldquo;Kos putri dekat UI budget 1.5jt&rdquo;.
                </p>
              </div>

              {/* Feature Bubble 2 */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-soft hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 transition-transform group-hover:scale-110">
                  <BellRing className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Notifikasi WhatsApp</div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Invoice resmi dan konfirmasi booking instan terkirim otomatis ke nomor HP.
                </p>
              </div>

              {/* Feature Bubble 3 */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-soft hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-800 transition-transform group-hover:scale-110">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Peta Interaktif</div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Visualisasi sebaran kos dan jarak ke kampus di peta real-time.
                </p>
              </div>

              {/* Feature Bubble 4 */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-soft hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 transition-transform group-hover:scale-110">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Escrow Midtrans</div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Jaminan 100% uang kembali jika kamar tidak sesuai saat check-in.
                </p>
              </div>
            </div>
          </div>

          {/* Text on Right */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Pencarian Berbasis AI &amp; Otomasi Notifikasi WhatsApp
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              KosPasti dirancang untuk menghemat waktu Anda. Anda dapat mengetik instruksi pencarian kos apa pun dan melihat sebaran kamar di peta interaktif. Setelah memesan, bot WhatsApp kami akan langsung mengirimkan detail check-in dan tanda terima tanpa perlu repot cek email.
            </p>

            <div className="mt-8">
              <Link
                href="/map"
                className="text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors group"
              >
                <span>Eksplorasi Peta Kos Interaktif</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
