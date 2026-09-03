import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../src/app/api/magic-link/update/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("POST /api/magic-link/update", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("berhasil memperbarui available_rooms dan updated_at di database, serta menandai is_used menjadi true", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Ratna",
        whatsapp_number: "628123456789",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Mawar Indah",
        price_per_month: 850000,
        available_rooms: 5,
        gender_type: "PUTRI",
        facilities: "WiFi, Kasur",
        owner_id: owner.id,
      },
    });

    const token = "valid-magic-link-token-123";
    await prisma.magicLink.create({
      data: {
        token,
        owner_id: owner.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam ke depan
        is_used: false,
      },
    });

    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: 2,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Data kamar berhasil diperbarui.");

    // Verifikasi perubahan di database SQLite
    const updatedProperty = await prisma.property.findUnique({
      where: { id: property.id },
    });
    expect(updatedProperty).not.toBeNull();
    expect(updatedProperty?.available_rooms).toBe(2);
    expect(updatedProperty?.updated_at).toBeInstanceOf(Date);

    const updatedMagicLink = await prisma.magicLink.findUnique({
      where: { token },
    });
    expect(updatedMagicLink).not.toBeNull();
    expect(updatedMagicLink?.is_used).toBe(true);
  });

  it("menolak request (400) jika availableRooms bernilai negatif", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Pak Budi",
        whatsapp_number: "628987654321",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Budi Sentosa",
        price_per_month: 700000,
        available_rooms: 3,
        gender_type: "PUTRA",
        facilities: "WiFi",
        owner_id: owner.id,
      },
    });

    const token = "token-negative-test";
    await prisma.magicLink.create({
      data: {
        token,
        owner_id: owner.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: false,
      },
    });

    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: -1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Jumlah kamar tidak valid");

    // Pastikan data di database tidak berubah
    const unchangedProperty = await prisma.property.findUnique({
      where: { id: property.id },
    });
    expect(unchangedProperty?.available_rooms).toBe(3);
  });

  it("menolak request (401) jika menggunakan token yang sudah pernah di-submit sebelumnya (mencegah double-submit)", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Siti",
        whatsapp_number: "6281122334455",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Siti Nyaman",
        price_per_month: 900000,
        available_rooms: 1,
        gender_type: "CAMPUR",
        facilities: "AC",
        owner_id: owner.id,
      },
    });

    const token = "token-already-used";
    await prisma.magicLink.create({
      data: {
        token,
        owner_id: owner.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: true, // Sudah pernah digunakan
      },
    });

    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: 0,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token sudah pernah digunakan");
  });

  it("menolak request (401) jika token sudah kedaluwarsa", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Pak Joko",
        whatsapp_number: "6285566778899",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Joko Sejahtera",
        price_per_month: 1000000,
        available_rooms: 4,
        gender_type: "PUTRA",
        facilities: "Kamar Mandi Dalam",
        owner_id: owner.id,
      },
    });

    const token = "token-expired";
    await prisma.magicLink.create({
      data: {
        token,
        owner_id: owner.id,
        expires_at: new Date(Date.now() - 1000), // Kedaluwarsa 1 detik lalu
        is_used: false,
      },
    });

    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: 2,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token sudah kedaluwarsa");
  });

  it("mengembalikan status 404 jika token tidak ditemukan / fiktif", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "token-fiktif-12345",
        propertyId: "property-id-fiktif",
        availableRooms: 3,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token tidak ditemukan");
  });

  it("mengembalikan status 400 jika field token atau propertyId kosong", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "",
        propertyId: "some-property-id",
        availableRooms: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Token wajib diisi");
  });

  it("mengembalikan status 400 jika format request body bukan JSON yang valid", async () => {
    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "bukan json valid",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Format request body tidak valid");
  });

  it("mengembalikan status 404 jika properti bukan milik owner dari token yang digunakan", async () => {
    const ownerA = await prisma.owner.create({
      data: {
        name: "Owner A",
        whatsapp_number: "628100000001",
      },
    });

    const ownerB = await prisma.owner.create({
      data: {
        name: "Owner B",
        whatsapp_number: "628100000002",
      },
    });

    const propertyB = await prisma.property.create({
      data: {
        name: "Kos Milik Owner B",
        price_per_month: 800000,
        available_rooms: 2,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        owner_id: ownerB.id,
      },
    });

    const tokenOwnerA = "token-milik-owner-a";
    await prisma.magicLink.create({
      data: {
        token: tokenOwnerA,
        owner_id: ownerA.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: false,
      },
    });

    const request = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenOwnerA,
        propertyId: propertyB.id,
        availableRooms: 5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Properti tidak ditemukan untuk pemilik token ini");
  });

  it("mencegah race condition ketika dua request dengan token yang sama dieksekusi secara bersamaan (Optimistic Concurrency Control)", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Concurrency",
        whatsapp_number: "628999888777",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Concurrency Safe",
        price_per_month: 950000,
        available_rooms: 10,
        gender_type: "CAMPUR",
        facilities: "WiFi, Parkir",
        owner_id: owner.id,
      },
    });

    const token = "token-concurrent-test";
    await prisma.magicLink.create({
      data: {
        token,
        owner_id: owner.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: false,
      },
    });

    const req1 = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: 5,
      }),
    });

    const req2 = new Request("http://localhost:3000/api/magic-link/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: property.id,
        availableRooms: 3,
      }),
    });

    // Jalankan kedua request secara konkuren
    const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);
    const statuses = [res1.status, res2.status];

    // Tepat satu request harus sukses (200) dan satu harus gagal (401)
    expect(statuses).toContain(200);
    expect(statuses).toContain(401);

    const successfulRes = res1.status === 200 ? res1 : res2;
    const failedRes = res1.status === 401 ? res1 : res2;

    const successData = await successfulRes.json();
    const failedData = await failedRes.json();

    expect(successData.success).toBe(true);
    expect(failedData.success).toBe(false);
    expect(failedData.error).toBe("Token sudah pernah digunakan");

    // Pastikan token berstatus is_used: true
    const finalMagicLink = await prisma.magicLink.findUnique({
      where: { token },
    });
    expect(finalMagicLink?.is_used).toBe(true);
  });
});
