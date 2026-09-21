"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Loader2, LogIn, User } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn: initialIsLoggedIn = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setIsLoggedIn(initialIsLoggedIn);
  }, [initialIsLoggedIn]);

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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span>🏠</span>
          <span>KosPasti</span>
        </Link>

        {!isAuthPage && (
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/map"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/map"
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                  : "text-slate-750 hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">Peta Kos</span>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profil"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    pathname === "/profil"
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : "text-slate-700 hover:text-emerald-600 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profil Saya</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isLoggingOut ? "Keluar..." : "Keluar"}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
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

