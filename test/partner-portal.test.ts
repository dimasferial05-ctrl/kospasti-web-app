import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signOwnerToken, verifyOwnerToken } from "@/lib/auth";

describe("Portal Mitra (Partner Portal) & Self-Onboarding Tests", () => {
  const testEmail = "test_partner_" + Date.now() + "@kospasti.id";
  const testWa = "0812" + Math.floor(10000000 + Math.random() * 90000000);
  const testPassword = "Password123!";

  it("1. Kolom email dan password berhasil ditambahkan pada model Owner", async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const owner = await prisma.owner.create({
      data: {
        name: "Budi Mitra",
        email: testEmail,
        password: hashedPassword,
        whatsapp_number: testWa,
      },
    });

    expect(owner.id).toBeDefined();
    expect(owner.email).toBe(testEmail);
    expect(owner.password).toBeDefined();

    const isMatch = await bcrypt.compare(testPassword, owner.password!);
    expect(isMatch).toBe(true);

    // Pastikan owner konvensional tanpa email/password juga tetap valid
    const legacyOwner = await prisma.owner.create({
      data: {
        name: "Pak Kos Gaptek",
        whatsapp_number: "0899" + Math.floor(10000000 + Math.random() * 90000000),
      },
    });
    expect(legacyOwner.id).toBeDefined();
    expect(legacyOwner.email).toBeNull();
    expect(legacyOwner.password).toBeNull();
  });

  it("2. Validasi Token JWT untuk Mitra (OwnerTokenPayload)", async () => {
    const token = await signOwnerToken({
      ownerId: "owner-123",
      email: "partner@kospasti.id",
      name: "Partner Keren",
      whatsapp_number: "08123456789",
    });

    expect(typeof token).toBe("string");

    const payload = await verifyOwnerToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.ownerId).toBe("owner-123");
    expect(payload?.role).toBe("OWNER");
    expect(payload?.email).toBe("partner@kospasti.id");
  });

  it("3. Registrasi Mitra dan Properti Perdana via DB Transaction", async () => {
    const regEmail = "mitra_baru_" + Date.now() + "@kospasti.id";
    const regWa = "0877" + Math.floor(10000000 + Math.random() * 90000000);
    const hashedPassword = await bcrypt.hash("MitraPasti123", 10);

    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.owner.create({
        data: {
          name: "Siti Nurhaliza",
          email: regEmail,
          password: hashedPassword,
          whatsapp_number: regWa,
        },
      });

      const property = await tx.property.create({
        data: {
          name: "Kos Melati Putri Subang",
          address: "Jl. Otista No. 12 Subang",
          gender_type: "PUTRI",
          price_per_month: 750000,
          available_rooms: 8,
          facilities: "AC, WiFi, Kasur, Lemari",
          rules: "Khusus putri dan mahasiswi",
          owner_id: owner.id,
        },
      });

      return { owner, property };
    });

    expect(result.owner.id).toBeDefined();
    expect(result.property.owner_id).toBe(result.owner.id);
    expect(result.property.available_rooms).toBe(8);
  });

  it("4. Update cepat ketersediaan kamar (+/-) secara langsung", async () => {
    // Buat properti dummy
    const owner = await prisma.owner.create({
      data: {
        name: "Owner Update Kamar",
        whatsapp_number: "0812" + Math.floor(10000000 + Math.random() * 90000000),
      },
    });

    const prop = await prisma.property.create({
      data: {
        name: "Kos Mawar Indah",
        gender_type: "PUTRA",
        price_per_month: 600000,
        available_rooms: 4,
        facilities: "WiFi, Kasur",
        owner_id: owner.id,
        status: "PUBLISHED",
      },
    });

    // Simulasi tombol (+)
    const updatedPlus = await prisma.property.update({
      where: { id: prop.id },
      data: { available_rooms: prop.available_rooms + 1 },
    });
    expect(updatedPlus.available_rooms).toBe(5);

    // Simulasi tombol (-)
    const updatedMinus = await prisma.property.update({
      where: { id: prop.id },
      data: { available_rooms: updatedPlus.available_rooms - 1 },
    });
    expect(updatedMinus.available_rooms).toBe(4);
  });

  it("5. Persetujuan & Penolakan Pesanan Sewa oleh Mitra", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Owner Booking Approval",
        whatsapp_number: "0812" + Math.floor(10000000 + Math.random() * 90000000),
      },
    });
    const property = await prisma.property.create({
      data: {
        name: "Kos Approval Test",
        gender_type: "CAMPUR",
        price_per_month: 500000,
        available_rooms: 2,
        facilities: "WiFi",
        owner_id: owner.id,
        status: "PUBLISHED",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        student_name: "Ahmad Mahasiswa",
        student_whatsapp: "085812345678",
        move_in_date: new Date(),
        status: "PENDING",
        property_id: property.id,
      },
    });

    expect(booking.status).toBe("PENDING");

    // Mitra menyetujui pesanan
    const approved = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "APPROVED" },
    });
    expect(approved.status).toBe("APPROVED");

    // Mitra menolak pesanan
    const rejected = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "REJECTED" },
    });
    expect(rejected.status).toBe("REJECTED");
  });
});
