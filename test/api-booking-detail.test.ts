import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/bookings/[id]/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("GET /api/bookings/[id]", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil data booking kos reguler beserta rincian harganya", async () => {
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
          address: "Jl. Melati No. 10",
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

      const request = new Request(`http://localhost/api/bookings/${booking.id}`, {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: booking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(booking.id);
      expect(result.data.studentName).toBe("Ahmad Dahlan");
      expect(result.data.property.name).toBe("Kos Melati Nyaman");
      expect(result.data.roomType).toBeNull();
      expect(result.data.pricing.rentPrice).toBe(850000);
      expect(result.data.pricing.adminFee).toBe(5000);
      expect(result.data.pricing.totalPrice).toBe(855000);
    });

    it("berhasil mengambil data booking dengan tipe kamar spesifik beserta rincian harganya", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Bapak Budi",
          whatsapp_number: "081298765432",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Graha Mulia",
          price_per_month: 600000,
          available_rooms: 5,
          gender_type: "CAMPUR",
          facilities: "WiFi, Parkir",
          owner_id: owner.id,
        },
      });

      const roomType = await prisma.roomType.create({
        data: {
          name: "Tipe VIP King",
          price_per_month: 1200000,
          available_rooms: 2,
          property_id: property.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          room_type_id: roomType.id,
          student_name: "Dimas Ferial",
          student_whatsapp: "081234567899",
          move_in_date: new Date("2026-10-15"),
          status: "PENDING",
        },
      });

      const request = new Request(`http://localhost/api/bookings/${booking.id}`, {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: booking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.property.name).toBe("Kos Graha Mulia");
      expect(result.data.roomType.name).toBe("Tipe VIP King");
      expect(result.data.pricing.rentPrice).toBe(1200000);
      expect(result.data.pricing.adminFee).toBe(5000);
      expect(result.data.pricing.totalPrice).toBe(1205000);
    });
  });

  describe("Skenario Tidak Ditemukan (404)", () => {
    it("mengembalikan status 404 ketika booking ID tidak ditemukan", async () => {
      const request = new Request("http://localhost/api/bookings/random-uuid", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: "random-uuid" }),
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Booking tidak ditemukan");
    });
  });

  describe("Skenario Input Tidak Valid (400)", () => {
    it("mengembalikan status 400 jika ID booking kosong", async () => {
      const request = new Request("http://localhost/api/bookings/", {
        method: "GET",
      });

      const response = await GET(request, {
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

      const request = new Request("http://localhost/api/bookings/booking-1", {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: "booking-1" }),
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Gagal mengambil data booking");
    });
  });
});
