import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { PATCH } from "@/app/api/admin/properties/[id]/route";
import { prisma } from "@/lib/prisma";

// Mock helper autentikasi admin agar request selalu lolos
vi.mock("@/lib/admin-auth", () => ({
  isValidAdminRequest: vi.fn().mockReturnValue(true),
  createAdminUnauthorizedResponse: vi.fn(),
}));

// Mock Prisma client agar aman dan tidak memodifikasi database nyata
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    roomType: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe("Admin Properties Media Update & parsePropertyPayload Tests (Issue #309)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. berkas src/app/api/admin/properties/[id]/route.ts mendelegasikan parsing media ke parsePropertyPayload", () => {
    const routePath = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "admin",
      "properties",
      "[id]",
      "route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    // Memastikan parsePropertyPayload diimpor dan detectMediaType tidak lagi diimpor
    expect(content).toMatch(/import\s*\{[^}]*parsePropertyPayload[^}]*\}\s*from\s*["']@\/lib\/property-form-parser["']/);
    expect(content).not.toMatch(/import\s*\{[^}]*detectMediaType[^}]*\}\s*from\s*["']@\/lib\/upload["']/);
  });

  it("2. endpoint PATCH /api/admin/properties/[id] menggunakan data media dari parsePropertyPayload", async () => {
    const propertyId = "test-prop-123";

    // Mock data properti lama yang belum memiliki media image_url baru
    vi.mocked(prisma.property.findUnique).mockResolvedValue({
      id: propertyId,
      name: "Kos Melati Subang",
      image_url: "https://example.com/foto-lama.jpg",
      media: [],
      room_types: [],
    } as unknown as Awaited<ReturnType<typeof prisma.property.findUnique>>);

    vi.mocked(prisma.property.update).mockImplementation(async (args) => {
      const data = args.data as Record<string, unknown>;
      const mediaCreate = data.media && typeof data.media === "object" && "create" in data.media
        ? (data.media as { create: unknown[] }).create
        : [];
      return {
        id: propertyId,
        ...data,
        media: mediaCreate,
        room_types: [],
      } as unknown as Awaited<ReturnType<typeof prisma.property.update>>;
    });

    const newImageUrl = "https://example.com/foto-baru.jpg";
    const request = new NextRequest(
      `http://localhost:3000/api/admin/properties/${propertyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({
          image_url: newImageUrl,
          media: [{ url: newImageUrl, type: "IMAGE" }],
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: propertyId }),
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.image_url).toBe(newImageUrl);

    // Pastikan media yang diproses dari payload diteruskan ke Prisma update
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: propertyId },
        data: expect.objectContaining({
          image_url: newImageUrl,
          media: {
            create: expect.arrayContaining([
              expect.objectContaining({
                url: newImageUrl,
                type: "IMAGE",
              }),
            ]),
          },
        }),
      })
    );
  });

  it("3. endpoint PATCH /api/admin/properties/[id] memperbarui image_url tanpa menduplikasi media secara manual", async () => {
    const propertyId = "test-prop-456";

    vi.mocked(prisma.property.findUnique).mockResolvedValue({
      id: propertyId,
      name: "Kos Mawar Indah",
      image_url: "https://example.com/foto-lama.jpg",
      media: [{ id: "m-1", url: "https://example.com/foto-lama.jpg", type: "IMAGE", property_id: propertyId, created_at: new Date() }],
      room_types: [],
    } as unknown as Awaited<ReturnType<typeof prisma.property.findUnique>>);

    vi.mocked(prisma.property.update).mockImplementation(async (args) => {
      const data = args.data as Record<string, unknown>;
      return {
        id: propertyId,
        ...data,
        media: [],
        room_types: [],
      } as unknown as Awaited<ReturnType<typeof prisma.property.update>>;
    });

    const newImageUrl = "https://example.com/foto-profil-baru.jpg";
    const request = new NextRequest(
      `http://localhost:3000/api/admin/properties/${propertyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({
          image_url: newImageUrl,
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: propertyId }),
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.image_url).toBe(newImageUrl);

    // Pastikan updateData TIDAK menyertakan media.create jika payload tidak menyertakan media
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: propertyId },
        data: expect.not.objectContaining({
          media: expect.anything(),
        }),
      })
    );
  });
});
