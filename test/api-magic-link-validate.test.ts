import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "../src/app/api/magic-link/validate/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("GET /api/magic-link/validate", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("mengembalikan status 400 jika query parameter token tidak diberikan", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/validate", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Parameter token diperlukan");
  });

  it("mengembalikan status 400 jika query parameter token hanya berupa whitespace", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/validate?token=%20%20", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Parameter token diperlukan");
  });

  it("mengembalikan status 404 jika token tidak ditemukan / fiktif", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/validate?token=token-fiktif-tidak-ada", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token tidak ditemukan");
  });

  it("mengembalikan status 401 jika token sudah pernah digunakan (is_used: true)", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Pak Bambang",
        whatsapp_number: "6281234567890",
      },
    });

    const token = "token-sudah-digunakan-123";
    await prisma.magicLink.create({
      data: {
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: true,
        owner_id: owner.id,
      },
    });

    const request = new Request(`http://localhost:3000/api/magic-link/validate?token=${token}`, {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token sudah pernah digunakan");
  });

  it("mengembalikan status 401 jika token sudah kedaluwarsa", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Sri",
        whatsapp_number: "6281987654321",
      },
    });

    const token = "token-kedaluwarsa-456";
    await prisma.magicLink.create({
      data: {
        token,
        expires_at: new Date(Date.now() - 60 * 1000), // 1 menit yang lalu
        is_used: false,
        owner_id: owner.id,
      },
    });

    const request = new Request(`http://localhost:3000/api/magic-link/validate?token=${token}`, {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token sudah kedaluwarsa");
  });

  it("mengembalikan status 200 dan data properti yang valid tanpa mengekspos data sensitif", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Bapak Hidayat",
        whatsapp_number: "6285712345678",
        properties: {
          create: [
            {
              name: "Kos Mawar Putra",
              price_per_month: 850000,
              available_rooms: 2,
              gender_type: "PUTRA",
              facilities: "WiFi, Kasur, Kamar Mandi Dalam",
            },
            {
              name: "Kos Melati Putri",
              price_per_month: 1200000,
              available_rooms: 0,
              gender_type: "PUTRI",
              facilities: "WiFi, AC",
            },
          ],
        },
      },
      include: {
        properties: true,
      },
    });

    const token = "token-valid-789";
    await prisma.magicLink.create({
      data: {
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: false,
        owner_id: owner.id,
      },
    });

    const request = new Request(`http://localhost:3000/api/magic-link/validate?token=${token}`, {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Token valid");
    expect(data.data).toBeDefined();
    expect(data.data.ownerName).toBe("Bapak Hidayat");
    expect(data.data.properties).toHaveLength(2);

    expect(data.data.properties[0]).toEqual({
      id: owner.properties[0].id,
      name: "Kos Mawar Putra",
      available_rooms: 2,
    });

    expect(data.data.properties[1]).toEqual({
      id: owner.properties[1].id,
      name: "Kos Melati Putri",
      available_rooms: 0,
    });

    // Pastikan nomor WhatsApp atau data sensitif owner tidak terekspos di response
    expect(data.data.whatsapp_number).toBeUndefined();
    expect(data.data.ownerWhatsapp).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("6285712345678");
  });
});
