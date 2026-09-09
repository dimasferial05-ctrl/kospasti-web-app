import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../src/app/api/bookings/[id]/pay/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("POST /api/bookings/[id]/pay", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengubah status booking dari PENDING menjadi PAID dan mencetak log simulasi WhatsApp", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const owner = await prisma.owner.create({
        data: {
          name: "Ibu Siti",
          whatsapp_number: "081234567890",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Melati Nyaman",
          price_per_month: 850000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          student_name: "Ahmad Dahlan",
          student_whatsapp: "089876543210",
          move_in_date: new Date("2026-10-01"),
          status: "PENDING",
        },
      });

      const request = new Request(`http://localhost/api/bookings/${booking.id}/pay`, {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: booking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Pembayaran berhasil dikonfirmasi");
      expect(result.data.status).toBe("PAID");

      // Verifikasi di database
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking?.status).toBe("PAID");

      // Verifikasi simulasi WhatsApp tercetak di log
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[SIMULASI WA] Mengirim pesan ke 081234567890:")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Ahmad Dahlan")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Ibu Siti")
      );
    });
  });

  describe("Skenario Tidak Ditemukan (404)", () => {
    it("mengembalikan status 404 ketika booking ID tidak ditemukan", async () => {
      const request = new Request("http://localhost/api/bookings/random-uuid/pay", {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "random-uuid" }),
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Booking tidak ditemukan");
    });
  });

  describe("Skenario Status Tidak Valid (400)", () => {
    it("mengembalikan status 400 jika status booking sudah PAID", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Bapak Joko",
          whatsapp_number: "08111222333",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Garuda Putra",
          price_per_month: 600000,
          available_rooms: 1,
          gender_type: "PUTRA",
          facilities: "Kipas, Kasur",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          student_name: "Rian",
          student_whatsapp: "08222333444",
          move_in_date: new Date("2026-10-01"),
          status: "PAID",
        },
      });

      const request = new Request(`http://localhost/api/bookings/${booking.id}/pay`, {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: booking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Pembayaran sudah dilakukan sebelumnya");
    });

    it("mengembalikan status 400 jika status booking CANCELLED", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Bapak Joko",
          whatsapp_number: "08111222333",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Garuda Putra",
          price_per_month: 600000,
          available_rooms: 1,
          gender_type: "PUTRA",
          facilities: "Kipas, Kasur",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          student_name: "Rian",
          student_whatsapp: "08222333444",
          move_in_date: new Date("2026-10-01"),
          status: "CANCELLED",
        },
      });

      const request = new Request(`http://localhost/api/bookings/${booking.id}/pay`, {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: booking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Status booking tidak valid");
    });

    it("mengembalikan status 400 jika ID booking kosong", async () => {
      const request = new Request("http://localhost/api/bookings//pay", {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "" }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe("ID booking diperlukan");
    });
  });

  describe("Skenario Error Server (500)", () => {
    it("mengembalikan status 500 ketika terjadi kegagalan database", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockRejectedValueOnce(
        new Error("Database connection error")
      );

      const request = new Request("http://localhost/api/bookings/booking-1/pay", {
        method: "POST",
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "booking-1" }),
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Gagal mengonfirmasi pembayaran");
    });
  });
});
