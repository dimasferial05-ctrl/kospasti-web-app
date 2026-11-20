"use client";

import React from "react";
import Image from "next/image";
import { User, MessageCircle, BadgeCheck } from "lucide-react";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { buildSupportWhatsAppUrl } from "@/components/support/CustomerSupportWidget";

export interface PropertyOwnerContactCardProps {
  property: {
    id: string;
    name: string;
    owner?: {
      name: string;
      whatsapp_number: string;
      avatar_url?: string | null;
    } | null;
  };
}

export function PropertyOwnerContactCard({ property }: PropertyOwnerContactCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          {property.owner?.avatar_url ? (
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
              <Image
                src={property.owner.avatar_url}
                alt={property.owner.name || "Pemilik Kos"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shadow-2xs">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Dikelola oleh
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {property.owner?.name || "Pemilik Kos"}
            </p>
          </div>
        </div>

        {property.owner?.whatsapp_number && (
          <a
            href={`https://wa.me/${formatWhatsAppNumber(property.owner.whatsapp_number)}?text=${encodeURIComponent(
              `Halo ${property.owner.name || "Pemilik Kos"}, saya tertarik dengan kos "${property.name}" di KosPasti (${origin}/kos/${property.id}). Apakah masih ada kamar yang tersedia?`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-float shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2"
            aria-label={`Hubungi pemilik kos ${property.owner.name || ""} via WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Tanya Pemilik</span>
            <span className="sm:hidden">Chat WA</span>
          </a>
        )}
      </div>

      {/* Catatan Edukasi Keamanan Transaksi */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          Gunakan tombol <strong className="text-slate-700 dark:text-slate-200">Amankan Kamar</strong> di KosPasti untuk jaminan garansi 100% uang kembali.
        </span>
      </div>

      {/* Akses Cepat Bantuan CS KosPasti */}
      <div className="pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Butuh bantuan terkait kos ini?</span>
        <a
          href={buildSupportWhatsAppUrl({
            propertyName: property.name,
            propertyId: property.id,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>CS KosPasti</span>
        </a>
      </div>
    </div>
  );
}
