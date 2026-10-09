"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

export function PwaUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Check if there is already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }

        // Listen for new service workers being installed
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installingWorker);
              setShowUpdate(true);
            }
          });
        });
      } catch (err) {
        console.error("Gagal memeriksa update service worker:", err);
      }
    };

    handleServiceWorker();

    // Listen for custom event (useful for manual trigger or testing)
    const handleCustomUpdate = () => {
      setShowUpdate(true);
    };

    window.addEventListener("pwa-update-available", handleCustomUpdate);

    return () => {
      window.removeEventListener("pwa-update-available", handleCustomUpdate);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    setIsUpdating(true);

    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }

    // Give service worker a moment to activate, then reload
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }, [waitingWorker]);

  if (!showUpdate) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-22 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100%-2rem)] md:w-auto bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/50 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            Pembaruan Tersedia
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Versi terbaru KosPasti sudah siap digunakan. Klik untuk memuat ulang halaman.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`}
              />
              <span>{isUpdating ? "Memuat ulang..." : "Muat Ulang"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUpdate(false)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Nanti saja
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUpdate(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Tutup pemberitahuan update"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
