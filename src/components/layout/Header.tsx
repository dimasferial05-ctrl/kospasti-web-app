"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Loader2,
  LogIn,
  User,
  Search,
  ChevronDown,
  History,
  Heart,
  Layers,
  Home,
  Users,
  Zap,
  Sparkles,
  Building2,
  HelpCircle,
  PhoneCall,
} from "lucide-react";

interface AuthUserData {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn: initialIsLoggedIn = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const landingMenuRef = useRef<HTMLDivElement>(null);

  // Fetch authentication status & user profile info
  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data) {
          const authenticated = Boolean(data.authenticated);
          setIsLoggedIn(authenticated);
          if (authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        // Abaikan jika fetch gagal
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Tutup dropdown saat klik di luar area dropdown atau tekan Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        landingMenuRef.current &&
        !landingMenuRef.current.contains(event.target as Node)
      ) {
        setIsLandingMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsLandingMenuOpen(false);
      }
    };

    if (isDropdownOpen || isLandingMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, isLandingMenuOpen]);

  // Sembunyikan header pada seluruh rute /admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/logout", {
        method: "POST",
      });
      setIsLoggedIn(false);
      setUser(null);
      setIsDropdownOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingPage = pathname === "/";

  // Dapatkan inisial nama untuk fallback avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Navigasi Seksi Landing Page
  const landingSections = [
    {
      label: "Halaman Awal",
      sublabel: "Pencarian kos & banner utama",
      href: "#beranda",
      icon: Home,
    },
    {
      label: "Pilihan Pengguna",
      sublabel: "Pencari kos vs pemilik properti",
      href: "#pilihan-pengguna",
      icon: Users,
    },
    {
      label: "Cara Kerja",
      sublabel: "3 langkah mudah sewa kos",
      href: "#cara-kerja",
      icon: Zap,
    },
    {
      label: "Fitur Unggulan",
      sublabel: "Proteksi real-time & escrow",
      href: "#fitur",
      icon: Sparkles,
    },
    {
      label: "Mitra Pemilik Kos",
      sublabel: "Portal & manajemen kos",
      href: "#mitra",
      icon: Building2,
    },
    {
      label: "FAQ & Tanya Jawab",
      sublabel: "Pertanyaan yang sering diajukan",
      href: "#faq",
      icon: HelpCircle,
    },
    {
      label: "Kontak & Informasi",
      sublabel: "Bantuan & detail legal",
      href: "#kontak",
      icon: PhoneCall,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-soft transition-all duration-300">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-soft transition-transform group-hover:rotate-3">
            <span className="text-base leading-none">🏠</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
              KosPasti
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wide">
              Sewa Kos Pasti &amp; Cepat
            </span>
          </div>
        </Link>

        {/* Navigation Content */}
        {!isAuthPage && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. Landing Page Section Navigation Dropdown (Desktop) */}
            {isLandingPage && (
              <div className="relative hidden lg:block" ref={landingMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLandingMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                    isLandingMenuOpen
                      ? "text-emerald-800 bg-emerald-50 border-emerald-300 shadow-xs"
                      : "text-slate-700 hover:text-emerald-700 bg-slate-100/80 hover:bg-slate-200/70 border-slate-200/80"
                  }`}
                  aria-expanded={isLandingMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu Bagian Halaman"
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Jelajahi Halaman</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isLandingMenuOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu List of Landing Sections */}
                {isLandingMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-150 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Daftar Isi Halaman
                      </p>
                    </div>

                    <div className="py-1 px-1.5 space-y-0.5 max-h-[70vh] overflow-y-auto">
                      {landingSections.map((sec) => {
                        const Icon = sec.icon;
                        return (
                          <a
                            key={sec.href}
                            href={sec.href}
                            onClick={() => setIsLandingMenuOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 shrink-0 transition-colors mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                                {sec.label}
                              </span>
                              <span className="text-[11px] text-slate-500 group-hover:text-slate-600 leading-tight">
                                {sec.sublabel}
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Global App Search & Map Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/search"
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  pathname === "/search" || pathname?.startsWith("/kos/")
                    ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
                }`}
              >
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Cari Kos</span>
              </Link>

              <Link
                href="/map"
                className={`hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  pathname === "/map"
                    ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
                }`}
              >
                <span className="text-base">🗺️</span>
                <span>Peta Kos</span>
              </Link>
            </div>

            {/* 3. Auth Actions: Logged In State */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* Desktop Avatar Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="hidden md:flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100/90 border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer group select-none active:scale-95"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Menu Pengguna"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user?.name || "Foto Profil"}
                        fill
                        className="object-cover rounded-full"
                        unoptimized={user.avatar.startsWith("blob:")}
                      />
                    ) : (
                      <span>{getInitials(user?.name)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate group-hover:text-emerald-700 transition-colors">
                    {user?.name?.split(" ")[0] || "Akun Saya"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Mobile View when Logged In: Rounded Avatar Profile Link */}
                <div className="md:hidden flex items-center">
                  <Link
                    href="/profil"
                    className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500 text-white font-bold text-xs shadow-xs shrink-0"
                    aria-label="Profil Saya"
                  >
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user?.name || "Foto Profil"}
                        fill
                        className="object-cover rounded-full"
                        unoptimized={user.avatar.startsWith("blob:")}
                      />
                    ) : (
                      <span>{getInitials(user?.name)}</span>
                    )}
                  </Link>
                </div>

                {/* Desktop Dropdown Menu Panel */}
                {isDropdownOpen && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-150 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
                      <p className="text-xs font-medium text-slate-500">Masuk sebagai</p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user?.name || "Pengguna KosPasti"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    {/* Navigation Menu List */}
                    <div className="py-1.5 px-1.5 space-y-0.5">
                      <Link
                        href="/profil"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          pathname === "/profil"
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>Profil Saya</span>
                      </Link>

                      <Link
                        href="/profil?tab=bookings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <History className="w-4 h-4 text-emerald-600" />
                        <span>Riwayat Pesanan</span>
                      </Link>

                      <Link
                        href="/favorit"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          pathname === "/favorit"
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Kos Favorit</span>
                        </div>
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-full font-semibold">
                          Baru
                        </span>
                      </Link>
                    </div>

                    {/* Dropdown Footer: Logout Button */}
                    <div className="pt-1.5 border-t border-slate-100 px-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50/80 transition-colors disabled:opacity-50 cursor-pointer text-left"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{isLoggingOut ? "Mengeluarkan akun..." : "Keluar Akun"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Actions: Guest / Not Logged In State */
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-full shadow-soft transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
