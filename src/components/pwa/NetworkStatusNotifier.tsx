"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatusNotifier() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set status awal
    setIsOffline(!navigator.onLine);

    let reconnectTimer: NodeJS.Timeout | null = null;

    const handleOffline = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-3 py-1.5 rounded-full shadow-float border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md animate-in slide-in-from-top-3 duration-200 flex items-center gap-2 text-xs font-bold"
    >
      {isOffline ? (
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <WifiOff className="w-3.5 h-3.5 animate-pulse text-rose-600 dark:text-rose-400 shrink-0" />
          <span>Koneksi terputus. Anda dalam mode offline.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Koneksi kembali terhubung!</span>
        </div>
      )}
    </div>
  );
}
