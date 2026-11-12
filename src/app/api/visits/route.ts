import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyUserToken, verifyOwnerToken } from "@/lib/auth";
import { notifyVisitRequested } from "@/lib/notifications";
import {
  isValidIndonesianWhatsApp,
  parseVisitDateInput,
  isPastVisitDate,
  formatVisitDateId,
} from "@/lib/visit-schedule";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;
    const userPayload = userToken ? await verifyUserToken(userToken) : null;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const {
      propertyId,
      studentName,
      studentWhatsapp,
      visitDate,
      visitTimeSlot,
      notes,
    } = body as Record<string, unknown>;

    // Jika login, lengkapi nama/WA dari akun bila tidak dikirim eksplisit
    let dbUser: { id: string; name: string; whatsapp: string | null } | null = null;
    if (userPayload?.userId) {
      dbUser = await prisma.user
        .findUnique({
          where: { id: userPayload.userId },
          select: { id: true, name: true, whatsapp: true },
        })
        .catch(() => null);
    }

    const resolvedName =
      typeof studentName === "string" && studentName.trim()
        ? studentName.trim()
        : (dbUser?.name || userPayload?.name || "").trim();

    const resolvedWhatsapp =
      typeof studentWhatsapp === "string" && studentWhatsapp.trim()
        ? studentWhatsapp.trim()
        : (dbUser?.whatsapp || userPayload?.whatsapp || "").trim();

    const resolvedPropertyId =
      typeof propertyId === "string" ? propertyId.trim() : "";
    const resolvedTimeSlot =
      typeof visitTimeSlot === "string" ? visitTimeSlot.trim() : "";
    const resolvedNotes =
      typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null;

    if (!resolvedPropertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti kos wajib disertakan." },
        { status: 400 }
      );
    }

    if (resolvedName.length < 2 || resolvedName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama lengkap wajib diisi (minimal 2 karakter).",
        },
        { status: 400 }
      );
    }

    if (!isValidIndonesianWhatsApp(resolvedWhatsapp)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format nomor WhatsApp tidak valid. Gunakan awalan 08 atau 628 (maksimal 15 karakter).",
        },
        { status: 400 }
      );
    }

    if (typeof visitDate !== "string" || !visitDate.trim()) {
      return NextResponse.json(
        { success: false, error: "Tanggal rencana survei wajib dipilih." },
        { status: 400 }
      );
    }

    const parsedDate = parseVisitDateInput(visitDate);
    if (!parsedDate) {
      return NextResponse.json(
        { success: false, error: "Format tanggal survei tidak valid." },
        { status: 400 }
      );
    }

    if (isPastVisitDate(parsedDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tanggal survei tidak boleh lebih awal dari hari ini.",
        },
        { status: 400 }
      );
    }

    if (resolvedTimeSlot.length < 3 || resolvedTimeSlot.length > 60) {
      return NextResponse.json(
        { success: false, error: "Sesi atau jam kunjungan wajib dipilih." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: resolvedPropertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
      },
    });

    if (!property || property.status === "REJECTED") {
      return NextResponse.json(
        { success: false, error: "Properti kos tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cegah duplikasi pengajuan identik yang masih PENDING
    const duplicatePending = await prisma.visitSchedule.findFirst({
      where: {
        property_id: property.id,
        student_whatsapp: resolvedWhatsapp,
        visit_date: parsedDate,
        visit_time_slot: resolvedTimeSlot,
        status: "PENDING",
      },
    });

    if (duplicatePending) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Anda sudah mengajukan jadwal survei pada tanggal dan jam yang sama dan sedang menunggu konfirmasi pemilik.",
        },
        { status: 409 }
      );
    }

    const magicToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Berlaku 48 jam

    const createdVisit = await prisma.$transaction(async (tx) => {
      const visit = await tx.visitSchedule.create({
        data: {
          property_id: property.id,
          user_id: dbUser?.id || userPayload?.userId || null,
          student_name: resolvedName,
          student_whatsapp: resolvedWhatsapp,
          visit_date: parsedDate,
          visit_time_slot: resolvedTimeSlot,
          notes: resolvedNotes,
          status: "PENDING",
        },
      });

      await tx.magicLink.create({
        data: {
          token: magicToken,
          type: "VISIT_VERIFICATION",
          expires_at: expiresAt,
          owner_id: property.owner_id,
          visit_id: visit.id,
        },
      });

      return visit;
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
      /\/+$/,
      ""
    );
    const verificationUrl = `${baseUrl}/survey/verify/${magicToken}`;
    const visitDateFormatted = formatVisitDateId(parsedDate);

    await notifyVisitRequested({
      visitId: createdVisit.id,
      propertyId: property.id,
      propertyName: property.name,
      ownerId: property.owner.id,
      ownerName: property.owner.name,
      ownerWhatsapp: property.owner.whatsapp_number,
      userId: createdVisit.user_id,
      studentName: resolvedName,
      studentWhatsapp: resolvedWhatsapp,
      visitDateFormatted,
      visitTimeSlot: resolvedTimeSlot,
      notes: resolvedNotes,
      verificationUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Permintaan jadwal survei berhasil dikirim! Pemilik kos akan segera mengonfirmasi melalui WhatsApp.",
        data: {
          visitId: createdVisit.id,
          status: createdVisit.status,
          visitDate: createdVisit.visit_date,
          visitTimeSlot: createdVisit.visit_time_slot,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal membuat jadwal survei lokasi:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat mengajukan jadwal survei.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const audienceParam = searchParams.get("audience")?.toUpperCase();

    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;
    const userToken = cookieStore.get("user_token")?.value;

    const ownerPayload = partnerToken ? await verifyOwnerToken(partnerToken) : null;
    const userPayload = userToken ? await verifyUserToken(userToken) : null;

    if (audienceParam === "OWNER" || (!audienceParam && ownerPayload && !userPayload)) {
      if (!ownerPayload?.ownerId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const visits = await prisma.visitSchedule.findMany({
        where: {
          property: {
            owner_id: ownerPayload.ownerId,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              image_url: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
            },
          },
        },
        orderBy: [{ visit_date: "asc" }, { created_at: "desc" }],
      });

      return NextResponse.json({ success: true, visits }, { status: 200 });
    }

    if (!userPayload?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const visits = await prisma.visitSchedule.findMany({
      where: {
        user_id: userPayload.userId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            image_url: true,
            price_per_month: true,
            owner: {
              select: {
                name: true,
                whatsapp_number: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, visits }, { status: 200 });
  } catch (error) {
    console.error("Gagal memuat daftar jadwal survei:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memuat jadwal survei." },
      { status: 500 }
    );
  }
}

