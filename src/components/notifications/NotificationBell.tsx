"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Clock,
  MessageSquare,
  Wallet,
  Sparkles,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/date-utils";
import { isSafeRedirectPath } from "@/lib/auth";

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

interface NotificationBellProps {
  audience?: "USER" | "OWNER";
  className?: string;
}

const POLL_INTERVAL_MS = 45000;

export function NotificationBell({
  audience = "USER",
  className = "",
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD">("ALL");

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await fetch(
          `/api/notifications?audience=${audience}&limit=20`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success) {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
          setUnreadCount(typeof data.unread_count === "number" ? data.unread_count : 0);
        }
      } catch {
        // Abaikan kegagalan jaringan sementara pada background polling
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [audience]
  );

  // Initial fetch & interval polling ringan saat tab aktif
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications(true);
      }
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      fetchNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  // Tutup popover saat klik di luar atau tekan Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications(notifications.length > 0);
    }
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      // Optimistic update UI
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notif.id ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch(
          `/api/notifications/${notif.id}/read?audience=${audience}`,
          { method: "PATCH" }
        );
      } catch {
        // Ignore network error after optimistic update
      }
    }

    setIsOpen(false);
    if (notif.link && isSafeRedirectPath(notif.link)) {
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic update UI
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch(`/api/notifications/read-all?audience=${audience}`, {
        method: "POST",
      });
    } catch {
      // Refetch jika gagal
      fetchNotifications(true);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "BOOKING_STATUS":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </div>
        );
      case "PAYMENT_SUCCESS":
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case "CHECKIN_REMINDER":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "REVIEW_REPLY":
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case "PAYOUT_UPDATE":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        );
      case "VISIT_SCHEDULE":
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const displayedNotifications =
    filterTab === "UNREAD"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Buka Notifikasi"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
          isOpen
            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
            : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400"
        }`}
      >
        <Bell className="w-4 h-4" />

        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pusat Notifikasi"
          className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[384px] bg-white dark:bg-slate-900 rounded-2xl shadow-float border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Popover */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 text-[10px] font-bold">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterTab === "ALL"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("UNREAD")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterTab === "UNREAD"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              Belum Dibaca
            </button>
          </div>

          {/* List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-xs font-medium">Memuat notifikasi...</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {filterTab === "UNREAD"
                    ? "Semua notifikasi sudah dibaca"
                    : "Belum ada notifikasi"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
                  Pembaruan status booking, pembayaran, pengingat check-in, dan balasan ulasan akan muncul di sini.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                    !notif.is_read
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {renderTypeIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs leading-snug ${
                          !notif.is_read
                            ? "font-extrabold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {notif.title}
                      </p>

                      {!notif.is_read && (
                        <span
                          aria-label="Belum dibaca"
                          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"
                        />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                      {notif.link && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Lihat</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

