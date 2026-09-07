import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../src/app/api/admin/properties/route";
import { PATCH } from "../src/app/api/admin/properties/[id]/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/properties", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/properties", {
      headers: {
        cookie: "admin_token=kospasti_admin_authenticated",
      },
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak disertakan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/properties");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil seluruh properti beserta relasi owner (termasuk whatsapp_number) diurutkan berdasarkan nama saat terautentikasi", async () => {
      const owner1 = await prisma.owner.create({
        data: {
          name: "Ibu Rahayu",
          whatsapp_number: "081234567890",
        },
      });

      const owner2 = await prisma.owner.create({
        data: {
          name: "Pak Bambang",
          whatsapp_number: "089876543210",
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Bunga Melati",
          price_per_month: 900000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Anggrek Nyaman",
          price_per_month: 800000,
          available_rooms: 0,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          owner_id: owner2.id,
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Pastikan urutan berdasarkan nama 'asc' (Kos Anggrek Nyaman duluan daripada Kos Bunga Melati)
      expect(result.data[0].name).toBe("Kos Anggrek Nyaman");
      expect(result.data[0].owner.id).toBe(owner2.id);
      expect(result.data[0].owner.name).toBe("Pak Bambang");
      expect(result.data[0].owner.whatsapp_number).toBe("089876543210");
      expect(result.data[0].available_rooms).toBe(0);

      expect(result.data[1].name).toBe("Kos Bunga Melati");
      expect(result.data[1].owner.id).toBe(owner1.id);
      expect(result.data[1].owner.name).toBe("Ibu Rahayu");
      expect(result.data[1].owner.whatsapp_number).toBe("081234567890");
      expect(result.data[1].available_rooms).toBe(2);
    });

    it("mengembalikan array kosong jika belum ada data kos di database", async () => {
      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Skenario Gagal / Error Database", () => {
    it("mengembalikan status 500 jika terjadi kesalahan query database", async () => {
      vi.spyOn(prisma.property, "findMany").mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection lost");
    });
  });
});

describe("POST /api/admin/properties", () => {
  let validOwnerId: string;

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();

    const owner = await prisma.owner.create({
      data: {
        name: "Pemilik Test",
        whatsapp_number: "08123456789",
      },
    });
    validOwnerId = owner.id;
  });

  const createPostRequest = (body: Record<string, unknown>, authenticated = true) => {
    return new NextRequest("http://localhost:3000/api/admin/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authenticated ? { cookie: "admin_token=kospasti_admin_authenticated" } : {}),
      },
      body: JSON.stringify(body),
    });
  };

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak disertakan", async () => {
      const request = createPostRequest({ name: "Kos Baru" }, false);
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Validasi Input", () => {
    it("mengembalikan status 400 jika field wajib kosong atau format salah", async () => {
      // Missing name
      const req1 = createPostRequest({
        price_per_month: 1000000,
        available_rooms: 5,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        owner_id: validOwnerId,
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(400);

      // Invalid price
      const req2 = createPostRequest({
        name: "Kos Bagus",
        price_per_month: -50000,
        available_rooms: 5,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        owner_id: validOwnerId,
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(400);

      // Invalid available_rooms (<0)
      const req3 = createPostRequest({
        name: "Kos Bagus",
        price_per_month: 1000000,
        available_rooms: -1,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        owner_id: validOwnerId,
      });
      const res3 = await POST(req3);
      expect(res3.status).toBe(400);

      // Invalid gender_type
      const req4 = createPostRequest({
        name: "Kos Bagus",
        price_per_month: 1000000,
        available_rooms: 5,
        gender_type: "UNKNOWN",
        facilities: "WiFi",
        owner_id: validOwnerId,
      });
      const res4 = await POST(req4);
      expect(res4.status).toBe(400);

      // Non-existent owner_id
      const req5 = createPostRequest({
        name: "Kos Bagus",
        price_per_month: 1000000,
        available_rooms: 5,
        gender_type: "PUTRA",
        facilities: "WiFi, Kasur",
        owner_id: "non-existent-owner-id",
      });
      const res5 = await POST(req5);
      expect(res5.status).toBe(400);
      const res5Json = await res5.json();
      expect(res5Json.error).toContain("Pemilik kos (Owner) tidak ditemukan");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil membuat properti baru dan mengembalikan status 201", async () => {
      const payload = {
        name: "Kos Melati Mewah",
        price_per_month: 1500000,
        available_rooms: 3,
        gender_type: "PUTRI",
        facilities: "AC, WiFi, Kamar Mandi Dalam",
        image_url: "https://example.com/kos-melati.jpg",
        owner_id: validOwnerId,
      };

      const request = createPostRequest(payload);
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Kos Melati Mewah");
      expect(result.data.price_per_month).toBe(1500000);
      expect(result.data.available_rooms).toBe(3);
      expect(result.data.gender_type).toBe("PUTRI");
      expect(result.data.facilities).toBe("AC, WiFi, Kamar Mandi Dalam");
      expect(result.data.image_url).toBe("https://example.com/kos-melati.jpg");
      expect(result.data.owner_id).toBe(validOwnerId);
      expect(result.data.owner.name).toBe("Pemilik Test");

      // Verify in database
      const dbProp = await prisma.property.findUnique({
        where: { id: result.data.id },
      });
      expect(dbProp).not.toBeNull();
      expect(dbProp?.name).toBe("Kos Melati Mewah");
    });
  });

  describe("Skenario Gagal / Error Server", () => {
    it("mengembalikan status 500 jika terjadi kesalahan database saat membuat data", async () => {
      vi.spyOn(prisma.property, "create").mockRejectedValueOnce(
        new Error("Database transaction failed")
      );

      const payload = {
        name: "Kos Melati Mewah",
        price_per_month: 1500000,
        available_rooms: 3,
        gender_type: "PUTRI",
        facilities: "AC, WiFi",
        owner_id: validOwnerId,
      };

      const request = createPostRequest(payload);
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database transaction failed");
    });
  });
});

describe("PATCH /api/admin/properties/[id]", () => {
  let validOwnerId: string;
  let validPropertyId: string;

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();

    const owner = await prisma.owner.create({
      data: {
        name: "Pemilik Test Patch",
        whatsapp_number: "081299998888",
      },
    });
    validOwnerId = owner.id;

    const property = await prisma.property.create({
      data: {
        name: "Kos Awal",
        price_per_month: 1000000,
        available_rooms: 2,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        owner_id: validOwnerId,
      },
    });
    validPropertyId = property.id;
  });

  const createPatchRequest = (
    id: string,
    body: Record<string, unknown>,
    authenticated = true
  ) => {
    return new NextRequest(`http://localhost:3000/api/admin/properties/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authenticated ? { cookie: "admin_token=kospasti_admin_authenticated" } : {}),
      },
      body: JSON.stringify(body),
    });
  };

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak disertakan", async () => {
      const request = createPatchRequest(validPropertyId, { name: "Update" }, false);
      const response = await PATCH(request, { params: Promise.resolve({ id: validPropertyId }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Validasi & Not Found", () => {
    it("mengembalikan status 404 jika properti tidak ditemukan", async () => {
      const request = createPatchRequest("non-existent-id", { name: "Update Kos" });
      const response = await PATCH(request, { params: Promise.resolve({ id: "non-existent-id" }) });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Properti tidak ditemukan");
    });

    it("mengembalikan status 400 jika format field yang diperbarui tidak valid", async () => {
      // Empty name
      const req1 = createPatchRequest(validPropertyId, { name: "" });
      const res1 = await PATCH(req1, { params: Promise.resolve({ id: validPropertyId }) });
      expect(res1.status).toBe(400);

      // Invalid price
      const req2 = createPatchRequest(validPropertyId, { price_per_month: -100 });
      const res2 = await PATCH(req2, { params: Promise.resolve({ id: validPropertyId }) });
      expect(res2.status).toBe(400);

      // Invalid rooms
      const req3 = createPatchRequest(validPropertyId, { available_rooms: -5 });
      const res3 = await PATCH(req3, { params: Promise.resolve({ id: validPropertyId }) });
      expect(res3.status).toBe(400);

      // Invalid gender
      const req4 = createPatchRequest(validPropertyId, { gender_type: "INVALID" });
      const res4 = await PATCH(req4, { params: Promise.resolve({ id: validPropertyId }) });
      expect(res4.status).toBe(400);

      // Invalid owner
      const req5 = createPatchRequest(validPropertyId, { owner_id: "non-existent-owner" });
      const res5 = await PATCH(req5, { params: Promise.resolve({ id: validPropertyId }) });
      expect(res5.status).toBe(400);
      const res5Json = await res5.json();
      expect(res5Json.error).toContain("Pemilik kos (Owner) tidak ditemukan");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil memperbarui data properti dan mengembalikan status 200", async () => {
      const newOwner = await prisma.owner.create({
        data: {
          name: "Pemilik Baru",
          whatsapp_number: "087711223344",
        },
      });

      const updatePayload = {
        name: "Kos Awal Updated",
        price_per_month: 1250000,
        available_rooms: 4,
        gender_type: "PUTRA",
        facilities: "AC, Kasur, Lemari",
        image_url: "https://example.com/updated.jpg",
        owner_id: newOwner.id,
      };

      const request = createPatchRequest(validPropertyId, updatePayload);
      const response = await PATCH(request, { params: Promise.resolve({ id: validPropertyId }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Kos Awal Updated");
      expect(result.data.price_per_month).toBe(1250000);
      expect(result.data.available_rooms).toBe(4);
      expect(result.data.gender_type).toBe("PUTRA");
      expect(result.data.facilities).toBe("AC, Kasur, Lemari");
      expect(result.data.image_url).toBe("https://example.com/updated.jpg");
      expect(result.data.owner_id).toBe(newOwner.id);
      expect(result.data.owner.name).toBe("Pemilik Baru");

      // Verify in DB
      const updatedInDb = await prisma.property.findUnique({
        where: { id: validPropertyId },
      });
      expect(updatedInDb?.name).toBe("Kos Awal Updated");
      expect(updatedInDb?.price_per_month).toBe(1250000);
    });
  });

  describe("Skenario Gagal / Error Server", () => {
    it("mengembalikan status 500 jika terjadi kesalahan database pada saat update", async () => {
      vi.spyOn(prisma.property, "update").mockRejectedValueOnce(
        new Error("Database update error")
      );

      const request = createPatchRequest(validPropertyId, { name: "Kos Gagal" });
      const response = await PATCH(request, { params: Promise.resolve({ id: validPropertyId }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database update error");
    });
  });
});
