"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building,
  Users,
  FileText,
  User,
  LogOut,
  Loader2,
  Star,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink, type Links } from "@/components/ui/sidebar";
import { motion } from "motion/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  // Jika halaman saat ini adalah login, langsung render children (halaman login tanpa sidebar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
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

  const navLinks: (Links & { active: boolean })[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <LayoutDashboard
          size={20}
          className={`shrink-0 transition-colors ${
            pathname === "/admin" ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: pathname === "/admin",
    },
    {
      label: "Kelola Properti",
      href: "/admin/properties",
      icon: (
        <Building
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/admin/properties") ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/admin/properties")),
    },
    {
      label: "Pemilik Kos",
      href: "/admin/owners",
      icon: (
        <Users
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/admin/owners") ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/admin/owners")),
    },
    {
      label: "Data Pengguna",
      href: "/admin/users",
      icon: (
        <User
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/admin/users") ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/admin/users")),
    },
    {
      label: "Data Transaksi",
      href: "/admin/bookings",
      icon: (
        <FileText
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/admin/bookings") ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/admin/bookings")),
    },
    {
      label: "Kelola Ulasan",
      href: "/admin/reviews",
      icon: (
        <Star
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/admin/reviews") ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/admin/reviews")),
    },
  ];

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-slate-100">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6 bg-slate-950 text-slate-300 border-r border-slate-800">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo Admin */}
            <div className="py-2 mb-4 border-b border-slate-800/80">
              {open ? <Logo /> : <LogoIcon />}
            </div>

            {/* Navigation links */}
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={`px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    link.active
                      ? "bg-slate-800/90 text-white font-bold shadow-xs border border-slate-700/50"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-medium"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bottom section: Logout */}
          <div className="pt-3 border-t border-slate-800/80">
            <SidebarLink
              link={{
                label: isLoggingOut ? "Keluar..." : "Logout",
                href: "#",
                icon: isLoggingOut ? (
                  <Loader2 size={20} className="animate-spin text-rose-400 shrink-0" />
                ) : (
                  <LogOut size={20} className="text-rose-400 shrink-0" />
                ),
                onClick: handleLogout,
              }}
              className="px-3 py-2.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/70">
        {children}
      </main>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 px-1">
      <Image
        src="/logo.jpg"
        alt="KosPasti Admin Logo"
        width={32}
        height={32}
        className="size-8 rounded-lg object-cover shrink-0"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
      >
        <span className="font-extrabold text-white text-base tracking-tight">KosPasti</span>
        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
          ADMIN
        </span>
      </motion.div>
    </div>
  );
}

function LogoIcon() {
  return (
    <div className="flex items-center justify-center py-0.5">
      <Image
        src="/logo.jpg"
        alt="KosPasti Admin Logo"
        width={32}
        height={32}
        className="size-8 rounded-lg object-cover shrink-0"
      />
    </div>
  );
}
