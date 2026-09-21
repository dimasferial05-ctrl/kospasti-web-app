"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  Users,
  FileText,
  User,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Jika halaman saat ini adalah login, langsung render children (halaman login tanpa sidebar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout admin:", err);
      window.location.href = "/admin/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Mobile Header (Hanya muncul di HP/layar kecil) */}
      <div className="md:hidden flex items-center justify-between bg-slate-950 text-white p-4 fixed w-full top-0 z-40">
        <h1 className="text-lg font-bold flex items-center gap-2">
          KosPasti <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">ADMIN</span>
        </h1>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR (Kiri - Gelap) */}
      <aside
        className={`w-64 bg-slate-950 text-slate-300 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-white">
            KosPasti <span className="text-xs bg-slate-800 px-2 py-1 rounded ml-2">ADMIN</span>
          </h1>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="md:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup navigasi sidebar"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 mb-3 tracking-widest uppercase px-3">
            MAIN NAVIGATION
          </div>
          <Link
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              pathname === "/admin"
                ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
            }`}
            href="/admin"
          >
            <LayoutDashboard size={18} className={pathname === "/admin" ? "text-emerald-400" : ""} /> Dashboard
          </Link>
          <Link
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              pathname?.startsWith("/admin/properties")
                ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
            }`}
            href="/admin/properties"
          >
            <Building size={18} className={pathname?.startsWith("/admin/properties") ? "text-emerald-400" : ""} /> Kelola Properti
          </Link>
          <Link
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              pathname?.startsWith("/admin/owners")
                ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
            }`}
            href="/admin/owners"
          >
            <Users size={18} className={pathname?.startsWith("/admin/owners") ? "text-emerald-400" : ""} /> Pemilik Kos
          </Link>
          <Link
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              pathname?.startsWith("/admin/users")
                ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
            }`}
            href="/admin/users"
          >
            <User size={18} className={pathname?.startsWith("/admin/users") ? "text-emerald-400" : ""} /> Data Pengguna
          </Link>
          <Link
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              pathname?.startsWith("/admin/bookings")
                ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
            }`}
            href="/admin/bookings"
          >
            <FileText size={18} className={pathname?.startsWith("/admin/bookings") ? "text-emerald-400" : ""} /> Data Transaksi
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-left cursor-pointer disabled:opacity-50 text-sm font-semibold"
          >
            {isLoggingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            <span>{isLoggingOut ? "Keluar..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT (Kanan - Terang) */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-14 md:mt-0 min-h-screen bg-slate-50/70">
        {children}
      </main>
    </div>
  );
}

