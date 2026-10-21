import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next/headers for cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  verifyOwnerToken: vi.fn(),
}));

// Mock admin-auth
vi.mock("@/lib/admin-auth", () => ({
  isValidAdminRequest: vi.fn(),
  createAdminUnauthorizedResponse: vi.fn().mockImplementation(() => {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    owner: {
      findUnique: vi.fn(),
    },
    property: {
      create: vi.fn(),
    },
  },
}));

// Mock upload
vi.mock("@/lib/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/upload")>();
  return {
    ...actual,
    saveUploadedFile: vi.fn().mockResolvedValue({
      url: "/uploads/properties/mock-room.jpg",
      type: "IMAGE",
    }),
    saveUploadedFiles: vi.fn().mockResolvedValue([
      { url: "/uploads/properties/mock-file-1.jpg", type: "IMAGE" },
    ]),
  };
});

import { POST as adminPOST } from "@/app/api/admin/properties/route";
import { POST as partnerPOST } from "@/app/api/partner/properties/route";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { isValidAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

describe("Property POST Payload Parser Consolidation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. POST /api/admin/properties", () => {
    it("harus berhasil memproses pembuatan properti via JSON menggunakan parsePropertyPayload", async () => {
      vi.mocked(isValidAdminRequest).mockReturnValue(true);
      vi.mocked(prisma.owner.findUnique).mockResolvedValue({
        id: "owner-123",
        name: "Pemilik Test",
        whatsapp_number: "08123456789",
      } as never);

      vi.mocked(prisma.property.create).mockImplementation(async (args) => {
        return {
          id: "prop-new-1",
          ...args.data,
        } as never;
      });

      const payload = {
        name: "Kos Nyaman Admin",
        price_per_month: 800000,
        available_rooms: 4,
        gender_type: "CAMPUR",
        facilities: "WiFi, Kasur",
        owner_id: "owner-123",
        is_pet_friendly: true,
        is_24_hours: true,
        room_types: [
          {
            name: "Kamar Standar",
            price_per_month: 800000,
            available_rooms: 4,
          },
        ],
        media: ["https://example.com/foto1.jpg"],
      };

      const req = new NextRequest("http://localhost:3000/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await adminPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(prisma.property.create).toHaveBeenCalledTimes(1);
      const createArgs = vi.mocked(prisma.property.create).mock.calls[0][0];
      expect(createArgs.data.name).toBe("Kos Nyaman Admin");
      expect(createArgs.data.gender_type).toBe("CAMPUR");
      expect(createArgs.data.owner_id).toBe("owner-123");
      expect(createArgs.data.is_pet_friendly).toBe(true);
      expect(createArgs.data.is_24_hours).toBe(true);
      expect(createArgs.data.media?.create).toHaveLength(1);
      expect(createArgs.data.media?.create?.[0].url).toBe("https://example.com/foto1.jpg");
    });

    it("harus berhasil memproses pembuatan properti via Multipart FormData dengan upload media", async () => {
      vi.mocked(isValidAdminRequest).mockReturnValue(true);
      vi.mocked(prisma.owner.findUnique).mockResolvedValue({
        id: "owner-123",
        name: "Pemilik Test",
        whatsapp_number: "08123456789",
      } as never);

      vi.mocked(prisma.property.create).mockImplementation(async (args) => {
        return {
          id: "prop-multipart",
          ...args.data,
        } as never;
      });

      const formData = new FormData();
      formData.append("name", "Kos Subang Form Admin");
      formData.append("price_per_month", "950000");
      formData.append("available_rooms", "2");
      formData.append("gender_type", "PUTRI");
      formData.append("facilities", "AC, Kamar Mandi Dalam");
      formData.append("owner_id", "owner-123");
      formData.append(
        "room_types",
        JSON.stringify([
          {
            name: "VIP Room",
            price_per_month: 950000,
            available_rooms: 2,
          },
        ])
      );

      const dummyFile = new File(["dummy-data"], "foto-kos.jpg", { type: "image/jpeg" });
      formData.append("media", dummyFile);

      const req = new NextRequest("http://localhost:3000/api/admin/properties", {
        method: "POST",
        body: formData,
      });

      const res = await adminPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      const createArgs = vi.mocked(prisma.property.create).mock.calls[0][0];
      expect(createArgs.data.name).toBe("Kos Subang Form Admin");
      expect(createArgs.data.gender_type).toBe("PUTRI");
      expect(createArgs.data.media?.create?.[0].url).toContain("/uploads/properties/mock-file-1.jpg");
    });

    it("harus mengembalikan status 400 jika field wajib tidak lengkap", async () => {
      vi.mocked(isValidAdminRequest).mockReturnValue(true);

      const req = new NextRequest("http://localhost:3000/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      const res = await adminPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Bad Request");
    });
  });

  describe("2. POST /api/partner/properties", () => {
    it("harus berhasil memproses pembuatan kos mitra via JSON dan memaksa owner_id dari token", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "valid-partner-token" }),
      } as never);

      vi.mocked(verifyOwnerToken).mockResolvedValue({
        ownerId: "partner-token-owner-id",
        role: "OWNER",
      } as never);

      vi.mocked(prisma.property.create).mockImplementation(async (args) => {
        return {
          id: "prop-partner-1",
          ...args.data,
        } as never;
      });

      const payload = {
        name: "Kos Mitra Bunga",
        price_per_month: 600000,
        available_rooms: 3,
        gender_type: "PUTRA",
        facilities: "WiFi",
        owner_id: "malicious-spoofed-owner-id", // Harus diabaikan, dipaksa partner-token-owner-id
        room_types: [
          {
            name: "Reguler",
            price_per_month: 600000,
            available_rooms: 3,
          },
        ],
        media: ["https://example.com/mitra.jpg"],
      };

      const req = new NextRequest("http://localhost:3000/api/partner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await partnerPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      const createArgs = vi.mocked(prisma.property.create).mock.calls[0][0];
      expect(createArgs.data.name).toBe("Kos Mitra Bunga");
      expect(createArgs.data.owner_id).toBe("partner-token-owner-id");
      expect(createArgs.data.status).toBe("PENDING_REVIEW");
    });

    it("harus berhasil memproses pembuatan kos mitra via Multipart FormData", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "valid-partner-token" }),
      } as never);

      vi.mocked(verifyOwnerToken).mockResolvedValue({
        ownerId: "partner-token-owner-id",
        role: "OWNER",
      } as never);

      vi.mocked(prisma.property.create).mockImplementation(async (args) => {
        return {
          id: "prop-partner-multipart",
          ...args.data,
        } as never;
      });

      const formData = new FormData();
      formData.append("name", "Kos Mitra Mawar");
      formData.append("price_per_month", "700000");
      formData.append("available_rooms", "5");
      formData.append("gender_type", "CAMPUR");

      const req = new NextRequest("http://localhost:3000/api/partner/properties", {
        method: "POST",
        body: formData,
      });

      const res = await partnerPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      const createArgs = vi.mocked(prisma.property.create).mock.calls[0][0];
      expect(createArgs.data.name).toBe("Kos Mitra Mawar");
      expect(createArgs.data.gender_type).toBe("CAMPUR");
      expect(createArgs.data.owner_id).toBe("partner-token-owner-id");
      expect(createArgs.data.facilities).toBe("WiFi, Kasur, Lemari, Kamar Mandi"); // Fallback fasilitas mitra jika kosong
    });

    it("harus mengembalikan 400 jika nama kos mitra kosong", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "valid-partner-token" }),
      } as never);

      vi.mocked(verifyOwnerToken).mockResolvedValue({
        ownerId: "partner-token-owner-id",
        role: "OWNER",
      } as never);

      const req = new NextRequest("http://localhost:3000/api/partner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "   " }),
      });

      const res = await partnerPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Nama kos wajib diisi.");
    });
  });
});
