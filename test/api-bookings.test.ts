import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../src/app/api/bookings/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("POST /api/bookings", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Sukses", () => {
    it("berhasil membuat booking baru dengan status PENDING, mengurangi available_rooms sebanyak 1, dan mengembalikan bookingId dengan status 201", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Kos 1",
          whatsapp_number: "081122334455",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Melati Mewah",
          price_per_month: 1200000,
          available_rooms: 3,
          gender_type: "PUTRI",
          facilities: "AC, WiFi, Kamar Mandi Dalam",
          owner_id: owner.id,
        },
      });

      const payload = {
        propertyId: property.id,
        studentName: "Budi Santoso",
        waNumber: "081234567890",
        moveInDate: "2026-09-10",
      };

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Booking berhasil dibuat");
      expect(result.data).toBeDefined();
      expect(result.data.bookingId).toBeDefined();

      // Verifikasi di database tabel Booking
      const createdBooking = await prisma.booking.findUnique({
        where: { id: result.data.bookingId },
      });
      expect(createdBooking).toBeDefined();
      expect(createdBooking?.student_name).toBe("Budi Santoso");
      expect(createdBooking?.student_whatsapp).toBe("081234567890");
      expect(createdBooking?.property_id).toBe(property.id);
      expect(createdBooking?.status).toBe("PENDING");
      expect(createdBooking?.move_in_date).toEqual(new Date("2026-09-10"));

      // Verifikasi di database tabel Property (available_rooms berkurang 1: 3 -> 2)
      const updatedProperty = await prisma.property.findUnique({
        where: { id: property.id },
      });
      expect(updatedProperty?.available_rooms).toBe(2);
    });
  });

  describe("Skenario Validasi & Gagal (400)", () => {
    it("menolak request (400) jika payload body tidak ada atau tidak valid JSON", async () => {
      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("menolak request (400) jika data wajib (propertyId, studentName, waNumber, moveInDate) tidak lengkap atau kosong", async () => {
      const testCases = [
        { studentName: "Budi", waNumber: "081234", moveInDate: "2026-09-10" }, // missing propertyId
        { propertyId: "prop-1", waNumber: "081234", moveInDate: "2026-09-10" }, // missing studentName
        { propertyId: "prop-1", studentName: "Budi", moveInDate: "2026-09-10" }, // missing waNumber
        { propertyId: "prop-1", studentName: "Budi", waNumber: "081234" }, // missing moveInDate
        { propertyId: "   ", studentName: "Budi", waNumber: "081234", moveInDate: "2026-09-10" }, // empty string propertyId
      ];

      for (const payload of testCases) {
        const request = new Request("http://localhost/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
      }
    });

    it("menolak request (400) jika format moveInDate tidak valid", async () => {
      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          studentName: "Budi",
          waNumber: "081234567890",
          moveInDate: "tanggal-ngawur",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Format tanggal moveInDate tidak valid");
    });

    it("menolak request (400) jika format waNumber tidak valid (mengandung huruf, terlalu pendek/panjang, atau format salah)", async () => {
      const invalidNumbers = [
        "0812abcd3456", // mengandung huruf
        "08123",        // terlalu pendek
        "1234567890",   // tidak diawali 08, 628, atau +628
        "abcdefghijk",  // hanya huruf
        "0812345678901234", // terlalu panjang (>13 digit dari 08)
      ];

      for (const invalidWa of invalidNumbers) {
        const request = new Request("http://localhost/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: "prop-1",
            studentName: "Budi",
            waNumber: invalidWa,
            moveInDate: "2026-09-10",
          }),
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Format nomor WhatsApp tidak valid");
      }
    });

    it("menolak request (400) jika properti tidak ditemukan", async () => {
      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "non-existent-prop-id",
          studentName: "Budi",
          waNumber: "081234567890",
          moveInDate: "2026-09-10",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Kamar sudah penuh atau tidak ditemukan");
    });

    it("memblokir pesanan (400) jika available_rooms pada properti sudah 0 untuk mencegah kamar minus", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Kos Penuh",
          whatsapp_number: "089988776655",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Penuh",
          price_per_month: 800000,
          available_rooms: 0,
          gender_type: "PUTRA",
          facilities: "Kasur",
          owner_id: owner.id,
        },
      });

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          studentName: "Budi",
          waNumber: "0812345678",
          moveInDate: "2026-09-10",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Kamar sudah penuh atau tidak ditemukan");

      // Pastikan available_rooms tetap 0 dan tidak bertambah baris di booking
      const checkProperty = await prisma.property.findUnique({
        where: { id: property.id },
      });
      expect(checkProperty?.available_rooms).toBe(0);

      const countBookings = await prisma.booking.count({
        where: { property_id: property.id },
      });
      expect(countBookings).toBe(0);
    });
  });

  describe("Skenario Error Server (500)", () => {
    it("mengembalikan status 500 ketika terjadi unexpected error saat transaksi", async () => {
      vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-id",
          studentName: "Budi",
          waNumber: "081234567890",
          moveInDate: "2026-09-10",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Terjadi kesalahan internal pada server");
    });
  });
});
