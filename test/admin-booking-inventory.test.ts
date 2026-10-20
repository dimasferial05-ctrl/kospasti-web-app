import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  PATCH,
  ALLOWED_STATUSES,
  ACTIVE_BOOKING_STATUSES,
} from "@/app/api/admin/bookings/[id]/route";
import { prisma } from "@/lib/prisma";

describe("Admin Booking Status & Inventory Synchronization (Issue #265)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createAdminRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost:3000/api/admin/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: "admin_token=kospasti_admin_authenticated",
      },
      body: JSON.stringify(body),
    });
  };

  it("ALLOWED_STATUSES memuat status PAID dan ACCEPTED", () => {
    expect(ALLOWED_STATUSES).toContain("PAID");
    expect(ALLOWED_STATUSES).toContain("ACCEPTED");
    expect(ALLOWED_STATUSES).toContain("APPROVED");
    expect(ALLOWED_STATUSES).toContain("CANCELLED");
    expect(ALLOWED_STATUSES).toContain("COMPLETED");
  });

  it("ACTIVE_BOOKING_STATUSES memuat seluruh status yang menempati kamar", () => {
    expect(ACTIVE_BOOKING_STATUSES).toEqual([
      "PENDING",
      "PAID",
      "SUCCESS",
      "CONFIRMED",
      "ACCEPTED",
      "APPROVED",
      "COMPLETED",
    ]);
  });

  describe("Kalkulasi Sisa Kamar (available_rooms) saat Transisi Status", () => {
    function setupMockTransaction(initialStatus: string) {
      const mockTx = {
        booking: {
          update: vi.fn().mockResolvedValue({
            id: "booking-1",
            status: "UPDATED",
            property_id: "prop-1",
            room_type_id: "rt-1",
            student_whatsapp: "081234567890",
            student_name: "Budi",
            property: { name: "Kos Mawar" },
          }),
        },
        property: {
          update: vi.fn().mockResolvedValue({ id: "prop-1" }),
        },
        roomType: {
          update: vi.fn().mockResolvedValue({ id: "rt-1" }),
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "booking-1",
        status: initialStatus,
        property_id: "prop-1",
        room_type_id: "rt-1",
        student_whatsapp: "081234567890",
        student_name: "Budi",
        property: { name: "Kos Mawar" },
      } as unknown as never);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        if (typeof callback === "function") {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        }
        return undefined;
      });

      return mockTx;
    }

    it("Transisi PAID -> CANCELLED mengembalikan kamar (+1 increment)", async () => {
      const mockTx = setupMockTransaction("PAID");
      const req = createAdminRequest({ status: "CANCELLED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: "prop-1" },
        data: { available_rooms: { increment: 1 } },
      });
      expect(mockTx.roomType.update).toHaveBeenCalledWith({
        where: { id: "rt-1" },
        data: { available_rooms: { increment: 1 } },
      });
    });

    it("Transisi ACCEPTED -> REJECTED mengembalikan kamar (+1 increment)", async () => {
      const mockTx = setupMockTransaction("ACCEPTED");
      const req = createAdminRequest({ status: "REJECTED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: "prop-1" },
        data: { available_rooms: { increment: 1 } },
      });
      expect(mockTx.roomType.update).toHaveBeenCalledWith({
        where: { id: "rt-1" },
        data: { available_rooms: { increment: 1 } },
      });
    });

    it("Transisi COMPLETED -> REFUNDED mengembalikan kamar (+1 increment)", async () => {
      const mockTx = setupMockTransaction("COMPLETED");
      const req = createAdminRequest({ status: "REFUNDED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: "prop-1" },
        data: { available_rooms: { increment: 1 } },
      });
      expect(mockTx.roomType.update).toHaveBeenCalledWith({
        where: { id: "rt-1" },
        data: { available_rooms: { increment: 1 } },
      });
    });

    it("Transisi PAID -> APPROVED TIDAK mengurangi stok kamar untuk kedua kalinya (stok tetap)", async () => {
      const mockTx = setupMockTransaction("PAID");
      const req = createAdminRequest({ status: "APPROVED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      // Karena keduanya status aktif, tidak boleh ada pemanggilan increment maupun decrement
      expect(mockTx.property.update).not.toHaveBeenCalled();
      expect(mockTx.roomType.update).not.toHaveBeenCalled();
    });

    it("Transisi ACCEPTED -> APPROVED TIDAK mengurangi stok kamar untuk kedua kalinya (stok tetap)", async () => {
      const mockTx = setupMockTransaction("ACCEPTED");
      const req = createAdminRequest({ status: "APPROVED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      expect(mockTx.property.update).not.toHaveBeenCalled();
      expect(mockTx.roomType.update).not.toHaveBeenCalled();
    });

    it("Transisi CANCELLED -> APPROVED mengalokasikan kamar (-1 decrement)", async () => {
      const mockTx = setupMockTransaction("CANCELLED");
      const req = createAdminRequest({ status: "APPROVED" });

      const res = await PATCH(req, { params: Promise.resolve({ id: "booking-1" }) });
      expect(res.status).toBe(200);

      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: "prop-1" },
        data: { available_rooms: { decrement: 1 } },
      });
      expect(mockTx.roomType.update).toHaveBeenCalledWith({
        where: { id: "rt-1" },
        data: { available_rooms: { decrement: 1 } },
      });
    });
  });
});
