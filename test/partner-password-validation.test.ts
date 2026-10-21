import { describe, it, expect, vi } from "vitest";
import {
  isValidPartnerPassword,
  PARTNER_PASSWORD_REGEX,
  PARTNER_PASSWORD_ERROR_MESSAGE,
} from "@/lib/auth";
import { PUT as updatePasswordHandler } from "@/app/api/partner/password/route";
import { POST as registerHandler } from "@/app/api/partner/register/route";
import { NextRequest } from "next/server";
import * as authModule from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Partner Password Strength Validation Tests", () => {
  it("1. PARTNER_PASSWORD_REGEX & PARTNER_PASSWORD_ERROR_MESSAGE terdefinisi dengan tepat", () => {
    expect(PARTNER_PASSWORD_REGEX).toBeInstanceOf(RegExp);
    expect(PARTNER_PASSWORD_ERROR_MESSAGE).toContain("minimal 8 karakter");
  });

  it("2. isValidPartnerPassword menolak input non-string atau null/undefined", () => {
    expect(isValidPartnerPassword(null)).toBe(false);
    expect(isValidPartnerPassword(undefined)).toBe(false);
    expect(isValidPartnerPassword(12345678)).toBe(false);
    expect(isValidPartnerPassword({})).toBe(false);
  });

  it("3. isValidPartnerPassword menolak password dengan panjang kurang dari 8 karakter", () => {
    expect(isValidPartnerPassword("123456")).toBe(false);
    expect(isValidPartnerPassword("Abc1")).toBe(false);
    expect(isValidPartnerPassword("Abcdef1")).toBe(false); // 7 karakter
  });

  it("4. isValidPartnerPassword menolak password tanpa kombinasi huruf besar, huruf kecil, atau angka", () => {
    expect(isValidPartnerPassword("kospastibaru1")).toBe(false); // tidak ada huruf besar
    expect(isValidPartnerPassword("KOSPASTIBARU1")).toBe(false); // tidak ada huruf kecil
    expect(isValidPartnerPassword("KosPastiBaru")).toBe(false);  // tidak ada angka
    expect(isValidPartnerPassword("123456789012")).toBe(false);  // hanya angka
  });

  it("5. isValidPartnerPassword meloloskan password yang memenuhi standar keamanan", () => {
    expect(isValidPartnerPassword("KosPasti2026")).toBe(true);
    expect(isValidPartnerPassword("MitraSubang#99")).toBe(true);
    expect(isValidPartnerPassword("Password123")).toBe(true);
  });

  it("6. PUT /api/partner/password menolak kata sandi baru yang lemah (< 8 karakter atau tanpa kombinasi)", async () => {
    vi.spyOn(authModule, "verifyOwnerToken").mockResolvedValue({
      ownerId: "owner-123",
      email: "owner@kospasti.com",
      name: "Owner Test",
      whatsapp_number: "081234567890",
      role: "OWNER",
    });

    const weakPasswords = ["123456", "kospasti123", "KosPastiKos", "Abc1"];

    for (const weakPwd of weakPasswords) {
      const req = new NextRequest("http://localhost:3000/api/partner/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "partner_token=valid-token",
        },
        body: JSON.stringify({
          current_password: "OldPassword123",
          new_password: weakPwd,
          confirm_password: weakPwd,
        }),
      });

      const response = await updatePasswordHandler(req);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe(PARTNER_PASSWORD_ERROR_MESSAGE);
    }

    vi.restoreAllMocks();
  });

  it("7. PUT /api/partner/password menerima kata sandi baru yang memenuhi standar keamanan", async () => {
    vi.spyOn(authModule, "verifyOwnerToken").mockResolvedValue({
      ownerId: "owner-123",
      email: "owner@kospasti.com",
      name: "Owner Test",
      whatsapp_number: "081234567890",
      role: "OWNER",
    });

    const hashedOld = await bcrypt.hash("OldPassword123", 10);

    vi.spyOn(prisma.owner, "findUnique").mockResolvedValue({
      id: "owner-123",
      password: hashedOld,
    } as unknown as never);

    const updateSpy = vi.spyOn(prisma.owner, "update").mockResolvedValue({} as unknown as never);

    const req = new NextRequest("http://localhost:3000/api/partner/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: "partner_token=valid-token",
      },
      body: JSON.stringify({
        current_password: "OldPassword123",
        new_password: "NewStrongPassword2026",
        confirm_password: "NewStrongPassword2026",
      }),
    });

    const response = await updatePasswordHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(updateSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("8. POST /api/partner/register menolak password pendaftaran yang lemah menggunakan error message terpusat", async () => {
    const req = new Request("http://localhost:3000/api/partner/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Mitra Baru",
        email: "mitrabaru@kospasti.com",
        password: "lemah",
        whatsapp_number: "081234567890",
        propertyName: "Kos Mitra",
        propertyAddress: "Subang",
        pricePerMonth: 500000,
        totalRooms: 5,
        gender: "CAMPUR",
      }),
    });

    const response = await registerHandler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe(PARTNER_PASSWORD_ERROR_MESSAGE);
  });
});
