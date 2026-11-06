"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Shield, RotateCcw } from "lucide-react";

export function LegalNavTabs() {
  const pathname = usePathname();

  const links = [
    {
      href: "/syarat-ketentuan",
      label: "Syarat & Ketentuan",
      icon: FileText,
      description: "Perjanjian sewa & ketentuan platform",
    },
    {
      href: "/kebijakan-privasi",
      label: "Kebijakan Privasi",
      icon: Shield,
      description: "Perlindungan data sesuai UU PDP",
    },
    {
      href: "/kebijakan-refund",
      label: "Kebijakan Refund & Escrow",
      icon: RotateCcw,
      description: "Jaminan uang kembali & dana aman 12 jam",
    },
  ];

  return (
    <nav
      aria-label="Navigasi Dokumen Legal KosPasti"
      className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-soft mb-8 sm:mb-12"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-soft"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold truncate">
                  {item.label}
                </span>
                <span
                  className={`text-[11px] truncate hidden md:inline ${
                    isActive
                      ? "text-emerald-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default LegalNavTabs;

