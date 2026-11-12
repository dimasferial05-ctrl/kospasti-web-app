import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";
import { notifyVisitRescheduledByStudent } from "@/lib/notifications";
import {
  MAX_STUDENT_VISIT_RESCHEDULES,
  STUDENT_RESCHEDULABLE_VISIT_STATUSES,
  parseVisitDateInput,
  isPastVisitDate,
  formatVisitDateId,
  type VisitStatus,
} from "@/lib/visit-schedule";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;
    const userPayload = userToken ? await verifyUserToken(userToken) : null;

    if (!userPayload?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const { visitDate, visitTimeSlot, notes } = body as Record<string, unknown>;

    if (typeof visitDate !== "string" || !visitDate.trim()) {
      return NextResponse.json(
        { success: false, error: "Tanggal rencana survei baru wajib dipilih." },
        { status: 400 }
      );
    }

    const parsedDate = parseVisitDateInput(visitDate);
    if (!parsedDate || isPastVisitDate(parsedDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tanggal survei baru tidak valid atau lebih awal dari hari ini.",
        },
        { status: 400 }
      );
    }

    const resolvedTimeSlot =
      typeof visitTimeSlot === "string" ? visitTimeSlot.trim() : "";
    if (resolvedTimeSlot.length < 3 || resolvedTimeSlot.length > 60) {
      return NextResponse.json(
        { success: false, error: "Sesi atau jam kunjungan baru wajib dipilih." },
        { status: 400 }
      );
    }

    const resolvedNotes =
      typeof notes === "string" ? notes.trim().slice(0, 500) || null : undefined;

    const existing = await prisma.visitSchedule.findFirst({
      where: {
        id,
        user_id: userPayload.userId,
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                whatsapp_number: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Jadwal survei tidak ditemukan atau bukan milik akun Anda.",
        },
        { status: 404 }
      );
    }

    if (!STUDENT_RESCHEDULABLE_VISIT_STATUSES.includes(existing.status as VisitStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Jadwal survei dengan status saat ini tidak dapat diubah lagi.",
        },
        { status: 409 }
      );
    }

    if ((existing.student_reschedule_count ?? 0) >= MAX_STUDENT_VISIT_RESCHEDULES) {
      return NextResponse.json(
        {
          success: false,
          code: "RESCHEDULE_LIMIT_REACHED",
          error:
            "Anda sudah menggunakan kesempatan ubah jadwal (maksimal 1x) untuk kos ini.",
        },
        { status: 409 }
      );
    }

    const currentEffectiveDateFormatted = formatVisitDateId(
      existing.reschedule_date || existing.visit_date
    );
    const currentEffectiveSlot =
      existing.reschedule_time_slot || existing.visit_time_slot;
    const newVisitDateFormatted = formatVisitDateId(parsedDate);

    if (
      newVisitDateFormatted === currentEffectiveDateFormatted &&
      resolvedTimeSlot === currentEffectiveSlot
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Silakan pilih tanggal atau jam kunjungan yang berbeda dari jadwal saat ini.",
        },
        { status: 400 }
      );
    }

    const magicToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const updatedVisit = await prisma.$transaction(async (tx) => {
      // Nonaktifkan tautan Magic Link lama agar tidak terjadi konflik keputusan
      await tx.magicLink.updateMany({
        where: {
          visit_id: existing.id,
          type: "VISIT_VERIFICATION",
          is_used: false,
        },
        data: { is_used: true },
      });

      const visit = await tx.visitSchedule.update({
        where: { id: existing.id },
        data: {
          visit_date: parsedDate,
          visit_time_slot: resolvedTimeSlot,
          notes: resolvedNotes !== undefined ? resolvedNotes : existing.notes,
          status: "PENDING",
          reschedule_date: null,
          reschedule_time_slot: null,
          reschedule_note: null,
          student_reschedule_count: { increment: 1 },
        },
      });

      await tx.magicLink.create({
        data: {
          token: magicToken,
          type: "VISIT_VERIFICATION",
          expires_at: expiresAt,
          owner_id: existing.property.owner_id,
          visit_id: existing.id,
        },
      });

      return visit;
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
      /\/+$/,
      ""
    );
    const verificationUrl = `${baseUrl}/survey/verify/${magicToken}`;

    await notifyVisitRescheduledByStudent({
      propertyName: existing.property.name,
      ownerId: existing.property.owner.id,
      ownerName: existing.property.owner.name,
      ownerWhatsapp: existing.property.owner.whatsapp_number,
      userId: existing.user_id,
      studentName: existing.student_name,
      studentWhatsapp: existing.student_whatsapp,
      newVisitDateFormatted,
      newVisitTimeSlot: resolvedTimeSlot,
      note: resolvedNotes !== undefined ? resolvedNotes : existing.notes,
      verificationUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Permintaan perubahan jadwal survei berhasil dikirim! Pemilik kos akan mengonfirmasi ulang melalui WhatsApp.",
        visit: updatedVisit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengubah jadwal survei penyewa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat memproses perubahan jadwal survei.",
      },
      { status: 500 }
    );
  }
}

