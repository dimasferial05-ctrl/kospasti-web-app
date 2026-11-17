import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as getProperties } from "@/app/api/properties/route";
import { POST as promotePartnerProperty } from "@/app/api/partner/properties/[id]/featured/route";
import { PATCH as updateAdminFeatured } from "@/app/api/admin/properties/[id]/featured/route";
import FeaturedPropertiesSection from "@/components/landing/FeaturedPropertiesSection";
import KosPropertyCard from "@/components/features/KosPropertyCard";
import { prisma } from "@/lib/prisma";
import { signOwnerToken } from "@/lib/auth";
import * as adminAuth from "@/lib/admin-auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockCookiesStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = mockCookiesStore.get(key);
      return val ? { name: key, value: val } : undefined;
    },
    set: (obj: { name: string; value: string }) => {
      mockCookiesStore.set(obj.name, obj.value);
    },
  })),
}));

describe("Featured Properties System (Issue #396)", () => {
  const ownerId = "owner-test-123";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function setupPartnerToken() {
    const token = await signOwnerToken({
      ownerId,
      name: "Owner Test",
      whatsapp_number: "6281234567890",
    });
    mockCookiesStore.set("partner_token", token);
    return token;
  }

  describe("API: GET /api/properties?featured=true", () => {
    it("memfilter query database dengan is_featured: true dan status: PUBLISHED", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValueOnce([
        {
          id: "featured-1",
          name: "Kos Unggulan Subang 1",
          price_per_month: 850000,
          available_rooms: 3,
          gender_type: "CAMPUR",
          facilities: "WiFi, AC",
          image_url: "/uploads/img1.jpg",
          is_featured: true,
          featured_until: new Date(Date.now() + 86400000 * 10),
          status: "PUBLISHED",
          media: [],
          room_types: [],
          reviews: [],
        },
      ] as any);

      vi.spyOn(prisma.property, "count").mockResolvedValueOnce(1);

      const req = new NextRequest("http://localhost:3000/api/properties?featured=true");
      const res = await getProperties(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(findManySpy).toHaveBeenCalled();
      const whereArg = findManySpy.mock.calls[0][0]?.where;
      expect(whereArg?.is_featured).toBe(true);
      expect(whereArg?.status).toBe("PUBLISHED");
    });
  });

  describe("API: POST /api/partner/properties/[id]/featured", () => {
    it("menolak akses (401) jika mitra belum login", async () => {
      const req = new NextRequest("http://localhost:3000/api/partner/properties/prop-1/featured", {
        method: "POST",
        body: JSON.stringify({ durationDays: 30 }),
      });

      const res = await promotePartnerProperty(req, {
        params: Promise.resolve({ id: "prop-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it("menolak akses (403) jika properti bukan milik mitra yang login", async () => {
      await setupPartnerToken();

      vi.spyOn(prisma.property, "findUnique").mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Bukan Milik Saya",
        owner_id: "owner-different",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/partner/properties/prop-1/featured", {
        method: "POST",
        body: JSON.stringify({ durationDays: 30 }),
      });

      const res = await promotePartnerProperty(req, {
        params: Promise.resolve({ id: "prop-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Akses ditolak");
    });

    it("berhasil mengaktifkan status featured dengan durasi yang dipilih", async () => {
      await setupPartnerToken();

      vi.spyOn(prisma.property, "findUnique").mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Milik Saya",
        owner_id: ownerId,
        is_featured: false,
        featured_until: null,
      } as any);

      const updateSpy = vi.spyOn(prisma.property, "update").mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Milik Saya",
        is_featured: true,
        featured_until: new Date(Date.now() + 86400000 * 14),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/partner/properties/prop-1/featured", {
        method: "POST",
        body: JSON.stringify({ durationDays: 14 }),
      });

      const res = await promotePartnerProperty(req, {
        params: Promise.resolve({ id: "prop-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prop-1" },
          data: expect.objectContaining({
            is_featured: true,
          }),
        })
      );
      expect(json.data.is_featured).toBe(true);
    });
  });

  describe("API: PATCH /api/admin/properties/[id]/featured", () => {
    it("menolak akses (401) jika request bukan dari admin terverifikasi", async () => {
      vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValueOnce(false);

      const req = new NextRequest("http://localhost:3000/api/admin/properties/prop-1/featured", {
        method: "PATCH",
        body: JSON.stringify({ is_featured: true }),
      });

      const res = await updateAdminFeatured(req, {
        params: Promise.resolve({ id: "prop-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("memperbarui status featured dan tanggal masa berlaku oleh admin", async () => {
      vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValueOnce(true);

      vi.spyOn(prisma.property, "findUnique").mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Admin Test",
      } as any);

      const targetDate = new Date("2026-12-31T23:59:59.000Z");
      const updateSpy = vi.spyOn(prisma.property, "update").mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Admin Test",
        is_featured: true,
        featured_until: targetDate,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/properties/prop-1/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_featured: true,
          featured_until: targetDate.toISOString(),
        }),
      });

      const res = await updateAdminFeatured(req, {
        params: Promise.resolve({ id: "prop-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "prop-1" },
        data: {
          is_featured: true,
          featured_until: targetDate,
        },
      });
    });
  });

  describe("UI Cleanliness & Components", () => {
    it("FeaturedPropertiesSection merender judul rekomendasi tanpa emotikon slop dan tanpa eyebrow pill redundan", () => {
      const html = renderToStaticMarkup(<FeaturedPropertiesSection />);
      expect(html).toContain("Kos Rekomendasi Pilihan KosPasti");
      // Tidak boleh ada emotikon AI-slop kasar seperti ⭐ atau 🌟 di teks statis
      expect(html).not.toContain("⭐");
      expect(html).not.toContain("🌟");
      // Bebas eyebrow pill redundan sesuai panduan antislop-ui R-09
      expect(html).not.toContain("Pilihan Terverifikasi");
    });

    it("KosPropertyCard merender badge Rekomendasi saat isFeatured bernilai true", () => {
      const html = renderToStaticMarkup(
        <KosPropertyCard
          id="prop-1"
          name="Kos Melati Asri"
          price={800000}
          availableRooms={2}
          genderType="PUTRI"
          facilities="WiFi, AC"
          imageUrl="/kos.jpg"
          ownerName="Ibu Siti"
          lastUpdated="2026-11-17"
          isFeatured={true}
        />
      );

      expect(html).toContain("Rekomendasi");
      // Memastikan bukan teks emoji slop
      expect(html).not.toContain("⭐ Rekomendasi");
    });
  });
});
