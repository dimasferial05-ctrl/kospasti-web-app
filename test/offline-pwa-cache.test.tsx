import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  saveCachedWishlist,
  getCachedWishlist,
  saveCachedReceipt,
  getCachedReceipt,
  saveCachedBookings,
  getCachedBookings,
  saveCachedAuth,
  getCachedAuth,
  saveCachedUserProfile,
  getCachedUserProfile,
  clearOfflineCaches,
  KOSPASTI_OFFLINE_WISHLIST,
  KOSPASTI_OFFLINE_RECEIPTS,
  KOSPASTI_OFFLINE_BOOKINGS,
  KOSPASTI_OFFLINE_USER_AUTH,
  KOSPASTI_OFFLINE_USER_PROFILE,
} from "@/lib/offline-storage";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import OfflineFallbackPage from "@/app/~offline/page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function createMockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
}

describe("Offline PWA Storage & Cache (#390)", () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    vi.stubGlobal("window", {
      localStorage: mockStorage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("1. Helper src/lib/offline-storage.ts", () => {
    it("menyimpan dan membaca daftar kos favorit dengan aman", () => {
      const sampleWishlist = [
        {
          id: "saved-1",
          created_at: "2026-11-12T00:00:00.000Z",
          property: {
            id: "prop-1",
            name: "Kos Melati Pogung",
            price_per_month: 1200000,
            available_rooms: 2,
            gender_type: "PUTRI",
            facilities: "WiFi, AC, Kamar Mandi Dalam",
            updated_at: "2026-11-12T00:00:00.000Z",
          },
        },
      ];

      saveCachedWishlist(sampleWishlist);
      const cached = getCachedWishlist<typeof sampleWishlist[0]>();

      expect(cached).not.toBeNull();
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0].property.name).toBe("Kos Melati Pogung");
      expect(typeof cached?.updatedAt).toBe("string");
    });

    it("menyimpan dan membaca e-receipt berdasarkan bookingId dan memangkas jika melebihi 20 entri", () => {
      for (let i = 1; i <= 25; i++) {
        saveCachedReceipt(`booking-${i}`, {
          id: `booking-${i}`,
          studentName: `Mahasiswa ${i}`,
          status: "PAID",
        });
      }

      const latest = getCachedReceipt<{ id: string; studentName: string; status: string }>(
        "booking-25"
      );
      expect(latest).not.toBeNull();
      expect(latest?.receipt.studentName).toBe("Mahasiswa 25");

      const raw = JSON.parse(mockStorage.getItem(KOSPASTI_OFFLINE_RECEIPTS) || "{}");
      expect(Object.keys(raw.data)).toHaveLength(20);
    });

    it("menyimpan dan membaca riwayat booking, sesi auth, serta profil pengguna", () => {
      saveCachedBookings([{ id: "bk-1", status: "PAID" }]);
      saveCachedAuth({ authenticated: true, user: { id: "usr-1" } });
      saveCachedUserProfile({ id: "usr-1", name: "Dimas" });

      expect(getCachedBookings()?.bookings).toHaveLength(1);
      expect(getCachedAuth<{ authenticated: boolean }>()?.auth.authenticated).toBe(true);
      expect(getCachedUserProfile<{ name: string }>()?.profile.name).toBe("Dimas");
    });

    it("menghapus semua cache offline saat clearOfflineCaches() dipanggil (logout)", () => {
      saveCachedWishlist([{ id: "s1" }]);
      saveCachedReceipt("bk-1", { id: "bk-1" });
      saveCachedBookings([{ id: "bk-1" }]);
      saveCachedAuth({ authenticated: true });
      saveCachedUserProfile({ id: "usr-1" });

      clearOfflineCaches();

      expect(mockStorage.getItem(KOSPASTI_OFFLINE_WISHLIST)).toBeNull();
      expect(mockStorage.getItem(KOSPASTI_OFFLINE_RECEIPTS)).toBeNull();
      expect(mockStorage.getItem(KOSPASTI_OFFLINE_BOOKINGS)).toBeNull();
      expect(mockStorage.getItem(KOSPASTI_OFFLINE_USER_AUTH)).toBeNull();
      expect(mockStorage.getItem(KOSPASTI_OFFLINE_USER_PROFILE)).toBeNull();
    });

    it("aman saat dipanggil di lingkungan SSR (tanpa window) atau saat JSON rusak", () => {
      vi.unstubAllGlobals();
      expect(getCachedWishlist()).toBeNull();
      expect(getCachedReceipt("bk-1")).toBeNull();
      expect(() => saveCachedWishlist([])).not.toThrow();

      // Re-stub dengan JSON rusak
      vi.stubGlobal("window", { localStorage: mockStorage });
      mockStorage.setItem(KOSPASTI_OFFLINE_WISHLIST, "{broken-json");
      expect(getCachedWishlist()).toBeNull();
    });
  });

  describe("2. Komponen UI OfflineBanner & Halaman ~offline", () => {
    it("merender OfflineBanner dengan aksesibilitas aria-live polite dan waktu sinkronisasi", () => {
      const html = renderToStaticMarkup(
        <OfflineBanner
          title="Mode Offline Aktif"
          message="Menampilkan 3 kos favorit tersimpan."
          lastSyncedAt="2026-11-12T07:30:00.000Z"
        />
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain("Mode Offline Aktif");
      expect(html).toContain("Menampilkan 3 kos favorit tersimpan.");
      expect(html).toContain("Disimpan:");
    });

    it("merender halaman ~offline dengan tautan cepat ke /favorit dan /profil?tab=bookings", () => {
      const html = renderToStaticMarkup(<OfflineFallbackPage />);

      expect(html).toContain("Koneksi Terputus");
      expect(html).toContain('href="/favorit"');
      expect(html).toContain('href="/profil?tab=bookings"');
      expect(html).toContain("Kos Favorit Tersimpan");
      expect(html).toContain("E-Receipt");
    });
  });

  describe("3. Integrasi Rute & Konfigurasi PWA (next.config.ts)", () => {
    it("mengonfigurasi runtimeCaching untuk API wishlist, auth, bookings/receipts, dan gambar kos", () => {
      const nextConfigPath = path.join(process.cwd(), "next.config.ts");
      const content = fs.readFileSync(nextConfigPath, "utf-8");

      expect(content).toContain("extendDefaultRuntimeCaching: true");
      expect(content).toContain("/api/user/wishlist");
      expect(content).toContain("/api/auth/me");
      expect(content).toContain("/api/user/bookings");
      expect(content).toContain("kospasti-api-receipts");
      expect(content).toContain("kospasti-external-images");
      expect(content).toContain('document: "/~offline"');
    });

    it("memastikan halaman /favorit terintegrasi dengan offline fallback dan banner", () => {
      const favoritPath = path.join(process.cwd(), "src/app/favorit/page.tsx");
      const content = fs.readFileSync(favoritPath, "utf-8");

      expect(content).toContain("saveCachedWishlist");
      expect(content).toContain("getCachedWishlist");
      expect(content).toContain("OfflineBanner");
      expect(content).toContain("navigator.onLine === false");
    });

    it("memastikan halaman /receipt/[bookingId] terintegrasi dengan offline fallback dan banner", () => {
      const receiptPath = path.join(process.cwd(), "src/app/receipt/[bookingId]/page.tsx");
      const content = fs.readFileSync(receiptPath, "utf-8");

      expect(content).toContain("saveCachedReceipt");
      expect(content).toContain("getCachedReceipt");
      expect(content).toContain("OfflineBanner");
      expect(content).toContain("Kuitansi Tersimpan (Mode Offline)");
    });

    it("memastikan halaman /profil terintegrasi dengan cache riwayat booking dan pembersihan cache saat logout", () => {
      const profilPath = path.join(process.cwd(), "src/app/profil/page.tsx");
      const content = fs.readFileSync(profilPath, "utf-8");

      expect(content).toContain("saveCachedBookings");
      expect(content).toContain("getCachedBookings");
      expect(content).toContain("clearOfflineCaches");
      expect(content).toContain("OfflineBanner");
    });
  });
});

