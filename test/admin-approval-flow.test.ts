import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { GET as getPublicProperties } from "../src/app/api/properties/route";
import { PATCH as updatePropertyStatus } from "../src/app/api/admin/properties/[id]/status/route";
import { NextRequest } from "next/server";

describe.sequential("Fitur Sistem Persetujuan Admin (Admin Approval Flow - Issue #212)", () => {
  let ownerId: string;

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
    const owner = await prisma.owner.create({
      data: {
        name: "Pemilik Kos Mitra",
        whatsapp_number: `0898${Date.now().toString().slice(-7)}`,
      },
    });
    ownerId = owner.id;
  });

  it("1. Properti baru secara default berstatus PENDING_REVIEW dan tidak muncul di pencarian publik", async () => {
    const newKos = await prisma.property.create({
      data: {
        name: "Kos Baru Menunggu Review",
        price_per_month: 800000,
        available_rooms: 4,
        gender_type: "CAMPUR",
        facilities: "WiFi, Kasur",
        owner_id: ownerId,
        // Status default prisma schema: PENDING_REVIEW
      },
    });

    expect(newKos.status).toBe("PENDING_REVIEW");

    // Panggil endpoint pencarian publik
    const response = await getPublicProperties();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    // Kos berstatus PENDING_REVIEW tidak boleh muncul di pencarian publik
    const found = result.data?.find((p: { id: string }) => p.id === newKos.id);
    expect(found).toBeUndefined();
  });

  it("2. Endpoint PATCH status menolak akses jika tidak ada token admin", async () => {
    const property = await prisma.property.create({
      data: {
        name: "Kos Uji Auth",
        price_per_month: 750000,
        available_rooms: 2,
        gender_type: "PUTRA",
        facilities: "Kamar Mandi Dalam",
        owner_id: ownerId,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });

    const response = await updatePropertyStatus(request, {
      params: Promise.resolve({ id: property.id }),
    });

    expect(response.status).toBe(401);
  });

  it("3. Admin berhasil menyetujui properti (Approve/PUBLISHED) dan properti langsung muncul di pencarian publik", async () => {
    const property = await prisma.property.create({
      data: {
        name: "Kos Siap Publikasi",
        price_per_month: 1200000,
        available_rooms: 5,
        gender_type: "PUTRI",
        facilities: "AC, WiFi, Kamar Mandi Dalam",
        owner_id: ownerId,
        status: "PENDING_REVIEW",
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: "admin_token=kospasti_admin_authenticated",
      },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });

    const response = await updatePropertyStatus(request, {
      params: Promise.resolve({ id: property.id }),
    });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("PUBLISHED");

    // Cek di database
    const dbProp = await prisma.property.findUnique({ where: { id: property.id } });
    expect(dbProp?.status).toBe("PUBLISHED");
    expect(dbProp?.rejectionReason).toBeNull();

    // Verifikasi muncul di GET /api/properties (pencarian publik)
    const publicRes = await getPublicProperties();
    const publicJson = await publicRes.json();
    const found = publicJson.data?.find((p: { id: string }) => p.id === property.id);
    expect(found).toBeDefined();
    expect(found.name).toBe("Kos Siap Publikasi");
  });

  it("4. Admin wajib menyertakan alasan penolakan saat menolak properti (Reject)", async () => {
    const property = await prisma.property.create({
      data: {
        name: "Kos Data Tidak Lengkap",
        price_per_month: 500000,
        available_rooms: 1,
        gender_type: "CAMPUR",
        facilities: "Kasur",
        owner_id: ownerId,
        status: "PENDING_REVIEW",
      },
    });

    // Request tolak tanpa alasan
    const reqNoReason = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: "admin_token=kospasti_admin_authenticated",
      },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: "" }),
    });

    const resNoReason = await updatePropertyStatus(reqNoReason, {
      params: Promise.resolve({ id: property.id }),
    });
    const jsonNoReason = await resNoReason.json();

    expect(resNoReason.status).toBe(400);
    expect(jsonNoReason.success).toBe(false);
    expect(jsonNoReason.error).toContain("Alasan penolakan wajib diisi");
  });

  it("5. Admin berhasil menolak properti dan mencatat alasan penolakan untuk mitra", async () => {
    const property = await prisma.property.create({
      data: {
        name: "Kos Foto Buram",
        price_per_month: 650000,
        available_rooms: 3,
        gender_type: "PUTRA",
        facilities: "Lemari",
        owner_id: ownerId,
        status: "PENDING_REVIEW",
      },
    });

    const reqReject = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: "admin_token=kospasti_admin_authenticated",
      },
      body: JSON.stringify({
        status: "REJECTED",
        rejectionReason: "Foto kamar buram dan titik maps tidak akurat. Harap update foto tampak depan.",
      }),
    });

    const resReject = await updatePropertyStatus(reqReject, {
      params: Promise.resolve({ id: property.id }),
    });
    const jsonReject = await resReject.json();

    expect(resReject.status).toBe(200);
    expect(jsonReject.success).toBe(true);
    expect(jsonReject.data.status).toBe("REJECTED");

    // Cek di database
    const dbProp = await prisma.property.findUnique({ where: { id: property.id } });
    expect(dbProp?.status).toBe("REJECTED");
    expect(dbProp?.rejectionReason).toBe("Foto kamar buram dan titik maps tidak akurat. Harap update foto tampak depan.");
  });
});
