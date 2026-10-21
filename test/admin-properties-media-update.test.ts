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

describe("Admin Properties Media Update & detectMediaType Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. berkas src/app/api/admin/properties/[id]/route.ts harus mengimpor detectMediaType dari @/lib/upload", () => {
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

    // Verifikasi impor detectMediaType dari upload
    expect(content).toMatch(/import\s*\{[^}]*detectMediaType[^}]*\}\s*from\s*["']@\/lib\/upload["']/);
  });

  it("2. endpoint PATCH /api/admin/properties/[id] berhasil memperbarui image_url baru tanpa ReferenceError detectMediaType", async () => {
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

    // Pastikan media baru dibuat dengan type IMAGE menggunakan detectMediaType
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
});
