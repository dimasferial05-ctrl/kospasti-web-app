import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("Booking Model / API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Sukses", () => {
    it("berhasil membuat pengajuan Booking baru dengan status default PENDING", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Booking Test",
          whatsapp_number: "628555666777",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Dekat Kampus",
          price_per_month: 850000,
          available_rooms: 3,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          owner_id: owner.id,
        },
      });

      const moveInDate = new Date();
      moveInDate.setDate(moveInDate.getDate() + 7);

      const booking = await prisma.booking.create({
        data: {
          student_name: "Ahmad Mahasiswa",
          student_whatsapp: "628999000111",
          move_in_date: moveInDate,
          property_id: property.id,
        },
      });

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.status).toBe("PENDING");
      expect(booking.student_name).toBe("Ahmad Mahasiswa");
      expect(booking.property_id).toBe(property.id);
      expect(booking.created_at).toBeInstanceOf(Date);
      expect(booking.updated_at).toBeInstanceOf(Date);
    });

    it("berhasil mengubah status pengajuan Booking (contoh: PENDING menjadi APPROVED atau REJECTED)", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Status Test",
          whatsapp_number: "628666777888",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Anggrek",
          price_per_month: 950000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "WiFi, Lemari",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          student_name: "Dewi Lestari",
          student_whatsapp: "628777888999",
          move_in_date: new Date(),
          property_id: property.id,
        },
      });

      expect(booking.status).toBe("PENDING");

      const approvedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "APPROVED" },
      });

      expect(approvedBooking.status).toBe("APPROVED");

      const rejectedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "REJECTED" },
      });

      expect(rejectedBooking.status).toBe("REJECTED");
    });
  });

  describe("Skenario Gagal (Edge Cases)", () => {
    it("menolak pembuatan Booking jika property_id tidak valid/tidak ada di database", async () => {
      await expect(
        prisma.booking.create({
          data: {
            student_name: "Calon Penyewa",
            student_whatsapp: "628111999888",
            move_in_date: new Date(),
            property_id: "non-existent-property-999",
          },
        })
      ).rejects.toThrow();
    });
  });
});
