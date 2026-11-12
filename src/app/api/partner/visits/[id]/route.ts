import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyOwnerToken } from "@/lib/auth";
import { notifyVisitDecision } from "@/lib/notifications";
import {
  parseVisitDateInput,
  isPastVisitDate,
  formatVisitDateId,
} from "@/lib/visit-schedule";

type PartnerVisitAction = "ACCEPT" | "REJECT" | "RESCHEDULE" | "COMPLETE";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ownerPayload = await verifyOwnerToken(partnerToken);
    if (!ownerPayload?.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const action = body?.action as PartnerVisitAction | undefined;
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (
      action !== "ACCEPT" &&
      action !== "REJECT" &&
      action !== "RESCHEDULE" &&
      action !== "COMPLETE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Aksi harus bernilai ACCEPT, REJECT, RESCHEDULE, atau COMPLETE.",
        },
        { status: 400 }
      );
    }

    let parsedRescheduleDate: Date | null = null;
    let resolvedRescheduleSlot = "";

    if (action === "RESCHEDULE") {
      if (typeof body.rescheduleDate !== "string" || !body.rescheduleDate.trim()) {
        return NextResponse.json(
          { success: false, error: "Tanggal usulan baru wajib diisi." },
          { status: 400 }
        );
      }

      parsedRescheduleDate = parseVisitDateInput(body.rescheduleDate);
      if (!parsedRescheduleDate || isPastVisitDate(parsedRescheduleDate)) {
        return NextResponse.json(
          {
            success: false,
            error: "Tanggal jadwal ulang tidak valid atau lebih awal dari hari ini.",
          },
          { status: 400 }
        );
      }

      resolvedRescheduleSlot =
        typeof body.rescheduleTimeSlot === "string"
          ? body.rescheduleTimeSlot.trim()
          : "";

      if (resolvedRescheduleSlot.length < 3 || resolvedRescheduleSlot.length > 60) {
        return NextResponse.json(
          { success: false, error: "Sesi jam usulan baru wajib dipilih." },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.visitSchedule.findFirst({
      where: {
        id,
        property: {
          owner_id: ownerPayload.ownerId,
        },
      },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Jadwal survei tidak ditemukan atau bukan milik properti Anda.",
        },
        { status: 404 }
      );
    }

    const targetStatus =
      action === "ACCEPT"
        ? "ACCEPTED"
        : action === "REJECT"
        ? "REJECTED"
        : action === "RESCHEDULE"
        ? "RESCHEDULED"
        : "COMPLETED";

    const updatedVisit = await prisma.$transaction(async (tx) => {
      await tx.magicLink.updateMany({
        where: {
          visit_id: existing.id,
          is_used: false,
        },
        data: { is_used: true },
      });

      return tx.visitSchedule.update({
        where: { id: existing.id },
        data: {
          status: targetStatus,
          ...(action === "RESCHEDULE"
            ? {
                reschedule_date: parsedRescheduleDate,
                reschedule_time_slot: resolvedRescheduleSlot,
                reschedule_note: note || null,
              }
            : {}),
          ...(action === "ACCEPT" && note ? { reschedule_note: note } : {}),
          ...(action === "REJECT" ? { cancellation_reason: note || null } : {}),
        },
      });
    });

    if (action === "ACCEPT" || action === "REJECT" || action === "RESCHEDULE") {
      await notifyVisitDecision({
        action,
        propertyId: existing.property_id,
        propertyName: existing.property.name,
        propertyAddress: existing.property.address,
        ownerName: existing.property.owner.name,
        ownerWhatsapp: existing.property.owner.whatsapp_number,
        userId: existing.user_id,
        studentName: existing.student_name,
        studentWhatsapp: existing.student_whatsapp,
        visitDateFormatted: formatVisitDateId(existing.visit_date),
        visitTimeSlot: existing.visit_time_slot,
        rescheduleDateFormatted: parsedRescheduleDate
          ? formatVisitDateId(parsedRescheduleDate)
          : null,
        rescheduleTimeSlot: resolvedRescheduleSlot || null,
        note: note || null,
      });
    }

    return NextResponse.json(
      {
        success: true,
        status: targetStatus,
        visit: updatedVisit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memperbarui jadwal survei mitra:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat memperbarui status jadwal survei.",
      },
      { status: 500 }
    );
  }
}

