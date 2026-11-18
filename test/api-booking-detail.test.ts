import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/bookings/[id]/route";
import { prisma } from "../src/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "../src/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("GET /api/bookings/[id]", () => {
  const mockUserId = "test-user-id-123";

  beforeEach(() => {
    vi.restoreAllMocks();

    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) =>
        name === "user_token" ? { value: "valid-user-token" } : undefined
      ),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: mockUserId,
      email: "user@example.com",
      name: "Test User",
    } as never);
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil data booking kos reguler beserta rincian harganya", async () => {
      const mockBooking = {
        id: "booking-reguler-1",
        student_name: "Ahmad Dahlan",
        student_whatsapp: "089876543210",
        move_in_date: new Date("2026-10-01"),
        status: "PENDING",
        amount: 850000,
        service_fee: 5000,
        created_at: new Date("2026-09-01T10:00:00Z"),
        paid_at: null,
        payment_method: null,
        payment_gateway_ref: null,
        snap_token: null,
        user_id: mockUserId,
        property: {
          id: "prop-1",
          name: "Kos Melati Nyaman",
          address: "Jl. Melati No. 10",
          price_per_month: 850000,
          image_url: "/uploads/image.jpg",
          gender_type: "PUTRI",
          owner_id: "owner-1",
          owner: {
            name: "Ibu Siti",
            whatsapp_number: "081234567890",
          },
        },
        room_type: null,
        user: {
          email: "ahmad@example.com",
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBooking as never);

      const request = new Request(`http://localhost/api/bookings/${mockBooking.id}`, {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: mockBooking.id }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(mockBooking.id);
      expect(result.data.studentName).toBe("Ahmad Dahlan");
      expect(result.data.property.name).toBe("Kos Melati Nyaman");
      expect(result.data.roomType).toBeNull();
      expect(result.data.pricing.rentPrice).toBe(850000);
      expect(result.data.pricing.adminFee).toBe(5000);
      expect(result.data.pricing.totalPrice).toBe(855000);
    });

    it("berhasil mengambil data booking dengan tipe kamar spesifik beserta rincian harganya", async () => {
      const mockBookingVip = {
        id: "booking-vip-2",
        student_name: "Dimas Ferial",
        student_whatsapp: "081234567899",
        move_in_date: new Date("2026-10-15"),
        status: "PENDING",
        amount: 1200000,
        service_fee: 5000,
        created_at: new Date("2026-09-01T10:00:00Z"),
        paid_at: null,
        payment_method: null,
        payment_gateway_ref: null,
        snap_token: null,
        user_id: mockUserId,
        property: {
          id: "prop-2",
          name: "Kos Graha Mulia",
          address: "Jl. Kaliurang",
          price_per_month: 600000,
          image_url: "/uploads/image2.jpg",
          gender_type: "CAMPUR",
          owner_id: "owner-2",
          owner: {
            name: "Bapak Budi",
            whatsapp_number: "081298765432",
          },
        },
        room_type: {
          id: "room-type-vip",
          name: "Tipe VIP King",
          price_per_month: 1200000,
          image_url: "/uploads/room.jpg",
        },
        user: {
          email: "dimas@example.com",
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingVip as never);

      const request = new Request(`http://localhost/api/bookings/${mockBookingVip.id}`, {
        method: "GET",
      });

      const response = await GET(request, {
        params: Promise.resolve({ id: mockBookingVip.id }),
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
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(null);

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
