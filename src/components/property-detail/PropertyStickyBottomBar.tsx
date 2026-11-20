"use client";

import React from "react";
import { MessageCircle, MessageSquare, CalendarClock, Check, Loader2 } from "lucide-react";
import { buildSupportWhatsAppUrl } from "@/components/support/CustomerSupportWidget";
import { RoomTypeItem } from "@/app/kos/[id]/page";

export interface PropertyStickyBottomBarProps {
  property: {
    id: string;
    name: string;
    price_per_month: number;
    available_rooms: number;
  };
  selectedRoomType: RoomTypeItem | null;
  isCheckingAuth: boolean;
  onOpenBookingModal: () => void;
  isOpeningChat?: boolean;
  onOpenDirectChat?: () => void;
  existingVisit?: any;
  onOpenVisitModal?: () => void;
}

export function PropertyStickyBottomBar({
  property,
  selectedRoomType,
  isCheckingAuth,
  onOpenBookingModal,
  isOpeningChat = false,
  onOpenDirectChat,
  existingVisit,
  onOpenVisitModal,
}: PropertyStickyBottomBarProps) {
  // Hitung ketersediaan kamar
  const isFull =
    selectedRoomType
      ? selectedRoomType.available_rooms === 0
      : property.available_rooms === 0;

  const currentPrice = selectedRoomType
    ? selectedRoomType.price_per_month
    : property.price_per_month;

  const currentAvailableRooms = selectedRoomType
    ? selectedRoomType.available_rooms
    : property.available_rooms;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 p-4 z-40 lg:static lg:bg-transparent lg:border-none lg:p-0">
      <div className="w-full flex flex-col gap-3">
        {/* Info Harga & Sisa Kamar (Mobile Only di bar) */}
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Harga Sewa</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              Rp {currentPrice.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ bulan</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                isFull
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
              }`}
            >
              {isFull ? "Penuh" : `Sisa ${currentAvailableRooms} Kamar`}
            </span>
          </div>
        </div>

        {/* Warning Kamar Penuh */}
        {isFull && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-center">
            Mohon maaf, tipe kamar ini telah penuh.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* CS WhatsApp Support Link (Mobile) */}
          <a
            href={buildSupportWhatsAppUrl({
              propertyName: property.name,
              propertyId: property.id,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
            title="Hubungi CS KosPasti via WhatsApp"
            aria-label="Hubungi CS KosPasti via WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </a>

          {/* Tombol Survei (Mobile) */}
          {onOpenVisitModal && (
            <button
              type="button"
              onClick={onOpenVisitModal}
              className={`lg:hidden p-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                existingVisit
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
              title={existingVisit ? "Survei Sudah Dijadwalkan" : "Jadwalkan Survei Lokasi"}
              aria-label={existingVisit ? "Survei Sudah Dijadwalkan" : "Jadwalkan Survei Lokasi"}
            >
              {existingVisit ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {existingVisit ? "Terjadwal" : "Survei"}
              </span>
            </button>
          )}

          {/* Tombol Utama: Amankan Kamar */}
          <button
            type="button"
            disabled={isFull || isCheckingAuth}
            onClick={onOpenBookingModal}
            className={`px-5 sm:px-6 py-2.5 lg:py-3.5 w-full rounded-xl font-bold text-white transition-all duration-200 cursor-pointer shadow-sm ${
              isFull || isCheckingAuth
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            }`}
          >
            {isFull
              ? "Kamar Penuh"
              : isCheckingAuth
              ? "Memeriksa..."
              : "Amankan Kamar"}
          </button>
        </div>

        {/* Tombol Sekunder Desktop: Chat Langsung Pengelola */}
        {onOpenDirectChat && (
          <button
            type="button"
            onClick={onOpenDirectChat}
            disabled={isOpeningChat}
            className="hidden lg:flex w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {isOpeningChat ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Membuka Obrolan...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Chat Pengelola (Privasi Terjaga)</span>
              </>
            )}
          </button>
        )}

        {/* Tombol Sekunder Desktop: Jadwalkan Survei Lokasi */}
        {onOpenVisitModal && (
          <button
            type="button"
            onClick={onOpenVisitModal}
            className={`hidden lg:flex w-full py-2.5 px-4 rounded-xl border text-sm font-bold items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
              existingVisit
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
            }`}
          >
            {existingVisit ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Survei Sudah Dijadwalkan</span>
              </>
            ) : (
              <>
                <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Jadwalkan Survei Lokasi</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
