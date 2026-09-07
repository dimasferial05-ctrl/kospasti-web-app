import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../src/app/api/admin/owners/route";
import { PATCH, DELETE } from "../src/app/api/admin/owners/[id]/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/owners", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/owners", {
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
      const request = new NextRequest("http://localhost:3000/api/admin/owners");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil seluruh daftar pemilik kos beserta jumlah properti dan diurutkan created_at desc", async () => {
      const owner1 = await prisma.owner.create({
        data: {
          name: "Ibu Sri Wahyuni",
          whatsapp_number: "081298765432",
          created_at: new Date("2026-01-01T10:00:00Z"),
        },
      });

      const owner2 = await prisma.owner.create({
        data: {
          name: "Pak Hendra Gunawan",
          whatsapp_number: "081234567890",
          created_at: new Date("2026-01-02T10:00:00Z"),
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Melati 1",
          price_per_month: 1000000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Melati 2",
          price_per_month: 1200000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "AC, WiFi, Kamar Mandi Dalam",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Sejahtera",
          price_per_month: 800000,
          available_rooms: 4,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          owner_id: owner2.id,
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Urutan desc berdasarkan created_at: Pak Hendra (owner2) lalu Ibu Sri (owner1)
      expect(result.data[0].id).toBe(owner2.id);
      expect(result.data[0].name).toBe("Pak Hendra Gunawan");
      expect(result.data[0].whatsapp_number).toBe("081234567890");
      expect(result.data[0]._count.properties).toBe(1);

      expect(result.data[1].id).toBe(owner1.id);
      expect(result.data[1].name).toBe("Ibu Sri Wahyuni");
      expect(result.data[1].whatsapp_number).toBe("081298765432");
      expect(result.data[1]._count.properties).toBe(2);
    });

    it("mengembalikan array kosong jika belum ada data pemilik kos", async () => {
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
      vi.spyOn(prisma.owner, "findMany").mockRejectedValueOnce(
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

describe("POST /api/admin/owners", () => {
  const createAuthorizedRequest = (body: any) => {
    return new NextRequest("http://localhost:3000/api/admin/owners", {
      method: "POST",
      headers: {
        cookie: "admin_token=kospasti_admin_authenticated",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 jika tanpa autentikasi", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/owners", {
        method: "POST",
        body: JSON.stringify({ name: "Pak Budi", whatsapp_number: "08111111111" }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe("Skenario Validasi Input", () => {
    it("mengembalikan status 400 jika nama kosong", async () => {
      const request = createAuthorizedRequest({ name: "", whatsapp_number: "08111111111" });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain("Nama pemilik wajib diisi");
    });

    it("mengembalikan status 400 jika nomor whatsapp kosong", async () => {
      const request = createAuthorizedRequest({ name: "Pak Budi", whatsapp_number: "" });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain("Nomor WhatsApp wajib diisi");
    });
  });

  describe("Skenario Duplikasi (409 Conflict)", () => {
    it("mengembalikan status 409 jika nomor WhatsApp sudah terdaftar", async () => {
      await prisma.owner.create({
        data: {
          name: "Ibu Nur",
          whatsapp_number: "081234567890",
        },
      });

      const request = createAuthorizedRequest({
        name: "Pak Budi",
        whatsapp_number: "081234567890",
      });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.error).toContain("Nomor WhatsApp sudah terdaftar");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil menambahkan pemilik baru dengan status 201", async () => {
      const request = createAuthorizedRequest({
        name: "  Pak Joko Widodo  ",
        whatsapp_number: "  089876543210  ",
      });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Pak Joko Widodo");
      expect(result.data.whatsapp_number).toBe("089876543210");

      const savedOwner = await prisma.owner.findUnique({
        where: { id: result.data.id },
      });
      expect(savedOwner).not.toBeNull();
      expect(savedOwner?.name).toBe("Pak Joko Widodo");
    });
  });
});

describe("PATCH /api/admin/owners/[id]", () => {
  const createAuthorizedRequest = (id: string, body: any) => {
    return new NextRequest(`http://localhost:3000/api/admin/owners/${id}`, {
      method: "PATCH",
      headers: {
        cookie: "admin_token=kospasti_admin_authenticated",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan 401 jika token tidak valid", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/owners/id-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Baru" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "id-1" }) });
      expect(response.status).toBe(401);
    });
  });

  describe("Skenario 404 Not Found & Validasi", () => {
    it("mengembalikan 404 jika pemilik tidak ditemukan", async () => {
      const request = createAuthorizedRequest("non-existent-id", { name: "Nama Baru" });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      expect(response.status).toBe(404);
    });

    it("mengembalikan 400 jika tidak ada data yang diubah", async () => {
      const owner = await prisma.owner.create({
        data: { name: "Ibu Nina", whatsapp_number: "0812341234" },
      });
      const request = createAuthorizedRequest(owner.id, {});
      const response = await PATCH(request, { params: Promise.resolve({ id: owner.id }) });
      expect(response.status).toBe(400);
    });

    it("mengembalikan 409 jika nomor WhatsApp diubah menjadi nomor yang sudah dipakai owner lain", async () => {
      const owner1 = await prisma.owner.create({
        data: { name: "Ibu Nina", whatsapp_number: "08111111" },
      });
      const owner2 = await prisma.owner.create({
        data: { name: "Pak Rudi", whatsapp_number: "08222222" },
      });

      const request = createAuthorizedRequest(owner1.id, { whatsapp_number: "08222222" });
      const response = await PATCH(request, { params: Promise.resolve({ id: owner1.id }) });
      expect(response.status).toBe(409);
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengupdate nama dan nomor WhatsApp", async () => {
      const owner = await prisma.owner.create({
        data: { name: "Ibu Nina", whatsapp_number: "08111111" },
      });

      const request = createAuthorizedRequest(owner.id, {
        name: "Ibu Nina Updated",
        whatsapp_number: "08999999",
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: owner.id }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Ibu Nina Updated");
      expect(result.data.whatsapp_number).toBe("08999999");
    });
  });
});

describe("DELETE /api/admin/owners/[id]", () => {
  const createAuthorizedRequest = (id: string) => {
    return new NextRequest(`http://localhost:3000/api/admin/owners/${id}`, {
      method: "DELETE",
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
    it("mengembalikan 401 jika token tidak valid", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/owners/id-1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "id-1" }) });
      expect(response.status).toBe(401);
    });
  });

  describe("Skenario 404 Not Found", () => {
    it("mengembalikan 404 jika pemilik tidak ditemukan", async () => {
      const request = createAuthorizedRequest("non-existent-id");
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("Skenario Sukses (Cascade Delete)", () => {
    it("berhasil menghapus pemilik dan cascade menghapus properti miliknya", async () => {
      const owner = await prisma.owner.create({
        data: { name: "Pak Bambang", whatsapp_number: "08555555" },
      });

      const prop = await prisma.property.create({
        data: {
          name: "Kos Bambang",
          price_per_month: 900000,
          available_rooms: 3,
          gender_type: "PUTRA",
          facilities: "Kasur",
          owner_id: owner.id,
        },
      });

      const request = createAuthorizedRequest(owner.id);
      const response = await DELETE(request, { params: Promise.resolve({ id: owner.id }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      const checkOwner = await prisma.owner.findUnique({ where: { id: owner.id } });
      expect(checkOwner).toBeNull();

      const checkProp = await prisma.property.findUnique({ where: { id: prop.id } });
      expect(checkProp).toBeNull();
    });
  });
});
