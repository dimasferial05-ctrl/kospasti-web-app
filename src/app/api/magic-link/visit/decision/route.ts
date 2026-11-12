import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyVisitDecision } from "@/lib/notifications";
import {
  parseVisitDateInput,
  isPastVisitDate,
  formatVisitDateId,
} from "@/lib/visit-schedule";

type DecisionAction = "ACCEPT" | "REJECT" | "RESCHEDULE";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.token !== "string" || !body.token.trim()) {
      return NextResponse.json(
        { success: false, error: "Parameter token diperlukan." },
        { status: 400 }
      );
    }

    const token = body.token.trim();
    const action = body.action as DecisionAction;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (action !== "ACCEPT" && action !== "REJECT" && action !== "RESCHEDULE") {
      return NextResponse.json(
        {
          success: false,
          error: "Aksi tidak valid. Nilai harus 'ACCEPT', 'REJECT', atau 'RESCHEDULE'.",
        },
        { status: 400 }
      );
    }

    let parsedRescheduleDate: Date | null = null;
    let resolvedRescheduleSlot = "";

    if (action === "RESCHEDULE") {
      if (typeof body.rescheduleDate !== "string" || !body.rescheduleDate.trim()) {
        return NextResponse.json(
          { success: false, error: "Tanggal usulan baru wajib diisi untuk jadwal ulang." },
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
        typeof body.rescheduleTimeSlot === "string" ? body.rescheduleTimeSlot.trim() : "";

      if (resolvedRescheduleSlot.length < 3 || resolvedRescheduleSlot.length > 60) {
        return NextResponse.json(
          { success: false, error: "Sesi atau jam usulan baru wajib dipilih." },
          { status: 400 }
        );
      }
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: {
        owner: true,
        visit: {
          include: {
            property: true,
            user: true,
          },
        },
      },
    });

    if (!magicLink || magicLink.type !== "VISIT_VERIFICATION") {
      return NextResponse.json(
        { success: false, error: "Tautan verifikasi survei tidak ditemukan." },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi ini sudah pernah digunakan sebelumnya.",
        },
        { status: 410 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        { success: false, error: "Tautan verifikasi survei sudah kedaluwarsa." },
        { status: 410 }
      );
    }

    if (!magicLink.visit) {
      return NextResponse.json(
        { success: false, error: "Data jadwal survei tidak ditemukan." },
        { status: 400 }
      );
    }

    const visit = magicLink.visit;
    const targetStatus =
      action === "ACCEPT"
        ? "ACCEPTED"
        : action === "RESCHEDULE"
        ? "RESCHEDULED"
        : "REJECTED";

    const txResult = await prisma.$transaction(async (tx) => {
      const consumed = await tx.magicLink.updateMany({
        where: { id: magicLink.id, is_used: false },
        data: { is_used: true },
      });

      if (consumed.count === 0) {
        return { alreadyUsed: true, updatedVisit: null };
      }

      const updatedVisit = await tx.visitSchedule.update({
        where: { id: visit.id },
        data: {
          status: targetStatus,
          reschedule_date: action === "RESCHEDULE" ? parsedRescheduleDate : null,
          reschedule_time_slot: action === "RESCHEDULE" ? resolvedRescheduleSlot : null,
          reschedule_note:
            action === "RESCHEDULE" || action === "ACCEPT" ? note || null : null,
          cancellation_reason: action === "REJECT" ? note || null : null,
        },
      });

      return { alreadyUsed: false, updatedVisit };
    });

    if (txResult.alreadyUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi ini sudah pernah digunakan atau sedang diproses.",
        },
        { status: 410 }
      );
    }

    await notifyVisitDecision({
      action,
      propertyId: visit.property_id,
      propertyName: visit.property.name,
      propertyAddress: visit.property.address,
      ownerName: magicLink.owner.name,
      ownerWhatsapp: magicLink.owner.whatsapp_number,
      userId: visit.user_id,
      studentName: visit.student_name,
      studentWhatsapp: visit.student_whatsapp,
      visitDateFormatted: formatVisitDateId(visit.visit_date),
      visitTimeSlot: visit.visit_time_slot,
      rescheduleDateFormatted: parsedRescheduleDate
        ? formatVisitDateId(parsedRescheduleDate)
        : null,
      rescheduleTimeSlot: resolvedRescheduleSlot || null,
      note: note || null,
    });

    const responseMessages: Record<DecisionAction, string> = {
      ACCEPT: "Jadwal survei berhasil disetujui. Calon penyewa telah menerima notifikasi.",
      REJECT: "Jadwal survei telah ditolak. Calon penyewa telah menerima pemberitahuan.",
      RESCHEDULE:
        "Usulan jadwal ulang berhasil dikirimkan kepada calon penyewa.",
    };

    return NextResponse.json(
      {
        success: true,
        message: responseMessages[action],
        action,
        status: targetStatus,
        visit: txResult.updatedVisit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing visit decision:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memproses keputusan survei.",
      },
      { status: 500 }
    );
  }
}

