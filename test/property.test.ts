import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("Property Model / API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Sukses", () => {
    it("berhasil membuat Property baru yang terhubung ke owner_id yang valid", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Kos 1",
          whatsapp_number: "628111222333",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Nyaman Sentosa",
          price_per_month: 900000,
          available_rooms: 4,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur, Kamar Mandi Dalam",
          owner_id: owner.id,
        },
      });

      expect(property).toBeDefined();
      expect(property.id).toBeDefined();
      expect(property.owner_id).toBe(owner.id);
      expect(property.name).toBe("Kos Nyaman Sentosa");
      expect(property.available_rooms).toBe(4);
    });

    it("berhasil melakukan update pada detail Property", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Kos 2",
          whatsapp_number: "628222333444",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Asri Putri",
          price_per_month: 1000000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner.id,
        },
      });

      const updatedProperty = await prisma.property.update({
        where: { id: property.id },
        data: {
          available_rooms: 0,
          price_per_month: 1100000,
        },
      });

      expect(updatedProperty.available_rooms).toBe(0);
      expect(updatedProperty.price_per_month).toBe(1100000);
    });

    it("uji relasi cascade: menghapus Owner akan menghapus seluruh data Property miliknya", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Kos 3",
          whatsapp_number: "628333444555",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Melati",
          price_per_month: 800000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "WiFi",
          owner_id: owner.id,
        },
      });

      // Delete the owner
      await prisma.owner.delete({
        where: { id: owner.id },
      });

      // Verify property is deleted
      const foundProperty = await prisma.property.findUnique({
        where: { id: property.id },
      });

      expect(foundProperty).toBeNull();
    });
  });

  describe("Skenario Gagal (Edge Cases)", () => {
    it("gagal membuat Property jika owner_id tidak ditemukan", async () => {
      await expect(
        prisma.property.create({
          data: {
            name: "Kos Tanpa Owner Valid",
            price_per_month: 750000,
            available_rooms: 1,
            gender_type: "PUTRA",
            facilities: "Kasur",
            owner_id: "non-existent-owner-id-12345",
          },
        })
      ).rejects.toThrow();
    });

    it("gagal membuat Property jika data wajib kosong", async () => {
      await expect(
        prisma.property.create({
          data: {
            name: "Kos Tanpa Fasilitas & Harga",
          } as any,
        })
      ).rejects.toThrow();
    });
  });
});
