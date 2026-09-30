"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  LogOut,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink, type Links } from "@/components/ui/sidebar";
import { motion } from "motion/react";

interface PartnerInfo {
  id: string;
  name: string;
  email: string;
  whatsapp_number: string;
}

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/partner/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.authenticated && data.owner) {
            setPartner(data.owner);
          } else {
            router.push("/partner/login");
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          router.push("/partner/login");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      setIsLoggingOut(true);
      await fetch("/api/partner/logout", {
        method: "POST",
      });
      router.push("/partner/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout mitra:", err);
      window.location.href = "/partner/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks: (Links & { active: boolean })[] = [
    {
      label: "Ringkasan",
      href: "/partner/dashboard",
      icon: (
        <LayoutDashboard
          size={20}
          className={`shrink-0 transition-colors ${
            pathname === "/partner/dashboard" ? "text-emerald-400" : "text-slate-400"
          }`}
        />
      ),
      active: pathname === "/partner/dashboard",
    },
    {
      label: "Kelola Properti",
      href: "/partner/dashboard/properties",
      icon: (
        <Building2
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/partner/dashboard/properties")
              ? "text-emerald-400"
              : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/partner/dashboard/properties")),
    },
    {
      label: "Daftar Pesanan",
      href: "/partner/dashboard/bookings",
      icon: (
        <CalendarCheck
          size={20}
          className={`shrink-0 transition-colors ${
            pathname?.startsWith("/partner/dashboard/bookings")
              ? "text-emerald-400"
              : "text-slate-400"
          }`}
        />
      ),
      active: Boolean(pathname?.startsWith("/partner/dashboard/bookings")),
    },
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-semibold text-slate-300">Memuat Portal Mitra Kos...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-slate-100">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6 bg-slate-950 text-slate-300 border-r border-slate-800">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo Mitra */}
            <div className="py-2 mb-4 border-b border-slate-800/80">
              {open ? <Logo /> : <LogoIcon />}
            </div>

            {/* Info Mitra Pill (when expanded) */}
            {open && partner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Mitra Terverifikasi
                </span>
                <p className="font-bold text-white truncate mt-0.5">{partner.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{partner.email}</p>
              </motion.div>
            )}

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

          {/* Bottom section: Main Page Link & Logout */}
          <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
            <SidebarLink
              link={{
                label: "Lihat Halaman Utama",
                href: "/",
                icon: <ExternalLink size={20} className="text-slate-400 shrink-0" />,
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            />

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
        alt="KosPasti Mitra Logo"
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
        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
          MITRA
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
        alt="KosPasti Mitra Logo"
        width={32}
        height={32}
        className="size-8 rounded-lg object-cover shrink-0"
      />
    </div>
  );
}
