import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/properties/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("GET /api/properties", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil data properti dengan status 200 dan format array di dalam data", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Bambang",
          whatsapp_number: "6281234567890",
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Mawar Putra",
          price_per_month: 850000,
          available_rooms: 3,
          gender_type: "PUTRA",
          facilities: "WiFi, Kasur",
          owner_id: owner.id,
        },
      });

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(1);

      const property = result.data[0];
      expect(property.name).toBe("Kos Mawar Putra");
      expect(property.price_per_month).toBe(850000);
      expect(property.available_rooms).toBe(3);
      expect(property.gender_type).toBe("PUTRA");
      expect(property.facilities).toBe("WiFi, Kasur");
      expect(property.last_updated).toBeDefined();
      expect(property.owner).toBeDefined();
      expect(property.owner.name).toBe("Pak Bambang");
      // Memastikan nomor WA tidak terekspos
      expect(property.owner.whatsapp_number).toBeUndefined();
    });

    it("mengembalikan data kosong dengan array kosong jika belum ada properti", async () => {
      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it("mengurutkan properti berdasarkan last_updated terbaru ke terlama (descending)", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Bu Sri",
          whatsapp_number: "6281987654321",
        },
      });

      // Buat properti pertama (lebih lama)
      const prop1 = await prisma.property.create({
        data: {
          name: "Kos Melati 1 (Lama)",
          price_per_month: 700000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "WiFi",
          owner_id: owner.id,
        },
      });

      // Buat properti kedua (lebih baru)
      const prop2 = await prisma.property.create({
        data: {
          name: "Kos Melati 2 (Menengah)",
          price_per_month: 800000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "WiFi, AC",
          owner_id: owner.id,
        },
      });

      // Update prop1 agar tanggal updated_at menjadi paling baru
      await new Promise((resolve) => setTimeout(resolve, 50));
      await prisma.property.update({
        where: { id: prop1.id },
        data: {
          available_rooms: 4,
          updated_at: new Date(Date.now() + 5000),
        },
      });

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      // prop1 harus menjadi objek pertama karena updated_at paling baru
      expect(result.data[0].id).toBe(prop1.id);
      expect(result.data[0].name).toBe("Kos Melati 1 (Lama)");
      expect(result.data[1].id).toBe(prop2.id);
      expect(result.data[1].name).toBe("Kos Melati 2 (Menengah)");

      const time1 = new Date(result.data[0].last_updated).getTime();
      const time2 = new Date(result.data[1].last_updated).getTime();
      expect(time1).toBeGreaterThan(time2);
    });

    describe("Penyaringan (Filtering)", () => {
      let ownerId: string;

      beforeEach(async () => {
        const owner = await prisma.owner.create({
          data: {
            name: "Ibu Hajah",
            whatsapp_number: "628999888777",
          },
        });
        ownerId = owner.id;

        await prisma.property.createMany({
          data: [
            {
              name: "Kos Mawar Putra",
              price_per_month: 500000,
              available_rooms: 2,
              gender_type: "PUTRA",
              facilities: "Kasur",
              owner_id: ownerId,
            },
            {
              name: "Kos Mawar Putri Indah",
              price_per_month: 800000,
              available_rooms: 4,
              gender_type: "PUTRI",
              facilities: "WiFi, Kasur",
              owner_id: ownerId,
            },
            {
              name: "Kos Melati Campur Exclusive",
              price_per_month: 1200000,
              available_rooms: 1,
              gender_type: "CAMPUR",
              facilities: "AC, WiFi, Kasur",
              owner_id: ownerId,
            },
          ],
        });
      });

      it("menyaring kos berdasarkan nama secara parsial (?name=mawar)", async () => {
        const request = new Request("http://localhost:3000/api/properties?name=mawar");
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(2);
        expect(result.data.every((p: { name: string }) => p.name.toLowerCase().includes("mawar"))).toBe(true);
      });

      it("menyaring kos berdasarkan batas harga tertinggi (?maxPrice=800000)", async () => {
        const request = new Request("http://localhost:3000/api/properties?maxPrice=800000");
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(2);
        expect(result.data.every((p: { price_per_month: number }) => p.price_per_month <= 800000)).toBe(true);
      });

      it("menyaring kos berdasarkan tipe gender (?genderType=PUTRI)", async () => {
        const request = new Request("http://localhost:3000/api/properties?genderType=PUTRI");
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Kos Mawar Putri Indah");
        expect(result.data[0].gender_type).toBe("PUTRI");
      });

      it("tidak menyaring tipe gender jika ?genderType=ALL", async () => {
        const request = new Request("http://localhost:3000/api/properties?genderType=ALL");
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(3);
      });

      it("menggabungkan beberapa parameter sekaligus (?name=mawar&maxPrice=600000&genderType=PUTRA)", async () => {
        const request = new Request(
          "http://localhost:3000/api/properties?name=mawar&maxPrice=600000&genderType=PUTRA"
        );
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Kos Mawar Putra");
        expect(result.data[0].price_per_month).toBe(500000);
        expect(result.data[0].gender_type).toBe("PUTRA");
      });

      it("mengabaikan maxPrice jika input bukan angka valid", async () => {
        const request = new Request("http://localhost:3000/api/properties?maxPrice=abc");
        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.data).toHaveLength(3);
      });
    });
  });

  describe("Skenario Gagal", () => {
    it("mengembalikan status 500 jika terjadi kesalahan database internal", async () => {
      vi.spyOn(prisma.property, "findMany").mockRejectedValueOnce(new Error("Database connection lost"));

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Gagal mengambil data properti");
    });
  });
});
