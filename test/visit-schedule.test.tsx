import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ token: "mock-token-123" }),
  usePathname: () => "/kos/prop-1",
}));

// Mock next/headers cookies
const mockCookies = new Map<string, { value: string }>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => mockCookies.get(key),
  })),
}));

// Mock WhatsApp & Notifications
const mockSendWhatsAppMessage = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: (...args: unknown[]) => mockSendWhatsAppMessage(...args),
  formatWhatsAppNumber: (p: string) => p.replace(/^0/, "62"),
}));

const mockNotificationCreate = vi.fn().mockResolvedValue({ id: "notif-1" });

// Prisma mocks
const mockUserFindUnique = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockVisitFindFirst = vi.fn();
const mockVisitFindMany = vi.fn();
const mockVisitCreate = vi.fn();
const mockVisitUpdate = vi.fn();
const mockMagicLinkFindUnique = vi.fn();
const mockMagicLinkCreate = vi.fn();
const mockMagicLinkUpdateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
    property: { findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args) },
    visitSchedule: {
      findFirst: (...args: unknown[]) => mockVisitFindFirst(...args),
      findMany: (...args: unknown[]) => mockVisitFindMany(...args),
      create: (...args: unknown[]) => mockVisitCreate(...args),
      update: (...args: unknown[]) => mockVisitUpdate(...args),
    },
    magicLink: {
      findUnique: (...args: unknown[]) => mockMagicLinkFindUnique(...args),
      create: (...args: unknown[]) => mockMagicLinkCreate(...args),
      updateMany: (...args: unknown[]) => mockMagicLinkUpdateMany(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import {
  isValidIndonesianWhatsApp,
  getIndonesianWhatsAppVariants,
  parseVisitDateInput,
  isPastVisitDate,
  getTodayWibDateString,
} from "@/lib/visit-schedule";
import { signUserToken, signOwnerToken } from "@/lib/auth";
import { POST as createVisit, GET as listVisits } from "@/app/api/visits/route";
import { GET as validateVisitToken } from "@/app/api/magic-link/visit/validate/route";
import { POST as decideVisitToken } from "@/app/api/magic-link/visit/decision/route";
import { PATCH as partnerPatchVisit } from "@/app/api/partner/visits/[id]/route";
import { ScheduleVisitModal } from "@/components/features/ScheduleVisitModal";

describe("Schedule a Visit / Janji Survei Lokasi - Issue #388", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.clear();
  });

  describe("1. Helper & Validasi (src/lib/visit-schedule.ts)", () => {
    it("memvalidasi format nomor WhatsApp Indonesia dengan benar", () => {
      expect(isValidIndonesianWhatsApp("081234567890")).toBe(true);
      expect(isValidIndonesianWhatsApp("+6281234567890")).toBe(true);
      expect(isValidIndonesianWhatsApp("6285712345678")).toBe(true);
      expect(isValidIndonesianWhatsApp("0211234567")).toBe(false);
      expect(isValidIndonesianWhatsApp("abc")).toBe(false);
      expect(isValidIndonesianWhatsApp("081234567890123456")).toBe(false);
    });

    it("mengurai tanggal YYYY-MM-DD tanpa pergeseran zona waktu dan mendeteksi tanggal lampau", () => {
      const refNow = new Date("2026-11-12T04:00:00.000Z"); // 11:00 WIB
      const todayWib = getTodayWibDateString(refNow);
      expect(todayWib).toBe("2026-11-12");

      const parsedToday = parseVisitDateInput("2026-11-12");
      const parsedYesterday = parseVisitDateInput("2026-11-11");
      const parsedInvalid = parseVisitDateInput("2026-02-30");

      expect(parsedToday).not.toBeNull();
      expect(parsedInvalid).toBeNull();
      expect(isPastVisitDate(parsedToday!, refNow)).toBe(false);
      expect(isPastVisitDate(parsedYesterday!, refNow)).toBe(true);
    });

    it("menghasilkan variasi format nomor WhatsApp Indonesia untuk pengecekan anti-spam", () => {
      const variants = getIndonesianWhatsAppVariants("+6281234567890");
      expect(variants).toContain("081234567890");
      expect(variants).toContain("6281234567890");
      expect(variants).toContain("+6281234567890");
    });
  });

  describe("2. POST & GET /api/visits", () => {
    it("menolak pengajuan jika tanggal survei lebih awal dari hari ini", async () => {
      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          studentName: "Dimas Ferial",
          studentWhatsapp: "081234567890",
          visitDate: "2020-01-01",
          visitTimeSlot: "13:00 - 15:00",
        }),
      });

      const res = await createVisit(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("lebih awal dari hari ini");
    });

    it("menolak pengajuan jika format nomor WhatsApp tidak valid", async () => {
      const futureDate = "2099-12-20";
      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          studentName: "Dimas",
          studentWhatsapp: "12345",
          visitDate: futureDate,
          visitTimeSlot: "13:00 - 15:00",
        }),
      });

      const res = await createVisit(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Format nomor WhatsApp");
    });

    it("menerima pengajuan survei, membuat MagicLink VISIT_VERIFICATION, dan mengirim WA + In-App Notification", async () => {
      const token = await signUserToken({
        userId: "user-1",
        email: "dimas@example.com",
        name: "Dimas Ferial",
        whatsapp: "081234567890",
      });
      mockCookies.set("user_token", { value: token });

      mockUserFindUnique.mockResolvedValueOnce({
        id: "user-1",
        name: "Dimas Ferial",
        whatsapp: "081234567890",
      });

      mockPropertyFindUnique.mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Melati Asri",
        owner_id: "owner-1",
        status: "APPROVED",
        owner: {
          id: "owner-1",
          name: "Ibu Sari",
          whatsapp_number: "081987654321",
        },
      });

      mockVisitFindFirst.mockResolvedValueOnce(null);

      mockTransaction.mockImplementationOnce(async (cb) => {
        const tx = {
          visitSchedule: {
            create: mockVisitCreate.mockResolvedValueOnce({
              id: "visit-1",
              property_id: "prop-1",
              user_id: "user-1",
              student_name: "Dimas Ferial",
              student_whatsapp: "081234567890",
              visit_date: parseVisitDateInput("2099-12-20"),
              visit_time_slot: "13:00 - 15:00",
              status: "PENDING",
            }),
          },
          magicLink: {
            create: mockMagicLinkCreate.mockResolvedValueOnce({ id: "ml-1" }),
          },
        };
        return cb(tx);
      });

      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          visitDate: "2099-12-20",
          visitTimeSlot: "13:00 - 15:00",
          notes: "Datang bersama orang tua",
        }),
      });

      const res = await createVisit(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.visitId).toBe("visit-1");

      // Pastikan MagicLink tipe VISIT_VERIFICATION dibuat
      expect(mockMagicLinkCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "VISIT_VERIFICATION",
            owner_id: "owner-1",
            visit_id: "visit-1",
          }),
        })
      );

      // Pastikan Notifikasi In-App dikirim ke Owner & User
      expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
      // Pastikan WA dikirim ke pemilik kos
      expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1);
      expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081987654321",
          message: expect.stringContaining("/survey/verify/"),
        })
      );
    });

    it("mengizinkan pengunjung tamu (tanpa login) untuk mengajukan survei", async () => {
      mockPropertyFindUnique.mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Melati Asri",
        owner_id: "owner-1",
        status: "APPROVED",
        owner: {
          id: "owner-1",
          name: "Ibu Sari",
          whatsapp_number: "081987654321",
        },
      });
      mockVisitFindFirst.mockResolvedValueOnce(null);

      mockTransaction.mockImplementationOnce(async (cb) => {
        const tx = {
          visitSchedule: {
            create: mockVisitCreate.mockResolvedValueOnce({
              id: "visit-guest",
              user_id: null,
              status: "PENDING",
              visit_date: parseVisitDateInput("2099-12-21"),
              visit_time_slot: "09:00 - 11:00",
            }),
          },
          magicLink: { create: mockMagicLinkCreate },
        };
        return cb(tx);
      });

      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          studentName: "Orang Tua Mahasiswa",
          studentWhatsapp: "081333444555",
          visitDate: "2099-12-21",
          visitTimeSlot: "09:00 - 11:00",
        }),
      });

      const res = await createVisit(req);
      expect(res.status).toBe(201);
      // Hanya notifikasi In-App ke Owner karena user_id null
      expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
      expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1);
    });

    it("GET /api/visits mengembalikan 401 jika tidak login, dan memfilter sesuai owner/user", async () => {
      const unauthRes = await listVisits(new Request("http://localhost/api/visits"));
      expect(unauthRes.status).toBe(401);

      const ownerToken = await signOwnerToken({
        ownerId: "owner-1",
        name: "Ibu Sari",
        whatsapp_number: "081987654321",
      });
      mockCookies.set("partner_token", { value: ownerToken });
      mockVisitFindMany.mockResolvedValueOnce([{ id: "visit-1" }]);

      const ownerRes = await listVisits(
        new Request("http://localhost/api/visits?audience=OWNER")
      );
      expect(ownerRes.status).toBe(200);
      const ownerJson = await ownerRes.json();
      expect(ownerJson.visits).toHaveLength(1);
    });

    it("menolak pengajuan ganda (409 DUPLICATE_VISIT_FOR_PROPERTY) di kos yang sama untuk mencegah spam", async () => {
      mockPropertyFindUnique.mockResolvedValueOnce({
        id: "prop-1",
        name: "Kos Melati Asri",
        owner_id: "owner-1",
        status: "APPROVED",
        owner: {
          id: "owner-1",
          name: "Ibu Sari",
          whatsapp_number: "081987654321",
        },
      });

      mockVisitFindFirst.mockResolvedValueOnce({
        id: "visit-existing",
        status: "ACCEPTED",
        visit_date: parseVisitDateInput("2099-12-20"),
        visit_time_slot: "13:00 - 15:00",
      });

      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "prop-1",
          studentName: "Dimas Ferial",
          studentWhatsapp: "+6281234567890",
          visitDate: "2099-12-25",
          visitTimeSlot: "09:00 - 11:00",
        }),
      });

      const res = await createVisit(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe("DUPLICATE_VISIT_FOR_PROPERTY");
      expect(json.existingVisit.id).toBe("visit-existing");
      expect(mockTransaction).not.toHaveBeenCalled();

      // Verifikasi query mencari status non-CANCELLED dengan variasi nomor WA
      expect(mockVisitFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            property_id: "prop-1",
            status: { not: "CANCELLED" },
            OR: expect.arrayContaining([
              {
                student_whatsapp: {
                  in: expect.arrayContaining(["081234567890", "6281234567890", "+6281234567890"]),
                },
              },
            ]),
          }),
        })
      );
    });

    it("GET /api/visits?propertyId=... mengembalikan existingVisit untuk mahasiswa yang sudah login", async () => {
      const token = await signUserToken({
        userId: "user-1",
        email: "dimas@example.com",
        name: "Dimas Ferial",
        whatsapp: "081234567890",
      });
      mockCookies.set("user_token", { value: token });
      mockVisitFindMany.mockResolvedValueOnce([
        {
          id: "visit-existing",
          status: "PENDING",
          visit_date: parseVisitDateInput("2099-12-20"),
          visit_time_slot: "13:00 - 15:00",
        },
      ]);

      const res = await listVisits(
        new Request("http://localhost/api/visits?propertyId=prop-1")
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.existingVisit?.id).toBe("visit-existing");
    });
  });

  describe("3. Magic Link Validation & Decision (/api/magic-link/visit/*)", () => {
    it("memvalidasi token magic link survei dan mengembalikan 410 jika sudah digunakan", async () => {
      mockMagicLinkFindUnique.mockResolvedValueOnce({
        id: "ml-1",
        token: "used-token",
        type: "VISIT_VERIFICATION",
        is_used: true,
        expires_at: new Date(Date.now() + 3600_000),
        visit: { status: "ACCEPTED" },
      });

      const res = await validateVisitToken(
        new Request("http://localhost/api/magic-link/visit/validate?token=used-token")
      );
      expect(res.status).toBe(410);
      const json = await res.json();
      expect(json.isUsed).toBe(true);
    });

    it("memproses keputusan RESCHEDULE secara atomik dan mengirim notifikasi ke mahasiswa", async () => {
      mockMagicLinkFindUnique.mockResolvedValueOnce({
        id: "ml-2",
        token: "reschedule-token",
        type: "VISIT_VERIFICATION",
        is_used: false,
        expires_at: new Date(Date.now() + 3600_000),
        owner: { name: "Ibu Sari", whatsapp_number: "081987654321" },
        visit: {
          id: "visit-2",
          property_id: "prop-1",
          user_id: "user-1",
          student_name: "Dimas Ferial",
          student_whatsapp: "081234567890",
          visit_date: parseVisitDateInput("2099-12-20"),
          visit_time_slot: "13:00 - 15:00",
          property: { name: "Kos Melati Asri", address: "Jl. Darussalam No. 5" },
        },
      });

      mockTransaction.mockImplementationOnce(async (cb) => {
        const tx = {
          magicLink: {
            updateMany: mockMagicLinkUpdateMany.mockResolvedValueOnce({ count: 1 }),
          },
          visitSchedule: {
            update: mockVisitUpdate.mockResolvedValueOnce({
              id: "visit-2",
              status: "RESCHEDULED",
            }),
          },
        };
        return cb(tx);
      });

      const req = new Request("http://localhost/api/magic-link/visit/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reschedule-token",
          action: "RESCHEDULE",
          rescheduleDate: "2099-12-22",
          rescheduleTimeSlot: "15:00 - 17:00",
          note: "Jam 1 siang saya masih keluar kota.",
        }),
      });

      const res = await decideVisitToken(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("RESCHEDULED");

      expect(mockVisitUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "visit-2" },
          data: expect.objectContaining({
            status: "RESCHEDULED",
            reschedule_time_slot: "15:00 - 17:00",
            reschedule_note: "Jam 1 siang saya masih keluar kota.",
          }),
        })
      );

      // In-app notification + WhatsApp balik ke mahasiswa
      expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
      expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081234567890",
          message: expect.stringContaining("JADWAL ULANG"),
        })
      );
    });

    it("mencegah pemrosesan ganda (race condition) jika token sudah terpakai saat transaksi", async () => {
      mockMagicLinkFindUnique.mockResolvedValueOnce({
        id: "ml-3",
        token: "race-token",
        type: "VISIT_VERIFICATION",
        is_used: false,
        expires_at: new Date(Date.now() + 3600_000),
        owner: { name: "Ibu Sari", whatsapp_number: "081987654321" },
        visit: {
          id: "visit-3",
          property_id: "prop-1",
          user_id: "user-1",
          student_name: "Dimas",
          student_whatsapp: "081234567890",
          visit_date: parseVisitDateInput("2099-12-20"),
          visit_time_slot: "13:00 - 15:00",
          property: { name: "Kos Melati", address: "Subang" },
        },
      });

      mockTransaction.mockImplementationOnce(async (cb) => {
        const tx = {
          magicLink: {
            updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
          },
          visitSchedule: { update: mockVisitUpdate },
        };
        return cb(tx);
      });

      const req = new Request("http://localhost/api/magic-link/visit/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "race-token", action: "ACCEPT" }),
      });

      const res = await decideVisitToken(req);
      expect(res.status).toBe(410);
      expect(mockVisitUpdate).not.toHaveBeenCalled();
    });
  });

  describe("4. PATCH /api/partner/visits/[id]", () => {
    it("menolak akses tanpa sesi mitra dan menyetujui jadwal survei ketika mitra terautentikasi", async () => {
      const unauth = await partnerPatchVisit(
        new Request("http://localhost/api/partner/visits/v1", {
          method: "PATCH",
          body: JSON.stringify({ action: "ACCEPT" }),
        }),
        { params: Promise.resolve({ id: "v1" }) }
      );
      expect(unauth.status).toBe(401);

      const ownerToken = await signOwnerToken({
        ownerId: "owner-1",
        name: "Ibu Sari",
        whatsapp_number: "081987654321",
      });
      mockCookies.set("partner_token", { value: ownerToken });

      mockVisitFindFirst.mockResolvedValueOnce({
        id: "v1",
        property_id: "prop-1",
        user_id: "user-1",
        student_name: "Dimas",
        student_whatsapp: "081234567890",
        visit_date: parseVisitDateInput("2099-12-20"),
        visit_time_slot: "15:00 - 17:00",
        property: {
          name: "Kos Melati",
          address: "Subang",
          owner: { name: "Ibu Sari", whatsapp_number: "081987654321" },
        },
      });

      mockTransaction.mockImplementationOnce(async (cb) => {
        const tx = {
          magicLink: { updateMany: mockMagicLinkUpdateMany },
          visitSchedule: {
            update: mockVisitUpdate.mockResolvedValueOnce({
              id: "v1",
              status: "ACCEPTED",
            }),
          },
        };
        return cb(tx);
      });

      const res = await partnerPatchVisit(
        new Request("http://localhost/api/partner/visits/v1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ACCEPT" }),
        }),
        { params: Promise.resolve({ id: "v1" }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACCEPTED");
    });
  });

  describe("5. Integrasi UI & Kepatuhan Design Guidelines", () => {
    it("merender ScheduleVisitModal dengan <dialog> semantik tanpa raw emoji", () => {
      const html = renderToStaticMarkup(
        <ScheduleVisitModal
          isOpen={false}
          onClose={vi.fn()}
          propertyId="prop-1"
          propertyName="Kos Melati Asri"
          propertyAddress="Jl. Darussalam No. 5"
        />
      );

      expect(html).toContain("<dialog");
      expect(html).toContain("Jadwalkan Survei Lokasi");
      expect(html).toContain("visitTimeSlot");
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });

    it("merender tampilan terkunci (Jadwal Survei Sudah Terdaftar) jika existingVisit ada", () => {
      const html = renderToStaticMarkup(
        <ScheduleVisitModal
          isOpen={false}
          onClose={vi.fn()}
          propertyId="prop-1"
          propertyName="Kos Melati Asri"
          propertyAddress="Jl. Darussalam No. 5"
          existingVisit={{
            id: "visit-1",
            status: "PENDING",
            visit_date: "2099-12-20T05:00:00.000Z",
            visit_time_slot: "13:00 - 15:00",
          }}
        />
      );

      expect(html).toContain("Jadwal Survei Sudah Terdaftar");
      expect(html).not.toContain("Kirim Permintaan Survei");
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });

    it("halaman detail kos menampilkan tombol sekunder Jadwalkan Survei Lokasi dan ScheduleVisitModal", () => {
      const detailPath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
      const content = fs.readFileSync(detailPath, "utf-8");

      expect(content).toContain("ScheduleVisitModal");
      expect(content).toContain("Jadwalkan Survei Lokasi");
      expect(content).toContain("CalendarClock");
    });
  });
});

