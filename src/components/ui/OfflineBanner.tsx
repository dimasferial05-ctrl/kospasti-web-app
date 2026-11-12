"use client";

import React from "react";
import { WifiOff, Clock } from "lucide-react";

interface OfflineBannerProps {
  title?: string;
  message?: string;
  lastSyncedAt?: string | null;
  className?: string;
}

function formatSyncTime(isoString?: string | null): string | null {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return null;
  }
}

export function OfflineBanner({
  title = "Mode Offline",
  message = "Menampilkan data yang tersimpan di perangkat Anda. Beberapa aksi membutuhkan koneksi internet.",
  lastSyncedAt,
  className = "",
}: OfflineBannerProps) {
  const formattedSync = formatSyncTime(lastSyncedAt);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className={`bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
          <WifiOff className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
            {title}
          </p>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200/90 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {formattedSync && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2.5 py-1 rounded-full border border-amber-200/80 dark:border-amber-800/50 self-start sm:self-auto shrink-0">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>Disimpan: {formattedSync}</span>
        </div>
      )}
    </div>
  );
}

