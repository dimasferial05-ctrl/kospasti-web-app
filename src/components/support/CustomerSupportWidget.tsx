"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

export interface CustomerSupportWidgetProps {
  propertyName?: string;
  propertyId?: string;
  bookingId?: string;
  customMessage?: string;
  className?: string;
  /**
   * Atur posisi custom jika halaman memiliki sticky bar bawah (misal halaman detail kos di mobile)
   */
  positionClassName?: string;
}

export function buildSupportWhatsAppUrl(params: {
  phone?: string;
  propertyName?: string;
  propertyId?: string;
  bookingId?: string;
  customMessage?: string;
}): string {
  // Nomor resmi CS KosPasti: 0813-1513-2327 (internasional: 6281315132327)
  const rawPhone =
    params.phone ||
    process.env.NEXT_PUBLIC_CS_WHATSAPP_NUMBER ||
    "6281315132327";
  let phone = rawPhone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  } else if (phone.startsWith("8")) {
    phone = "62" + phone;
  }

  let text = params.customMessage;

  if (!text) {
    if (params.bookingId) {
      const propText = params.propertyName ? ` (${params.propertyName})` : "";
      text = `Halo CS KosPasti, saya butuh bantuan terkait pesanan kamar #${params.bookingId}${propText}. Mohon bantuannya.`;
    } else if (params.propertyName) {
      const idText = params.propertyId ? ` (ID: ${params.propertyId})` : "";
      text = `Halo CS KosPasti, saya ingin bertanya mengenai properti ${params.propertyName}${idText}. Apakah kamar masih tersedia?`;
    } else {
      text =
        "Halo CS KosPasti, saya butuh bantuan terkait layanan pemesanan kos di aplikasi KosPasti.";
    }
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function CustomerSupportWidget({
  propertyName,
  propertyId,
  bookingId,
  customMessage,
  className = "",
  positionClassName = "bottom-6 right-4 sm:right-6",
}: CustomerSupportWidgetProps) {
  const waUrl = buildSupportWhatsAppUrl({
    propertyName,
    propertyId,
    bookingId,
    customMessage,
  });

  return (
    <aside
      aria-label="Bantuan Pelanggan KosPasti"
      className={`fixed ${positionClassName} z-40 flex items-center ${className}`}
      data-testid="customer-support-widget"
    >
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi Customer Support KosPasti via WhatsApp"
        className="group inline-flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-full shadow-soft hover:shadow-float active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 cursor-pointer"
        title="Hubungi CS WhatsApp KosPasti (0813-1513-2327)"
      >
        <span className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MessageCircle className="w-4 h-4 fill-emerald-600/20" />
        </span>
        <div className="flex flex-col text-left pr-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider leading-none">
            Butuh Bantuan?
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Chat CS
          </span>
        </div>
      </a>
    </aside>
  );
}

export default CustomerSupportWidget;
