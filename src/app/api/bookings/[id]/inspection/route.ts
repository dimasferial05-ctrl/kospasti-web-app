import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken, verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { createInAppNotification } from "@/lib/notifications";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Helper untuk memvalidasi otentikasi user (Mahasiswa) atau owner (Mitra).
 */
async function authenticateRequest() {
  const cookieStore = await cookies();
  const userToken = cookieStore.get("user_token")?.value;
  const partnerToken = cookieStore.get("partner_token")?.value;

  let userPayload = null;
  let ownerPayload = null;

  if (userToken) {
    userPayload = await verifyUserToken(userToken);
  }
  if (partnerToken) {
    ownerPayload = await verifyOwnerToken(partnerToken);
  }

  return { userPayload, ownerPayload };
}

/**
 * GET /api/bookings/[id]/inspection
 * Mengambil data berita acara digital serah terima kamar (Check-in Inspection).
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await props.params;
    const { userPayload, ownerPayload } = await authenticateRequest();

    if (!userPayload && !ownerPayload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            owner_id: true,
          },
        },
        room_type: {
          select: {
            id: true,
            name: true,
          },
        },
        room_unit: {
          select: {
            id: true,
            unit_number: true,
            floor: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
          },
        },
        checkin_inspection: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pengecekan Anti-IDOR:
    // Jika login sebagai user biasa (mahasiswa), pastikan booking.user_id cocok.
    // Jika login sebagai mitra (pemilik), pastikan booking.property.owner_id cocok.
    const isTenant = Boolean(userPayload && booking.user_id === userPayload.userId);
    const isOwner = Boolean(ownerPayload && booking.property && booking.property.owner_id === ownerPayload.ownerId);

    if (!isTenant && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak memiliki akses ke pesanan ini." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          property_name: booking.property?.name ?? "Properti Kos",
          property_address: booking.property?.address ?? "",
          room_type_name: booking.room_type?.name ?? null,
          room_unit_number: booking.room_unit?.unit_number ?? null,
          student_name: booking.student_name,
          student_whatsapp: booking.student_whatsapp,
          move_in_date: booking.move_in_date,
        },
        inspection: booking.checkin_inspection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil data inspeksi kamar:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/[id]/inspection
 * Mengunggah dan mengunci data berita acara inspeksi serah terima kamar.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await props.params;
    const { userPayload, ownerPayload } = await authenticateRequest();

    if (!userPayload && !ownerPayload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            owner_id: true,
          },
        },
        checkin_inspection: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan." },
        { status: 404 }
      );
    }

    const isTenant = userPayload && booking.user_id === userPayload.userId;
    const isOwner = ownerPayload && booking.property.owner_id === ownerPayload.ownerId;

    if (!isTenant && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak memiliki hak untuk menginspeksi pesanan ini." },
        { status: 403 }
      );
    }

    // Hanya status APPROVED, ACCEPTED, atau COMPLETED yang bisa diinspeksi
    const validStatuses = ["APPROVED", "ACCEPTED", "COMPLETED"];
    if (!validStatuses.includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Inspeksi hanya dapat dilakukan pada pesanan yang sudah disetujui atau aktif (status saat ini: ${booking.status}).`,
        },
        { status: 400 }
      );
    }

    // Jika inspeksi sudah ada dan terkunci, cegah modifikasi sepihak kecuali tenant_confirmed
    if (booking.checkin_inspection && booking.checkin_inspection.is_locked) {
      // Periksa apakah ini aksi konfirmasi dari penyewa
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        if (body.action === "CONFIRM_TENANT" && isTenant) {
          const updated = await prisma.checkinInspection.update({
            where: { booking_id: bookingId },
            data: {
              tenant_confirmed_at: new Date(),
            },
          });
          return NextResponse.json({
            success: true,
            message: "Berita acara inspeksi berhasil disetujui oleh penyewa.",
            inspection: updated,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Berita acara serah terima kamar sudah dikunci dan tidak dapat diubah lagi.",
        },
        { status: 400 }
      );
    }

    // Parse multipart form-data
    const formData = await request.formData();

    const inspectorRole = isOwner ? "PARTNER" : "TENANT";

    const acCondition = (formData.get("ac_condition") as string) || "GOOD";
    const acNotes = (formData.get("ac_notes") as string) || null;
    const acFile = formData.get("ac_file") as File | null;

    const bedCondition = (formData.get("bed_condition") as string) || "GOOD";
    const bedNotes = (formData.get("bed_notes") as string) || null;
    const bedFile = formData.get("bed_file") as File | null;

    const wallsCondition = (formData.get("walls_condition") as string) || "GOOD";
    const wallsNotes = (formData.get("walls_notes") as string) || null;
    const wallsFile = formData.get("walls_file") as File | null;

    const bathroomCondition = (formData.get("bathroom_condition") as string) || "GOOD";
    const bathroomNotes = (formData.get("bathroom_notes") as string) || null;
    const bathroomFile = formData.get("bathroom_file") as File | null;

    const generalNotes = (formData.get("general_notes") as string) || null;

    // Upload foto-foto bila ada
    let acPhotoUrl = null;
    let bedPhotoUrl = null;
    let wallsPhotoUrl = null;
    let bathroomPhotoUrl = null;

    if (acFile && acFile.size > 0) {
      const res = await saveUploadedFile(acFile, "inspections");
      acPhotoUrl = res.url;
    }
    if (bedFile && bedFile.size > 0) {
      const res = await saveUploadedFile(bedFile, "inspections");
      bedPhotoUrl = res.url;
    }
    if (wallsFile && wallsFile.size > 0) {
      const res = await saveUploadedFile(wallsFile, "inspections");
      wallsPhotoUrl = res.url;
    }
    if (bathroomFile && bathroomFile.size > 0) {
      const res = await saveUploadedFile(bathroomFile, "inspections");
      bathroomPhotoUrl = res.url;
    }

    // Multiple additional files
    const additionalFiles = formData.getAll("additional_files") as File[];
    const additionalUrls: string[] = [];
    for (const file of additionalFiles) {
      if (file && file.size > 0) {
        const res = await saveUploadedFile(file, "inspections");
        additionalUrls.push(res.url);
      }
    }

    // Upsert record CheckinInspection
    const inspection = await prisma.checkinInspection.upsert({
      where: { booking_id: bookingId },
      update: {
        inspector_role: inspectorRole,
        inspected_at: new Date(),
        ac_condition: acCondition,
        ac_notes: acNotes,
        ...(acPhotoUrl ? { ac_photo_url: acPhotoUrl } : {}),
        bed_condition: bedCondition,
        bed_notes: bedNotes,
        ...(bedPhotoUrl ? { bed_photo_url: bedPhotoUrl } : {}),
        walls_condition: wallsCondition,
        walls_notes: wallsNotes,
        ...(wallsPhotoUrl ? { walls_photo_url: wallsPhotoUrl } : {}),
        bathroom_condition: bathroomCondition,
        bathroom_notes: bathroomNotes,
        ...(bathroomPhotoUrl ? { bathroom_photo_url: bathroomPhotoUrl } : {}),
        general_notes: generalNotes,
        additional_photos: additionalUrls.length > 0 ? JSON.stringify(additionalUrls) : null,
        is_locked: true,
        tenant_confirmed_at: isTenant ? new Date() : null,
      },
      create: {
        booking_id: bookingId,
        inspector_role: inspectorRole,
        inspected_at: new Date(),
        ac_condition: acCondition,
        ac_notes: acNotes,
        ac_photo_url: acPhotoUrl,
        bed_condition: bedCondition,
        bed_notes: bedNotes,
        bed_photo_url: bedPhotoUrl,
        walls_condition: wallsCondition,
        walls_notes: wallsNotes,
        walls_photo_url: wallsPhotoUrl,
        bathroom_condition: bathroomCondition,
        bathroom_notes: bathroomNotes,
        bathroom_photo_url: bathroomPhotoUrl,
        general_notes: generalNotes,
        additional_photos: additionalUrls.length > 0 ? JSON.stringify(additionalUrls) : null,
        is_locked: true,
        tenant_confirmed_at: isTenant ? new Date() : null,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com";
    const inspectionLink = `${appUrl}/inspection/${bookingId}`;

    // Kirim notifikasi In-App ke penyewa jika yang membuat adalah mitra
    if (isOwner && booking.user_id) {
      await createInAppNotification({
        userId: booking.user_id,
        title: "📋 Berita Acara Kondisi Kamar Tersedia",
        message: `Pemilik ${booking.property.name} telah mendokumentasikan kondisi awal fasilitas kamar Anda saat serah terima. Klik untuk meninjau bukti baseline.`,
        type: "BOOKING_STATUS",
        link: `/inspection/${bookingId}`,
      });

      if (booking.student_whatsapp) {
        const waMsg = `📋 *BERITA ACARA SERAH TERIMA KAMAR (BAST)*\n\nHalo Kak *${booking.student_name}*,\nKondisi fasilitas awal kamar Anda di *${booking.property.name}* telah didokumentasikan dan dikunci secara digital sebagai bukti autentik jaminan deposit.\n\nDetail Kondisi:\n- AC: ${acCondition}\n- Kasur: ${bedCondition}\n- Dinding: ${wallsCondition}\n- Kamar Mandi: ${bathroomCondition}\n\nLihat bukti foto & dokumen resmi BAST di sini:\n${inspectionLink}\n\n_Tim KosPasti - Garansi 100% Sesuai Aslinya_`;
        await sendWhatsAppMessage({ to: booking.student_whatsapp, message: waMsg }).catch((err) =>
          console.error("Gagal kirim WA BAST ke penyewa:", err)
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Berita acara inspeksi kamar berhasil disimpan dan dikunci.",
        inspection,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Gagal menyimpan inspeksi kamar:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan inspeksi kamar." },
      { status: 500 }
    );
  }
}
