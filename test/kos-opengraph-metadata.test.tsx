import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMetadata } from "../src/app/kos/[id]/layout";
import { prisma } from "../src/lib/prisma";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Kos Detail OpenGraph & Dynamic Metadata Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("menghasilkan metadata OpenGraph dan Twitter Card dengan foto kos", async () => {
    vi.mocked(prisma.property.findUnique).mockResolvedValue({
      name: "Kos Melati Subang",
      description: "Kos eksklusif dekat kampus dengan fasilitas lengkap.",
      image_url: "https://example.com/kos-melati.jpg",
      price_per_month: 850000,
      gender_type: "CAMPUR",
    } as unknown as Awaited<ReturnType<typeof prisma.property.findUnique>>);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "prop-123" }),
    });

    expect(metadata.title).toBe("Kos Melati Subang - Sewa Kos di KosPasti");
    expect(metadata.openGraph?.title).toBe("Kos Melati Subang - Sewa Kos di KosPasti");
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://example.com/kos-melati.jpg",
        width: 1200,
        height: 630,
        alt: "Kos Melati Subang",
      },
    ]);
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("menangani fallback metadata jika properti tidak ditemukan di database", async () => {
    vi.mocked(prisma.property.findUnique).mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "non-existent" }),
    });

    expect(metadata.title).toContain("Kos Tidak Ditemukan");
  });
});
