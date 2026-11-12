"use client";

import { useState, useEffect } from "react";

export const KOSPASTI_OFFLINE_WISHLIST = "kospasti_offline_wishlist_v1";
export const KOSPASTI_OFFLINE_RECEIPTS = "kospasti_offline_receipts_v1";
export const KOSPASTI_OFFLINE_BOOKINGS = "kospasti_offline_bookings_v1";
export const KOSPASTI_OFFLINE_USER_AUTH = "kospasti_offline_user_auth_v1";
export const KOSPASTI_OFFLINE_USER_PROFILE = "kospasti_offline_user_profile_v1";

const MAX_CACHED_RECEIPTS = 20;

interface CachedEntry<T> {
  data: T;
  updatedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): CachedEntry<T> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, data: T): void {
  if (!canUseStorage()) return;
  try {
    const payload: CachedEntry<T> = {
      data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore QuotaExceededError or private browsing restriction silently
  }
}

export function saveCachedWishlist<T>(items: T[]): void {
  writeJson(KOSPASTI_OFFLINE_WISHLIST, items);
}

export function getCachedWishlist<T>(): { items: T[]; updatedAt: string } | null {
  const entry = readJson<T[]>(KOSPASTI_OFFLINE_WISHLIST);
  if (!entry || !Array.isArray(entry.data)) return null;
  return { items: entry.data, updatedAt: entry.updatedAt };
}

export function saveCachedReceipt<T>(bookingId: string, receipt: T): void {
  if (!bookingId || !canUseStorage()) return;
  const existing = readJson<Record<string, CachedEntry<T>>>(KOSPASTI_OFFLINE_RECEIPTS);
  const map: Record<string, CachedEntry<T>> =
    existing && existing.data && typeof existing.data === "object" ? { ...existing.data } : {};

  map[bookingId] = {
    data: receipt,
    updatedAt: new Date().toISOString(),
  };

  // Prune oldest receipts if exceeding limit
  const entries = Object.entries(map);
  if (entries.length > MAX_CACHED_RECEIPTS) {
    entries.sort((a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime());
    const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHED_RECEIPTS));
    writeJson(KOSPASTI_OFFLINE_RECEIPTS, trimmed);
    return;
  }

  writeJson(KOSPASTI_OFFLINE_RECEIPTS, map);
}

export function getCachedReceipt<T>(bookingId: string): { receipt: T; updatedAt: string } | null {
  if (!bookingId) return null;
  const existing = readJson<Record<string, CachedEntry<T>>>(KOSPASTI_OFFLINE_RECEIPTS);
  if (!existing || !existing.data) return null;
  const target = existing.data[bookingId];
  if (!target || !target.data) return null;
  return { receipt: target.data, updatedAt: target.updatedAt };
}

export function saveCachedBookings<T>(bookings: T[]): void {
  writeJson(KOSPASTI_OFFLINE_BOOKINGS, bookings);
}

export function getCachedBookings<T>(): { bookings: T[]; updatedAt: string } | null {
  const entry = readJson<T[]>(KOSPASTI_OFFLINE_BOOKINGS);
  if (!entry || !Array.isArray(entry.data)) return null;
  return { bookings: entry.data, updatedAt: entry.updatedAt };
}

export function saveCachedAuth<T>(auth: T): void {
  writeJson(KOSPASTI_OFFLINE_USER_AUTH, auth);
}

export function getCachedAuth<T>(): { auth: T; updatedAt: string } | null {
  const entry = readJson<T>(KOSPASTI_OFFLINE_USER_AUTH);
  if (!entry || !entry.data) return null;
  return { auth: entry.data, updatedAt: entry.updatedAt };
}

export function saveCachedUserProfile<T>(profile: T): void {
  writeJson(KOSPASTI_OFFLINE_USER_PROFILE, profile);
}

export function getCachedUserProfile<T>(): { profile: T; updatedAt: string } | null {
  const entry = readJson<T>(KOSPASTI_OFFLINE_USER_PROFILE);
  if (!entry || !entry.data) return null;
  return { profile: entry.data, updatedAt: entry.updatedAt };
}

export function clearOfflineCaches(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(KOSPASTI_OFFLINE_WISHLIST);
    window.localStorage.removeItem(KOSPASTI_OFFLINE_RECEIPTS);
    window.localStorage.removeItem(KOSPASTI_OFFLINE_BOOKINGS);
    window.localStorage.removeItem(KOSPASTI_OFFLINE_USER_AUTH);
    window.localStorage.removeItem(KOSPASTI_OFFLINE_USER_PROFILE);
  } catch {
    // Ignore storage removal errors
  }
}

export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

