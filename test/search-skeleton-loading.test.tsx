import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SearchPage from "../src/app/search/page";
import { KosPropertyCardSkeleton } from "../src/components/features/KosPropertyCardSkeleton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Search Page Skeleton Loading Shimmer Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("merender komponen KosPropertyCardSkeleton dengan layout aspek 4/3 dan animasi pulse", () => {
    const html = renderToStaticMarkup(<KosPropertyCardSkeleton />);

    expect(html).toContain("animate-pulse");
    expect(html).toContain("aspect-[4/3]");
    expect(html).toContain("rounded-3xl");
  });

  it("merender grid skeleton berisikan 8 kartu saat data sedang dimuat", () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const html = renderToStaticMarkup(<SearchPage />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Memuat daftar kos...");

    // Memastikan 8 skeleton card muncul
    const matches = html.match(/aspect-\[4\/3\]/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThanOrEqual(8);
  });
});
