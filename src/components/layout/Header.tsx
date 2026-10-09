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
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const landingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sembunyikan otomatis navbar saat scroll ke bawah
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsNavbarVisible(false);
        setIsDropdownOpen(false);
        setIsLandingMenuOpen(false);
      } else {
        setIsNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Fetch authentication status & user profile info
  useEffect(() => {
    let isMounted = true;
    setIsMobileDrawerOpen(false);
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
        setIsMobileDrawerOpen(false);
      }
    };

    if (isDropdownOpen || isLandingMenuOpen || isMobileDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, isLandingMenuOpen, isMobileDrawerOpen]);

  // Sembunyikan header pada seluruh rute /admin dan /partner
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/partner")) {
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
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-soft transition-all duration-300 ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
          >
            <span className="sr-only">🏠</span>
            <Image
              src="/logo.jpg"
              alt="KosPasti Logo"
              width={36}
              height={36}
              priority
              className="w-9 h-9 rounded-xl object-cover shadow-soft transition-transform group-hover:rotate-3 shrink-0 block dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="KosPasti Logo"
              width={36}
              height={36}
              priority
              className="w-9 h-9 rounded-xl object-cover shadow-soft transition-transform group-hover:rotate-3 shrink-0 hidden dark:block"
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                KosPasti
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                Sewa Kos Pasti &amp; Cepat
              </span>
            </div>
          </Link>

          {/* Navigation Content */}
          {!isAuthPage && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 1. Landing Page Section Navigation Dropdown (Desktop) */}
              {isLandingPage && (
                <div
                  className="relative hidden lg:block"
                  ref={landingMenuRef}
                  onMouseEnter={() => setIsLandingMenuOpen(true)}
                  onMouseLeave={() => setIsLandingMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsLandingMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                      isLandingMenuOpen
                        ? "text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-700/70 border-slate-200/80 dark:border-slate-700"
                    }`}
                    aria-expanded={isLandingMenuOpen}
                    aria-haspopup="true"
                    aria-label="Menu Bagian Halaman"
                  >
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Jelajahi Halaman</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                        isLandingMenuOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu List of Landing Sections */}
                  {isLandingMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-float border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 before:absolute before:-top-2 before:left-0 before:w-full before:h-2 before:bg-transparent">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                              className="flex items-start gap-3 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-emerald-50/70 dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 shrink-0 transition-colors mt-0.5">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                  {sec.label}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-600 leading-tight">
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
                  className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    pathname === "/search" || pathname?.startsWith("/kos/")
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Cari Kos</span>
                </Link>

                <Link
                  href="/map"
                  className={`hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    pathname === "/map"
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <span className="text-base">🗺️</span>
                  <span>Peta Kos</span>
                </Link>

                <Link
                  href="/bantuan"
                  className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    pathname === "/bantuan"
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pusat Bantuan</span>
                </Link>
              </div>

              {/* 3. Auth Actions: Logged In State */}
              {isLoggedIn ? (
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {/* Desktop Avatar Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="hidden md:flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100/90 dark:hover:bg-slate-800/90 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group select-none active:scale-95"
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
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {user?.name?.split(" ")[0] || "Akun Saya"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
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
                    <div className="hidden md:block absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-float border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 before:absolute before:-top-2 before:left-0 before:w-full before:h-2 before:bg-transparent">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 rounded-t-xl">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Masuk sebagai</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user?.name || "Pengguna KosPasti"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      </div>

                      {/* Navigation Menu List */}
                      <div className="py-1.5 px-1.5 space-y-0.5">
                        <Link
                          href="/profil"
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                            pathname === "/profil"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Profil Saya</span>
                        </Link>

                        <Link
                          href="/profil?tab=bookings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Riwayat Pesanan</span>
                        </Link>

                        <Link
                          href="/favorit"
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                            pathname === "/favorit"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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

                        <Link
                          href="/bantuan"
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                            pathname === "/bantuan"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Pusat Bantuan</span>
                        </Link>
                      </div>

                      {/* Theme Option in Profile Dropdown (Desktop - Sudah Login) */}
                      <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 px-2">
                        <div className="px-1 py-0.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span>Tema Tampilan</span>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                            {mounted
                              ? theme === "dark"
                                ? "Gelap"
                                : theme === "light"
                                ? "Terang"
                                : "Sistem"
                              : "Sistem"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mt-1">
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              theme === "light"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>Terang</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              theme === "dark"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Gelap</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("system")}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              theme === "system"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5 text-slate-500" />
                            <span>Sistem</span>
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Footer: Logout Button */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 px-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer text-left"
                        >
                          {isLoggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
                          ) : (
                            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span>{isLoggingOut ? "Mengeluarkan akun..." : "Keluar Akun"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Auth Actions: Guest / Not Logged In State */
                <div className="flex items-center gap-2">
                  {/* Desktop Theme Toggle (Belum Login) */}
                  <div className="hidden md:flex items-center">
                    <ThemeToggle align="right" />
                  </div>

                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-full shadow-soft hover:shadow-float transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk / Daftar</span>
                  </Link>

                  {/* Mobile Hamburger Button (Belum Login) */}
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Menu Navigasi Mobile"
                    aria-expanded={isMobileDrawerOpen}
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer (Mobile - Belum Login) */}
      {!isLoggedIn && isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-5 z-10 border-l border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.jpg"
                    alt="KosPasti Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 block dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="KosPasti Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 hidden dark:block"
                  />
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      KosPasti
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sewa Kos Pasti &amp; Cepat
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Navigation Links */}
              <nav className="mt-4 space-y-1">
                <Link
                  href="/search"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === "/search"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Cari Kos</span>
                </Link>
                <Link
                  href="/map"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === "/map"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base">🗺️</span>
                  <span>Peta Kos</span>
                </Link>
                <Link
                  href="/bantuan"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === "/bantuan"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pusat Bantuan</span>
                </Link>
              </nav>

              {/* CTA Masuk / Daftar */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/login"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-soft transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Daftar Akun</span>
                </Link>
              </div>
            </div>

            {/* Drawer Footer: Opsi Tema */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Tampilan Aplikasi
              </p>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gelap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === "system"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sistem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
