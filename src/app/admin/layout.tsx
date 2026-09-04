"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Building, FileText, LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  // Cek session storage saat komponen dimuat
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("adminAuth");
      if (auth === "true") setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "778899") { // PIN Hardcoded sederhana untuk MVP
      if (typeof window !== "undefined") {
        sessionStorage.setItem("adminAuth", "true");
      }
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("PIN salah. Akses ditolak.");
    }
  };

  // TAMPILAN LOGIN (Jika belum autentikasi)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Login Admin KosPasti</h2>
          <input 
            type="password" 
            placeholder="Masukkan PIN Admin" 
            className="w-full border border-slate-300 p-3 rounded-lg mb-4 text-center text-lg tracking-widest text-slate-900"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors cursor-pointer">
            Masuk Ruang Tahta
          </button>
        </form>
      </div>
    );
  }

  // TAMPILAN LAYOUT ADMIN (Jika sudah autentikasi)
  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* SIDEBAR (Kiri - Gelap) */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-extrabold text-white">KosPasti <span className="text-xs bg-slate-800 px-2 py-1 rounded ml-2">ADMIN</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 mb-4 tracking-wider">MAIN NAVIGATION</div>
          <Link className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="/admin">
            <LayoutDashboard size={20}/> Dashboard
          </Link>
          <Link className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="/admin/properties">
            <Building size={20}/> Kelola Properti
          </Link>
          <Link className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="/admin/bookings">
            <FileText size={20}/> Data Transaksi
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("adminAuth");
                window.location.reload();
              }
            }}
            className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-500 hover:text-white transition-colors text-left cursor-pointer"
          >
            <LogOut size={20}/> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT (Kanan - Terang) */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
