"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export interface CustomerSupportWidgetProps {
  propertyName?: string;
  propertyId?: string;
  bookingId?: string;
  customMessage?: string;
  className?: string;
  hideTooltipInitially?: boolean;
}

export function buildSupportWhatsAppUrl(params: {
  phone?: string;
  propertyName?: string;
  propertyId?: string;
  bookingId?: string;
  customMessage?: string;
}): string {
  const rawPhone = params.phone || process.env.NEXT_PUBLIC_CS_WHATSAPP_NUMBER || "6281234567890";
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
      text = `Halo CS KosPasti, saya butuh bantuan terkait pesanan kamar #${params.bookingId}${propText}. Mohon konfirmasinya.`;
    } else if (params.propertyName) {
      const idText = params.propertyId ? ` (ID: ${params.propertyId})` : "";
      text = `Halo CS KosPasti, saya ingin bertanya mengenai properti ${params.propertyName}${idText}. Apakah kamar masih tersedia?`;
    } else {
      text = "Halo CS KosPasti, saya butuh bantuan terkait layanan pemesanan kos di aplikasi KosPasti.";
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
  hideTooltipInitially = false,
}: CustomerSupportWidgetProps) {
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(hideTooltipInitially);

  const waUrl = buildSupportWhatsAppUrl({
    propertyName,
    propertyId,
    bookingId,
    customMessage,
  });

  return (
    <div
      className={`fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-none ${className}`}
      data-testid="customer-support-widget"
    >
      {/* Tooltip / Speech Bubble */}
      {!isTooltipDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mb-2 flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full shadow-md text-xs font-semibold text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Butuh Bantuan? Chat CS</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsTooltipDismissed(true);
            }}
            aria-label="Tutup pesan bantuan"
            className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi Customer Support KosPasti via WhatsApp"
        className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all duration-200 group cursor-pointer"
        title="Hubungi CS WhatsApp KosPasti"
      >
        <MessageCircle className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
      </a>
    </div>
  );
}

export default CustomerSupportWidget;
