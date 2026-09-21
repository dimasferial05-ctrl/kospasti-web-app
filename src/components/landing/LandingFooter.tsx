import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Mail, MapPin, Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-16 pb-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-200">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <span className="text-base leading-none">🏠</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                  KosPasti
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 tracking-wide mt-0.5">
                  Kepastian Kos Real-Time
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              Platform sewa kos terpercaya di Indonesia yang menghubungkan pencari kos dengan pemilik properti secara transparan, aman, dan tanpa biaya terselubung.
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Indonesia</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>support@kospasti.id</span>
              </div>
            </div>
          </div>

          {/* Navigation Links: Pencari Kos */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Pencari Kos
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
              <li>
                <Link href="/search" className="hover:text-emerald-600 transition-colors">
                  Cari Kos Terbaru
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-emerald-600 transition-colors">
                  Peta Kos Interaktif
                </Link>
              </li>
              <li>
                <Link href="/profil" className="hover:text-emerald-600 transition-colors">
                  Riwayat Booking
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-600 transition-colors">
                  Masuk / Daftar Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Links: Pemilik Kos */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Pemilik Kos
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
              <li>
                <a href="#mitra" className="hover:text-emerald-600 transition-colors">
                  Portal Mitra Kos
                </a>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-600 transition-colors">
                  Daftarkan Properti Kos
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Konsultasi Kemitraan</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Links: Bantuan & Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Bantuan &amp; Legal
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
              <li>
                <a href="#faq" className="hover:text-emerald-600 transition-colors">
                  Pusat Bantuan &amp; FAQ
                </a>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Syarat &amp; Ketentuan</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Kebijakan Privasi</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Continuous Mirrored Panoramic City Skyline */}
        <div className="pt-8 pb-3 w-full overflow-hidden flex items-end justify-center select-none opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-end justify-center -space-x-px w-full max-w-5xl">
            {/* Mirrored Left */}
            <div className="w-1/3 h-20 sm:h-28 md:h-32 relative flex justify-end overflow-hidden">
              <Image
                src="/images/footer-skyline.jpg"
                alt="City Skyline Left"
                fill
                className="object-cover object-bottom scale-x-[-1]"
                sizes="(max-width: 768px) 33vw, 300px"
              />
            </div>
            {/* Center Normal */}
            <div className="w-1/3 h-20 sm:h-28 md:h-32 relative flex justify-center overflow-hidden">
              <Image
                src="/images/footer-skyline.jpg"
                alt="City Skyline Center"
                fill
                className="object-cover object-bottom"
                sizes="(max-width: 768px) 33vw, 300px"
              />
            </div>
            {/* Mirrored Right */}
            <div className="w-1/3 h-20 sm:h-28 md:h-32 relative flex justify-start overflow-hidden">
              <Image
                src="/images/footer-skyline.jpg"
                alt="City Skyline Right"
                fill
                className="object-cover object-bottom scale-x-[-1]"
                sizes="(max-width: 768px) 33vw, 300px"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} KosPasti Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>untuk kepastian sewa kos Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
