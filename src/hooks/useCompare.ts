"use client";

import { useState, useEffect, useCallback } from "react";

export interface CompareItem {
  id: string;
  name: string;
  price: number;
  gender_type: string;
  image_url?: string | null;
  available_rooms?: number;
}

const STORAGE_KEY = "kospasti_compare_list";
const CUSTOM_EVENT_NAME = "kospasti-compare-updated";
export const MAX_COMPARE_ITEMS = 3;

function getStoredCompareList(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_COMPARE_ITEMS);
    }
  } catch (err) {
    console.warn("Gagal membaca daftar komparasi kos dari localStorage:", err);
  }
  return [];
}

function saveStoredCompareList(items: CompareItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
    window.dispatchEvent(new Event(CUSTOM_EVENT_NAME));
  } catch (err) {
    console.warn("Gagal menyimpan daftar komparasi kos ke localStorage:", err);
  }
}

export function useCompare() {
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const syncFromStorage = useCallback(() => {
    setCompareList(getStoredCompareList());
  }, []);

  useEffect(() => {
    // Inisialisasi awal di client setelah mount untuk menghindari hydration mismatch
    syncFromStorage();
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        syncFromStorage();
      }
    };

    const handleCustomChange = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CUSTOM_EVENT_NAME, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CUSTOM_EVENT_NAME, handleCustomChange);
    };
  }, [syncFromStorage]);

  const isInCompare = useCallback(
    (id: string): boolean => {
      return compareList.some((item) => item.id === id);
    },
    [compareList]
  );

  const addToCompare = useCallback(
    (item: CompareItem): { success: boolean; message?: string } => {
      const current = getStoredCompareList();

      if (current.some((c) => c.id === item.id)) {
        return { success: true };
      }

      if (current.length >= MAX_COMPARE_ITEMS) {
        return {
          success: false,
          message: `Maksimal ${MAX_COMPARE_ITEMS} kos yang dapat dibandingkan sekaligus. Hapus salah satu terlebih dahulu.`,
        };
      }

      const next = [...current, item];
      saveStoredCompareList(next);
      setCompareList(next);
      return { success: true };
    },
    []
  );

  const removeFromCompare = useCallback((id: string): void => {
    const current = getStoredCompareList();
    const next = current.filter((item) => item.id !== id);
    saveStoredCompareList(next);
    setCompareList(next);
  }, []);

  const toggleCompare = useCallback(
    (item: CompareItem): { success: boolean; isAdded: boolean; message?: string } => {
      const current = getStoredCompareList();
      const exists = current.some((c) => c.id === item.id);

      if (exists) {
        const next = current.filter((c) => c.id !== item.id);
        saveStoredCompareList(next);
        setCompareList(next);
        return { success: true, isAdded: false };
      } else {
        if (current.length >= MAX_COMPARE_ITEMS) {
          return {
            success: false,
            isAdded: false,
            message: `Maksimal ${MAX_COMPARE_ITEMS} kos yang dapat dibandingkan sekaligus.`,
          };
        }
        const next = [...current, item];
        saveStoredCompareList(next);
        setCompareList(next);
        return { success: true, isAdded: true };
      }
    },
    []
  );

  const clearCompare = useCallback((): void => {
    saveStoredCompareList([]);
    setCompareList([]);
  }, []);

  return {
    compareList,
    count: compareList.length,
    isLoaded,
    maxItems: MAX_COMPARE_ITEMS,
    isInCompare,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    clearCompare,
  };
}

