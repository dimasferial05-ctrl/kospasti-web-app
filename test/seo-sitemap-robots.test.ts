import { describe, it, expect, vi, beforeEach } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { generateLodgingJsonLd, PropertySeoData } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

describe("SEO, Sitemap Dinamis & Schema.org Tests (#364)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Robots Handler (src/app/robots.ts)", () => {
    it("menghasilkan konfigurasi robots.txt yang valid dengan allow dan disallow", () => {
      const robotsConfig = robots();

      expect(robotsConfig).toBeDefined();
      expect(robotsConfig.sitemap).toContain("/sitemap.xml");

      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      expect(rules).toBeDefined();
      expect(rules.userAgent).toBe("*");

      // Verifikasi rute publik diizinkan
      const allowed = Array.isArray(rules.allow) ? rules.allow : [rules.allow];
      expect(allowed).toContain("/");
      expect(allowed).toContain("/search");
      expect(allowed).toContain("/kos/");
      expect(allowed).toContain("/map");

      // Verifikasi rute privat diblokir
      const disallowed = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
      expect(disallowed).toContain("/admin/");
      expect(disallowed).toContain("/partner/dashboard/");
      expect(disallowed).toContain("/api/");
    });
  });

  describe("2. Generator Sitemap Dinamis (src/app/sitemap.ts)", () => {
    it("menghasilkan sitemap dengan rute statis, kos aktif, dan pencarian per wilayah", async () => {
      const mockProperties = [
        { id: "prop-subang-1", updated_at: new Date("2026-11-01T10:00:00Z") },
        { id: "prop-subang-2", updated_at: new Date("2026-11-02T10:00:00Z") },
      ];

      const mockLocations = [
        { name: "Polsub Subang", updated_at: new Date("2026-10-15T00:00:00Z") },
        { name: "Kalijati", updated_at: new Date("2026-10-15T00:00:00Z") },
      ];

      vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as unknown as never);
      vi.spyOn(prisma.location, "findMany").mockResolvedValue(mockLocations as unknown as never);

      const sitemapEntries = await sitemap();

      expect(Array.isArray(sitemapEntries)).toBe(true);

      const urls = sitemapEntries.map((e) => e.url);

      // Verifikasi rute statis
      expect(urls.some((u) => u.endsWith("/search"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/map"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/bantuan"))).toBe(true);

      // Verifikasi rute dinamis kos aktif
      expect(urls.some((u) => u.includes("/kos/prop-subang-1"))).toBe(true);
      expect(urls.some((u) => u.includes("/kos/prop-subang-2"))).toBe(true);

      // Verifikasi rute pencarian wilayah
      expect(urls.some((u) => u.includes("/search?q=Polsub%20Subang"))).toBe(true);
      expect(urls.some((u) => u.includes("/search?q=Kalijati"))).toBe(true);
    });

    it("tetap aman dan mengembalikan rute statis jika query database mengalami error", async () => {
      vi.spyOn(prisma.property, "findMany").mockRejectedValue(new Error("Database disconnected"));
      vi.spyOn(prisma.location, "findMany").mockRejectedValue(new Error("Database disconnected"));

      const sitemapEntries = await sitemap();
      expect(Array.isArray(sitemapEntries)).toBe(true);
      expect(sitemapEntries.length).toBeGreaterThan(0);
      expect(sitemapEntries.some((e) => e.url.endsWith("/search"))).toBe(true);
    });
  });

  describe("3. Helper Schema.org JSON-LD (src/lib/seo.ts)", () => {
    it("menghasilkan struktur data LodgingBusiness & Place dengan informasi lengkap", () => {
      const mockProperty: PropertySeoData = {
        id: "kos-polsub-123",
        name: "Kos Melati Polsub",
        description: "Kos dekat kampus Polsub Subang fasilitas lengkap.",
        price_per_month: 750000,
        available_rooms: 3,
        address: "Jl. Brigjen Katamso No. 45, Subang",
        image_url: "https://kospasti.com/uploads/kamar.jpg",
        facilities: "WiFi, AC, Kasur, Kamar Mandi Dalam",
        latitude: -6.5715,
        longitude: 107.7587,
        average_rating: 4.8,
        total_reviews: 12,
        owner: {
          name: "Ibu Hj. Ratna",
          whatsapp_number: "081234567890",
        },
      };

      const schema = generateLodgingJsonLd(mockProperty, "https://kospasti.com");

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toEqual(["LodgingBusiness", "Place"]);
      expect(schema.name).toBe("Kos Melati Polsub");
      expect(schema.url).toBe("https://kospasti.com/kos/kos-polsub-123");
      expect(schema.priceRange).toContain("750.000");

      // Verifikasi Address
      const address = schema.address as any;
      expect(address["@type"]).toBe("PostalAddress");
      expect(address.streetAddress).toBe("Jl. Brigjen Katamso No. 45, Subang");
      expect(address.addressLocality).toBe("Subang");
      expect(address.addressCountry).toBe("ID");

      // Verifikasi Offers
      const offers = schema.offers as any;
      expect(offers["@type"]).toBe("Offer");
      expect(offers.price).toBe(750000);
      expect(offers.priceCurrency).toBe("IDR");
      expect(offers.availability).toBe("https://schema.org/InStock");

      // Verifikasi GeoCoordinates
      const geo = schema.geo as any;
      expect(geo["@type"]).toBe("GeoCoordinates");
      expect(geo.latitude).toBe(-6.5715);
      expect(geo.longitude).toBe(107.7587);

      // Verifikasi AggregateRating
      const rating = schema.aggregateRating as any;
      expect(rating["@type"]).toBe("AggregateRating");
      expect(rating.ratingValue).toBe(4.8);
      expect(rating.reviewCount).toBe(12);

      // Verifikasi Amenities
      const amenities = schema.amenityFeature as any[];
      expect(amenities).toHaveLength(4);
      expect(amenities[0].name).toBe("WiFi");
    });

    it("menangani ketersediaan kamar habis (OutOfStock) dan properti tanpa ulasan", () => {
      const mockPropertyEmpty: PropertySeoData = {
        id: "kos-penuh-99",
        name: "Kos Penuh",
        price_per_month: 500000,
        available_rooms: 0, // Kamar penuh
        total_reviews: 0,
      };

      const schema = generateLodgingJsonLd(mockPropertyEmpty, "https://kospasti.com");

      const offers = schema.offers as any;
      expect(offers.availability).toBe("https://schema.org/OutOfStock");
      expect(schema.aggregateRating).toBeUndefined();
      expect(schema.geo).toBeUndefined();
    });
  });
});
