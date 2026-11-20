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
  formattedPrice?: string;
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
  formattedPrice: formattedPriceProp,
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

  const formattedPrice =
    formattedPriceProp || `Rp ${currentPrice.toLocaleString("id-ID")}`;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-between items-center z-[60] lg:z-10 lg:static lg:block lg:p-6 lg:border lg:border-slate-200/60 dark:lg:border-slate-800 lg:rounded-2xl lg:shadow-soft lg:sticky lg:top-32">
      <div className="max-w-7xl mx-auto lg:max-w-none w-full px-2 sm:px-4 lg:px-0 flex justify-between lg:flex-col lg:gap-4 items-center lg:items-start">
        <div className="lg:w-full">
          <p className="text-[10px] lg:text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {selectedRoomType ? `Harga (${selectedRoomType.name})` : "Harga per bulan"}
          </p>
          <p className="text-lg lg:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
            {formattedPrice}{" "}
            <span className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400">
              / bln
            </span>
          </p>
          {isFull && (
            <p className="text-[11px] lg:text-xs text-rose-500 font-semibold mt-1">
              Mohon maaf, tipe kamar ini telah penuh.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 w-auto lg:w-full">
          {/* Tombol Chat Langsung dengan Masking Privasi di Mobile */}
          {onOpenDirectChat && (
            <button
              type="button"
              onClick={onOpenDirectChat}
              disabled={isOpeningChat}
              className="lg:hidden p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
              title="Tanya Pengelola via Chat Langsung"
              aria-label="Tanya Pengelola via Chat Langsung"
            >
              {isOpeningChat ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          )}

          {/* Tombol Bantuan CS WhatsApp di Mobile Bottom Bar */}
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

          {onOpenVisitModal && (
            <button
              type="button"
              onClick={onOpenVisitModal}
              className={`lg:hidden p-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                existingVisit
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
              title={
                existingVisit
                  ? "Survei Sudah Dijadwalkan"
                  : "Jadwalkan Survei Lokasi"
              }
              aria-label={
                existingVisit
                  ? "Survei Sudah Dijadwalkan"
                  : "Jadwalkan Survei Lokasi"
              }
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

        {/* Jaminan KosPasti */}
        <div className="hidden lg:flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 w-full">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Pasti Sesuai Deskripsi &amp; Foto</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Tanpa Biaya Tambahan Tersembunyi</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Konfirmasi Langsung Pemilik</span>
          </div>
        </div>

        {/* Tombol Bantuan CS di Desktop Sticky Card */}
        <div className="hidden lg:block w-full pt-1">
          <a
            href={buildSupportWhatsAppUrl({
              propertyName: property.name,
              propertyId: property.id,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-soft"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bantuan CS KosPasti</span>
          </a>
        </div>
      </div>
    </div>
  );
}
