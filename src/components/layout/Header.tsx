"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Loader2, LogIn, User, Search } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn: initialIsLoggedIn = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data) {
          setIsLoggedIn(Boolean(data.authenticated));
        }
      })
      .catch(() => {
        // Abaikan jika fetch gagal
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

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
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/80 shadow-soft transition-all duration-300">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
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
            <span className="text-[10px] font-medium text-slate-600 tracking-wide">
              Sewa Kos Pasti &amp; Cepat
            </span>
          </div>
        </Link>

        {!isAuthPage && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                pathname === "/search"
                  ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Cari Kos</span>
            </Link>

            <Link
              href="/map"
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                pathname === "/map"
                  ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60"
              }`}
            >
              <span className="text-base">🗺️</span>
              <span className="hidden sm:inline">Peta Kos</span>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profil"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                    pathname === "/profil"
                      ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Profil Saya</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-100 rounded-full transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isLoggingOut ? "Keluar..." : "Keluar Akun"}
                  </span>
                </button>
              </div>
            ) : (
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


