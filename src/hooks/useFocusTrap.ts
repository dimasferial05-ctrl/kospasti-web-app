"use client";

import { useEffect, useRef } from "react";

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
}

/**
 * Custom hook untuk menerapkan W3C WAI-ARIA Focus Trap pada elemen Modal Dialog.
 * - Mengunci tombol Tab dan Shift+Tab agar tetap bersiklus di dalam elemen modal.
 * - Mendengarkan penekanan tombol Escape untuk menutup modal secara instan.
 * - Memfokuskan elemen interaktif pertama saat modal dibuka.
 * - Mengembalikan fokus (restore focus) ke elemen pemicu sebelumnya saat modal ditutup.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  autoFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // Simpan elemen yang sedang aktif sebelum modal terbuka
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        return (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0 ||
          el === document.activeElement
        );
      });
    };

    // Auto-fokus ke elemen pertama saat modal dibuka
    let timer: NodeJS.Timeout | null = null;
    if (autoFocus) {
      timer = setTimeout(() => {
        const focusables = getFocusableElements();
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }, 30);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Tangani tombol Escape
      if (e.key === "Escape") {
        if (onClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // 2. Tangani tombol Tab (Focus Trap)
      if (e.key === "Tab") {
        const focusables = getFocusableElements();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          // Navigasi mundur (Shift + Tab)
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Navigasi maju (Tab)
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timer) clearTimeout(timer);
      // Kembalikan fokus ke elemen asal saat modal ditutup
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, autoFocus]);

  return containerRef;
}

export default useFocusTrap;
