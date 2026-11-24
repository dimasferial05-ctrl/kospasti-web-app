import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getInspection, POST as createOrConfirmInspection } from "@/app/api/bookings/[id]/inspection/route";
import { prisma } from "@/lib/prisma";
import * as authLib from "@/lib/auth";
import * as uploadLib from "@/lib/upload";
import * as whatsappLib from "@/lib/whatsapp";
import * as notificationsLib from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-123" }),
}));

vi.mock("@/lib/upload", () => ({
  saveUploadedFile: vi.fn().mockResolvedValue({
    url: "https://mock-supabase.co/storage/v1/object/public/kospasti-media/inspections/ac-123.jpg",
    type: "IMAGE",
  }),
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

describe("Berita Acara Digital Serah Terima Kondisi Kamar (Check-in Inspection Checklist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. GET /api/bookings/[id]/inspection", () => {
    it("Mengembalikan 401 jika pengguna belum terotentikasi", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection");
      const res = await getInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("Mengembalikan 404 jika booking tidak ditemukan", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/bookings/non-existent/inspection");
      const res = await getInspection(req, { params: Promise.resolve({ id: "non-existent" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain("tidak ditemukan");
    });

    it("Anti-IDOR: Mengembalikan 403 jika diakses oleh pemilik atau mahasiswa yang tidak berhak", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "intruder-owner-999",
        role: "OWNER",
      } as any);
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        user_id: "student-1",
        property: {
          id: "prop-1",
          owner_id: "legit-owner-123",
          name: "Kos Melati",
        },
      } as any);

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection");
      const res = await getInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Akses ditolak");
    });

    it("Berhasil mengambil data inspeksi jika diakses oleh pemilik yang sah", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      const mockInspection = {
        id: "insp-1",
        booking_id: "book-1",
        is_locked: true,
        ac_condition: "GOOD",
        bed_condition: "GOOD",
        walls_condition: "GOOD",
        bathroom_condition: "GOOD",
        ac_photo_url: "https://mock.com/ac.jpg",
        inspected_at: new Date(),
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        status: "ACCEPTED",
        user_id: "student-1",
        student_name: "Budi",
        student_whatsapp: "081234567890",
        move_in_date: new Date(),
        property: {
          id: "prop-1",
          owner_id: "owner-123",
          name: "Kos Melati",
          address: "Jl. Kaliurang KM 5",
          city: "Sleman",
        },
        room_type: { id: "rt-1", name: "Deluxe" },
        room_unit: { id: "unit-101", unit_number: "101", floor: 1 },
        checkin_inspection: mockInspection,
      } as any);

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection");
      const res = await getInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.booking.property_name).toBe("Kos Melati");
      expect(data.booking.room_unit_number).toBe("101");
      expect(data.inspection.ac_condition).toBe("GOOD");
      expect(data.inspection.is_locked).toBe(true);
    });
  });

  describe("2. POST /api/bookings/[id]/inspection", () => {
    it("Menolak pembuatan BAST jika booking belum disetujui (misal status PENDING)", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        status: "PENDING",
        property: { id: "prop-1", owner_id: "owner-123", name: "Kos Melati" },
        checkin_inspection: null,
      } as any);

      const formData = new FormData();
      formData.append("ac_condition", "GOOD");

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection", {
        method: "POST",
        body: formData,
      });

      const res = await createOrConfirmInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Inspeksi hanya dapat dilakukan pada pesanan yang sudah disetujui");
    });

    it("Menolak perubahan sepihak jika berita acara sudah dikunci (is_locked: true)", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        status: "COMPLETED",
        property: { id: "prop-1", owner_id: "owner-123", name: "Kos Melati" },
        checkin_inspection: {
          id: "insp-1",
          is_locked: true,
        },
      } as any);

      const formData = new FormData();
      formData.append("ac_condition", "DAMAGED");

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection", {
        method: "POST",
        body: formData,
      });

      const res = await createOrConfirmInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("sudah dikunci");
    });

    it("Berhasil menyimpan inspeksi kamar, mengunggah foto, mengunci baseline, dan mengirim notifikasi", async () => {
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-123",
        role: "OWNER",
      } as any);
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        user_id: "student-1",
        status: "ACCEPTED",
        student_name: "Budi",
        student_whatsapp: "081234567890",
        property: { id: "prop-1", owner_id: "owner-123", name: "Kos Melati" },
        checkin_inspection: null,
      } as any);

      const mockCreatedInspection = {
        id: "insp-new",
        booking_id: "book-1",
        inspector_role: "PARTNER",
        ac_condition: "GOOD",
        bed_condition: "GOOD",
        walls_condition: "DAMAGED",
        walls_notes: "Ada noda coretan kecil di dinding kiri",
        bathroom_condition: "GOOD",
        ac_photo_url: "https://mock-supabase.co/storage/v1/object/public/kospasti-media/inspections/ac-123.jpg",
        is_locked: true,
      };

      vi.spyOn(prisma.checkinInspection, "upsert").mockResolvedValue(mockCreatedInspection as any);

      const fakeFile = new File(["dummy content"], "ac-photo.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("ac_condition", "GOOD");
      formData.append("bed_condition", "GOOD");
      formData.append("walls_condition", "DAMAGED");
      formData.append("walls_notes", "Ada noda coretan kecil di dinding kiri");
      formData.append("bathroom_condition", "GOOD");
      formData.append("ac_file", fakeFile);

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection", {
        method: "POST",
        body: formData,
      });

      const res = await createOrConfirmInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.inspection.is_locked).toBe(true);
      expect(data.inspection.walls_condition).toBe("DAMAGED");

      // Verifikasi notifikasi In-App & WA terkirim ke mahasiswa
      expect(notificationsLib.createInAppNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "student-1",
          type: "BOOKING_STATUS",
        })
      );
      expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalled();
    });

    it("Memfasilitasi penyewa untuk mengonfirmasi / menyetujui BAST digital", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "student-1",
        email: "budi@mail.com",
        name: "Budi",
      } as any);
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue(null);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: "book-1",
        user_id: "student-1",
        status: "COMPLETED",
        property: { id: "prop-1", owner_id: "owner-123", name: "Kos Melati" },
        checkin_inspection: {
          id: "insp-1",
          is_locked: true,
          tenant_confirmed_at: null,
        },
      } as any);

      const confirmedInspection = {
        id: "insp-1",
        booking_id: "book-1",
        is_locked: true,
        tenant_confirmed_at: new Date(),
      };

      vi.spyOn(prisma.checkinInspection, "update").mockResolvedValue(confirmedInspection as any);

      const req = new Request("http://localhost:3000/api/bookings/book-1/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM_TENANT" }),
      });

      const res = await createOrConfirmInspection(req, { params: Promise.resolve({ id: "book-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("berhasil disetujui oleh penyewa");
    });
  });
});
