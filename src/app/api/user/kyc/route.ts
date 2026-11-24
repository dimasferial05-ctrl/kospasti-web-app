import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { createInAppNotification } from "@/lib/notifications";
import {
  extractIdentityCardData,
  calculateNameSimilarity,
  maskIdNumber,
} from "@/lib/kyc-ai";

/**
 * GET /api/user/kyc
 * Mengambil status verifikasi identitas (KYC) pengguna saat ini.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(token);
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        is_identity_verified: true,
        verified_at: true,
        identity_verification: {
          select: {
            id: true,
            document_type: true,
            document_photo_url: true,
            extracted_name: true,
            extracted_id_number: true,
            extracted_institution: true,
            match_confidence: true,
            verification_status: true,
            rejection_reason: true,
            verified_at: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const verification = user.identity_verification;

    return NextResponse.json(
      {
        success: true,
        is_identity_verified: user.is_identity_verified,
        verified_at: user.verified_at,
        verification: verification
          ? {
              ...verification,
              masked_id_number: maskIdNumber(verification.extracted_id_number),
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil status KYC pengguna:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/kyc
 * Mengunggah dokumen identitas (KTP/KTM), membaca OCR dengan Gemini AI,
 * dan mencocokkan nama dengan profil pengguna secara otomatis.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(token);
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        identity_verification: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika sudah terverifikasi, cegah unggah ulang
    if (user.is_identity_verified) {
      return NextResponse.json(
        {
          success: false,
          error: "Akun Anda sudah memiliki status Penyewa Terverifikasi.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const documentType = (formData.get("document_type") as "KTP" | "KTM") || "KTP";
    const documentFile = formData.get("document_file") as File | null;

    if (!documentFile || !(documentFile instanceof File) || documentFile.size === 0) {
      return NextResponse.json(
        { success: false, error: "File foto kartu identitas wajib diunggah." },
        { status: 400 }
      );
    }

    // Validasi tipe file gambar
    if (!documentFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Format file tidak didukung. Harap unggah file foto (JPG, PNG, atau WEBP)." },
        { status: 400 }
      );
    }

    // 1. Simpan foto ke Supabase Storage (bucket kospasti-media/kyc/...)
    const uploadResult = await saveUploadedFile(documentFile, "kyc");

    // 2. Baca buffer untuk Gemini Multimodal OCR
    const arrayBuffer = await documentFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Ekstraksi OCR cerdas menggunakan Gemini AI
    let ocrData;
    try {
      ocrData = await extractIdentityCardData(buffer, documentFile.type, documentType);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: err.message || "Gagal memproses gambar dokumen dengan AI.",
        },
        { status: 422 }
      );
    }

    // 4. Validasi keaslian dokumen
    if (!ocrData.is_authentic_document) {
      await prisma.tenantIdentityVerification.upsert({
        where: { user_id: user.id },
        update: {
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: 0,
          verification_status: "REJECTED",
          rejection_reason: "Dokumen yang diunggah tidak dikenali sebagai KTP atau KTM resmi yang valid.",
          ai_raw_response: ocrData.raw_response,
        },
        create: {
          user_id: user.id,
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: 0,
          verification_status: "REJECTED",
          rejection_reason: "Dokumen yang diunggah tidak dikenali sebagai KTP atau KTM resmi yang valid.",
          ai_raw_response: ocrData.raw_response,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Dokumen tidak dikenali sebagai KTP atau KTM yang valid. Pastikan Anda mengunggah foto kartu identitas asli.",
        },
        { status: 422 }
      );
    }

    // 5. Bandingkan nama profil dengan nama pada dokumen
    const extractedName = ocrData.full_name || "";
    const similarity = calculateNameSimilarity(user.name, extractedName);

    const isMatch = similarity >= 0.75;
    const now = new Date();

    if (isMatch) {
      // Verifikasi Berhasil
      const verification = await prisma.tenantIdentityVerification.upsert({
        where: { user_id: user.id },
        update: {
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: similarity,
          verification_status: "VERIFIED",
          rejection_reason: null,
          ai_raw_response: ocrData.raw_response,
          verified_at: now,
        },
        create: {
          user_id: user.id,
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: similarity,
          verification_status: "VERIFIED",
          rejection_reason: null,
          ai_raw_response: ocrData.raw_response,
          verified_at: now,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          is_identity_verified: true,
          verified_at: now,
        },
      });

      // Kirim Notifikasi In-App
      await createInAppNotification({
        userId: user.id,
        title: "🎉 Identitas Anda Berhasil Terverifikasi!",
        message: `Selamat, verifikasi ${documentType} Anda telah selesai. Profil Anda kini memiliki lencana Penyewa Terverifikasi.`,
        type: "SYSTEM",
        link: "/profil?tab=kyc",
      });

      return NextResponse.json(
        {
          success: true,
          message: "Verifikasi identitas berhasil! Akun Anda kini berstatus Penyewa Terverifikasi.",
          verification: {
            ...verification,
            masked_id_number: maskIdNumber(verification.extracted_id_number),
          },
        },
        { status: 200 }
      );
    } else {
      // Nama Tidak Cocok
      const reason = `Nama pada dokumen (${extractedName || "Tidak terbaca"}) tidak sesuai dengan nama akun Anda (${user.name}). Skor kemiripan: ${Math.round(similarity * 100)}%.`;

      const verification = await prisma.tenantIdentityVerification.upsert({
        where: { user_id: user.id },
        update: {
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: similarity,
          verification_status: "REJECTED",
          rejection_reason: reason,
          ai_raw_response: ocrData.raw_response,
        },
        create: {
          user_id: user.id,
          document_type: documentType,
          document_photo_url: uploadResult.url,
          extracted_name: ocrData.full_name,
          extracted_id_number: ocrData.id_number,
          extracted_institution: ocrData.institution,
          match_confidence: similarity,
          verification_status: "REJECTED",
          rejection_reason: reason,
          ai_raw_response: ocrData.raw_response,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: reason,
          verification: {
            ...verification,
            masked_id_number: maskIdNumber(verification.extracted_id_number),
          },
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error("Gagal memproses verifikasi KYC:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
