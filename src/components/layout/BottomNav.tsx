"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, MapPin, Heart, User } from "lucide-react";

interface BottomNavProps {
  isLoggedIn?: boolean;
}

export function BottomNav({ isLoggedIn: initialIsLoggedIn = false }: BottomNavProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

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
        // Abaikan error fetch background
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Sembunyikan BottomNav pada halaman admin, auth, atau jika user belum login
  if (!isLoggedIn) return null;
  if (
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Eksplor",
      href: "/search",
      icon: Search,
      isActive:
        pathname === "/search" ||
        pathname?.startsWith("/kos/") ||
        pathname === "/",
    },
    {
      label: "Peta",
      href: "/map",
      icon: MapPin,
      isActive: pathname === "/map",
    },
    {
      label: "Favorit",
      href: "/favorit",
      icon: Heart,
      isActive: pathname === "/favorit",
    },
    {
      label: "Profil",
      href: "/profil",
      icon: User,
      isActive: pathname === "/profil",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 transition-all duration-300"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-95 group relative ${
                active
                  ? "text-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              {/* Active Indicator Top Pill */}
              {active && (
                <span className="absolute -top-2 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_1px_6px_rgba(16,185,129,0.4)]" />
              )}

              <div
                className={`p-1 rounded-xl transition-colors duration-200 ${
                  active
                    ? "bg-emerald-50 text-emerald-600"
                    : "group-hover:bg-slate-50 text-slate-500"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
              </div>

              <span className="text-[11px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
