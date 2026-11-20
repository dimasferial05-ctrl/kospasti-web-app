import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getUnits, POST as createUnit } from "@/app/api/partner/properties/[id]/units/route";
import { PATCH as updateBookingStatus } from "@/app/api/partner/bookings/[id]/route";
import { GET as getBookingDetail } from "@/app/api/bookings/[id]/route";
import { prisma } from "@/lib/prisma";
import * as authLib from "@/lib/auth";
import * as whatsappLib from "@/lib/whatsapp";
import * as notificationsLib from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-123" }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "partner_token") return { value: "valid_partner_token_123" };
      if (key === "user_token") return { value: "valid_user_token_123" };
      return undefined;
    }),
  }),
}));

describe("Manajemen Nomor Kamar & Inventaris Fisik (Room Unit & Key Inventory)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Endpoint Inventaris Kamar (/api/partner/properties/[id]/units)", () => {
    it("GET: Mengambil daftar unit kamar pada properti milik mitra yang sah", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);

      vi.spyOn(prisma.property, "findFirst").mockResolvedValue({
        id: "prop-1",
        owner_id: "owner-123",
        name: "Kos Mawar",
      } as any);

      const mockUnits = [
        {
          id: "unit-101",
          unit_number: "101",
          floor: 1,
          status: "VACANT",
          room_type: { id: "rt-1", name: "Standar AC" },
          bookings: [],
        },
        {
          id: "unit-204",
          unit_number: "204",
          floor: 2,
          status: "OCCUPIED",
          room_type: { id: "rt-1", name: "Standar AC" },
          bookings: [{ student_name: "Dimas", status: "APPROVED" }],
        },
      ];

      vi.spyOn(prisma.roomUnit, "findMany").mockResolvedValue(mockUnits as any);

      const req = new Request("http://localhost:3000/api/partner/properties/prop-1/units");
      const res = await getUnits(req, { params: Promise.resolve({ id: "prop-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].unit_number).toBe("101");
      expect(data.data[1].unit_number).toBe("204");
    });

    it("POST: Menolak penambahan unit kamar jika nomor kamar kosong atau tipe kamar tidak valid", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);

      vi.spyOn(prisma.property, "findFirst").mockResolvedValue({
        id: "prop-1",
        owner_id: "owner-123",
      } as any);

      // Skenario unit_number kosong
      const reqEmpty = new Request("http://localhost:3000/api/partner/properties/prop-1/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_number: "", floor: 1, room_type_id: "rt-1" }),
      });
      const resEmpty = await createUnit(reqEmpty, { params: Promise.resolve({ id: "prop-1" }) });
      expect(resEmpty.status).toBe(400);

      // Skenario room_type tidak terdaftar
      vi.spyOn(prisma.roomType, "findFirst").mockResolvedValue(null);
      const reqInvalidType = new Request("http://localhost:3000/api/partner/properties/prop-1/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_number: "101", floor: 1, room_type_id: "rt-invalid" }),
      });
      const resInvalidType = await createUnit(reqInvalidType, { params: Promise.resolve({ id: "prop-1" }) });
      expect(resInvalidType.status).toBe(400);
    });

    it("POST: Menolak jika nomor unit kamar duplikat pada properti yang sama", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);

      vi.spyOn(prisma.property, "findFirst").mockResolvedValue({
        id: "prop-1",
        owner_id: "owner-123",
      } as any);

      vi.spyOn(prisma.roomType, "findFirst").mockResolvedValue({
        id: "rt-1",
        property_id: "prop-1",
      } as any);

      vi.spyOn(prisma.roomUnit, "findFirst").mockResolvedValue({
        id: "existing-unit",
        unit_number: "101",
      } as any);

      const req = new Request("http://localhost:3000/api/partner/properties/prop-1/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_number: "101", floor: 1, room_type_id: "rt-1" }),
      });

      const res = await createUnit(req, { params: Promise.resolve({ id: "prop-1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("sudah terdaftar");
    });

    it("POST: Berhasil membuat unit kamar baru dengan status default VACANT", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);

      vi.spyOn(prisma.property, "findFirst").mockResolvedValue({
        id: "prop-1",
        owner_id: "owner-123",
      } as any);

      vi.spyOn(prisma.roomType, "findFirst").mockResolvedValue({
        id: "rt-1",
        property_id: "prop-1",
      } as any);

      vi.spyOn(prisma.roomUnit, "findFirst").mockResolvedValue(null);

      const createdUnitMock = {
        id: "unit-204-id",
        unit_number: "204",
        floor: 2,
        status: "VACANT",
        property_id: "prop-1",
        room_type_id: "rt-1",
      };

      vi.spyOn(prisma.roomUnit, "create").mockResolvedValue(createdUnitMock as any);

      const req = new Request("http://localhost:3000/api/partner/properties/prop-1/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_number: "204", floor: 2, room_type_id: "rt-1", notes: "Dekat balkon" }),
      });

      const res = await createUnit(req, { params: Promise.resolve({ id: "prop-1" }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.unit_number).toBe("204");
      expect(data.data.status).toBe("VACANT");
    });
  });

  describe("2. Alokasi Kamar saat Persetujuan Booking (/api/partner/bookings/[id])", () => {
    it("menolak jika unit kamar yang dipilih sedang OCCUPIED oleh penyewa lain", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
      } as any);

      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue({
        id: "booking-1",
        property_id: "prop-1",
        status: "PENDING",
      } as any);

      vi.spyOn(prisma.roomUnit, "findFirst").mockResolvedValue({
        id: "unit-occupied",
        unit_number: "101",
        status: "OCCUPIED",
      } as any);

      const req = new Request("http://localhost:3000/api/partner/bookings/booking-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", room_unit_id: "unit-occupied" }),
      });

      const res = await updateBookingStatus(req, { params: Promise.resolve({ id: "booking-1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("sedang terisi (OCCUPIED)");
    });

    it("berhasil menyetujui booking dengan memilih nomor kamar, mengubah status kamar ke OCCUPIED", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
      } as any);

      const mockBooking = {
        id: "booking-1",
        property_id: "prop-1",
        status: "PENDING",
        student_name: "Ahmad",
        student_whatsapp: "081234567890",
        move_in_date: new Date("2026-09-01"),
        property: {
          name: "Kos Melati",
          address: "Jl. Kaliurang KM 5",
          owner: { name: "Ibu Siti" },
        },
        room_type: { name: "Tipe Deluxe" },
        room_unit: null,
      };

      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(mockBooking as any);

      const mockVacantUnit = {
        id: "unit-204",
        unit_number: "204",
        floor: 2,
        status: "VACANT",
        property_id: "prop-1",
      };

      vi.spyOn(prisma.roomUnit, "findFirst").mockResolvedValue(mockVacantUnit as any);

      let updatedBookingData: any = null;
      let updatedUnitData: any = null;

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          magicLink: { updateMany: vi.fn() },
          booking: {
            update: vi.fn().mockImplementation((args) => {
              updatedBookingData = args.data;
              return { ...mockBooking, ...args.data };
            }),
          },
          roomUnit: {
            update: vi.fn().mockImplementation((args) => {
              updatedUnitData = args.data;
              return { ...mockVacantUnit, ...args.data };
            }),
          },
        };
        return callback(txMock);
      });

      const waSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");

      const req = new Request("http://localhost:3000/api/partner/bookings/booking-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", room_unit_id: "unit-204" }),
      });

      const res = await updateBookingStatus(req, { params: Promise.resolve({ id: "booking-1" }) });

      expect(res.status).toBe(200);
      expect(updatedBookingData.status).toBe("APPROVED");
      expect(updatedBookingData.room_unit_id).toBe("unit-204");
      expect(updatedUnitData.status).toBe("OCCUPIED");
      expect(waSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Nomor Kamar:* No. 204 (Lantai 2)"),
        })
      );
    });

    it("melepaskan nomor kamar kembali ke VACANT saat booking di-reject", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
      } as any);

      const mockBookingWithRoom = {
        id: "booking-assigned",
        property_id: "prop-1",
        status: "APPROVED",
        room_unit_id: "unit-204",
        student_whatsapp: "081234567890",
        property: { id: "prop-1", name: "Kos Mawar" },
      };

      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(mockBookingWithRoom as any);

      let unitReleasedStatus: any = null;
      let bookingClearedUnit: any = null;

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          magicLink: { updateMany: vi.fn() },
          property: { update: vi.fn() },
          roomType: { update: vi.fn() },
          booking: {
            update: vi.fn().mockImplementation((args) => {
              bookingClearedUnit = args.data.room_unit_id;
              return { ...mockBookingWithRoom, ...args.data };
            }),
          },
          roomUnit: {
            update: vi.fn().mockImplementation((args) => {
              unitReleasedStatus = args.data.status;
              return { id: "unit-204", status: args.data.status };
            }),
          },
        };
        return callback(txMock);
      });

      const req = new Request("http://localhost:3000/api/partner/bookings/booking-assigned", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      const res = await updateBookingStatus(req, { params: Promise.resolve({ id: "booking-assigned" }) });

      expect(res.status).toBe(200);
      expect(bookingClearedUnit).toBeNull();
      expect(unitReleasedStatus).toBe("VACANT");
    });
  });

  describe("3. Detail Booking API untuk Lembar SPK & Kuitansi (/api/bookings/[id])", () => {
    it("mengembalikan objek roomUnit lengkap dengan nomor kamar dan lantai", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-tenant-1",
      } as any);

      const mockBooking = {
        id: "booking-with-unit",
        user_id: "user-tenant-1",
        student_name: "Budi",
        student_whatsapp: "081234567890",
        move_in_date: new Date("2026-09-01"),
        status: "PAID",
        created_at: new Date("2026-08-20"),
        property: {
          id: "prop-1",
          name: "Kos Mawar",
          owner_id: "owner-1",
          price_per_month: 1200000,
        },
        room_type: {
          id: "rt-1",
          name: "Standar",
          price_per_month: 1200000,
        },
        room_unit: {
          id: "unit-204",
          unit_number: "204",
          floor: 2,
          status: "OCCUPIED",
        },
        user: { email: "budi@example.com" },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockBooking as any);
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/bookings/booking-with-unit");
      const res = await getBookingDetail(req, { params: Promise.resolve({ id: "booking-with-unit" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.roomUnit).toBeDefined();
      expect(data.data.roomUnit.unitNumber).toBe("204");
      expect(data.data.roomUnit.floor).toBe(2);
      expect(data.data.roomUnit.status).toBe("OCCUPIED");
    });
  });
});
