import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("Owner Model / API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Sukses", () => {
    it("berhasil membuat profil Owner baru", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Budi Santoso",
          whatsapp_number: "6281122334455",
        },
      });

      expect(owner).toBeDefined();
      expect(owner.id).toBeDefined();
      expect(owner.name).toBe("Budi Santoso");
      expect(owner.whatsapp_number).toBe("6281122334455");
      expect(owner.created_at).toBeInstanceOf(Date);
      expect(owner.updated_at).toBeInstanceOf(Date);
    });

    it("berhasil mengambil detail data Owner berdasarkan id", async () => {
      const createdOwner = await prisma.owner.create({
        data: {
          name: "Siti Rahma",
          whatsapp_number: "6289988776655",
        },
      });

      const foundOwner = await prisma.owner.findUnique({
        where: { id: createdOwner.id },
      });

      expect(foundOwner).not.toBeNull();
      expect(foundOwner?.id).toBe(createdOwner.id);
      expect(foundOwner?.name).toBe("Siti Rahma");
    });
  });

  describe("Skenario Gagal (Edge Cases)", () => {
    it("menolak pembuatan Owner baru jika whatsapp_number sudah terdaftar (Unique Constraint)", async () => {
      await prisma.owner.create({
        data: {
          name: "Owner Pertama",
          whatsapp_number: "628123456789",
        },
      });

      await expect(
        prisma.owner.create({
          data: {
            name: "Owner Kedua",
            whatsapp_number: "628123456789", // Duplicate whatsapp
          },
        })
      ).rejects.toThrow();
    });

    it("menolak pembuatan Owner jika data wajib tidak lengkap", async () => {
      await expect(
        prisma.owner.create({
          data: {
            name: "Owner Tanpa WA",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        })
      ).rejects.toThrow();
    });
  });
});
