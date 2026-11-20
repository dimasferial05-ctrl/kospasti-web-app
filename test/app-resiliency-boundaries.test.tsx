import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RouteErrorBoundary from "../src/app/error";
import GlobalError from "../src/app/global-error";
import NotFound, { metadata as notFoundMetadata } from "../src/app/not-found";
import RootLoading from "../src/app/loading";

describe("App Router Resiliency Boundaries & States", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("RouteErrorBoundary (src/app/error.tsx)", () => {
    it("merender tampilan error boundary dengan judul, deskripsi, dan tombol aksi pemulihan", () => {
      const mockError = new Error("Database connection timed out") as Error & { digest?: string };
      mockError.digest = "ERR_NEON_TIMEOUT_123";

      const html = renderToStaticMarkup(
        <RouteErrorBoundary
          error={mockError}
          reset={vi.fn()}
          retry={vi.fn()}
        />
      );

      expect(html).toContain("Terjadi Kendala Teknis");
      expect(html).toContain("Halaman ini sementara tidak dapat dimuat");
      expect(html).toContain("ERR_NEON_TIMEOUT_123");
      expect(html).toContain("ID Insiden");
      expect(html).toContain("Coba Lagi");
      expect(html).toContain("Ke Beranda");
      expect(html).toContain('href="/"');
    });

    it("tidak menampilkan ID Insiden jika error tidak memiliki properti digest", () => {
      const mockError = new Error("Generic runtime error");

      const html = renderToStaticMarkup(
        <RouteErrorBoundary
          error={mockError}
          reset={vi.fn()}
          retry={vi.fn()}
        />
      );

      expect(html).toContain("Terjadi Kendala Teknis");
      expect(html).not.toContain("ID Insiden");
    });
  });

  describe("GlobalError (src/app/global-error.tsx)", () => {
    it("merender struktur html dan body mandiri untuk kegagalan tingkat root layout", () => {
      const mockError = new Error("Root layout failure") as Error & { digest?: string };
      mockError.digest = "GLOBAL_PANIC_999";

      const html = renderToStaticMarkup(
        <GlobalError
          error={mockError}
          reset={vi.fn()}
          retry={vi.fn()}
        />
      );

      expect(html).toContain("<html");
      expect(html).toContain("<body");
      expect(html).toContain("Sistem Mengalami Kendala Kritis");
      expect(html).toContain("GLOBAL_PANIC_999");
      expect(html).toContain("Muat Ulang Halaman");
    });
  });

  describe("NotFound (src/app/not-found.tsx)", () => {
    it("merender halaman 404 ramah pengguna dengan metadata dan navigasi", () => {
      expect(notFoundMetadata.title).toContain("404");

      const html = renderToStaticMarkup(<NotFound />);

      expect(html).toContain("404 • Halaman Tidak Ditemukan");
      expect(html).toContain("Kamar atau Halaman Tidak Ditemukan");
      expect(html).toContain("Cari Kos Lainnya");
      expect(html).toContain('href="/kos"');
      expect(html).toContain("Ke Beranda");
      expect(html).toContain('href="/"');
      expect(html).toContain("Pusat Bantuan KosPasti");
      expect(html).toContain('href="/bantuan"');
    });
  });

  describe("RootLoading (src/app/loading.tsx)", () => {
    it("merender instant loading skeleton yang berisi grid kartu placeholder", () => {
      const html = renderToStaticMarkup(<RootLoading />);

      expect(html).toContain("animate-pulse");
      // Grid memuat 6 KosPropertyCardSkeleton
      const countSkeletonCards = (html.match(/aspect-\[4\/3\]/g) || []).length;
      expect(countSkeletonCards).toBe(6);
    });
  });
});
