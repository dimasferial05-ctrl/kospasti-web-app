import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";
import { createInAppNotification } from "@/lib/notifications";
import { saveUploadedFiles } from "@/lib/upload";
import { updatePropertyReviewStats } from "@/lib/propertyReviewStats";

async function authenticateUser(request?: NextRequest) {
  const cookieStore = await cookies();
  const tokenFromStore = cookieStore.get("user_token")?.value;
  const tokenFromReq = request?.cookies?.get("user_token")?.value;
  const userToken = tokenFromStore || tokenFromReq;

  if (!userToken) {
    return null;
  }

  const payload = await verifyUserToken(userToken);
  return payload;
}

/**
 * GET /api/properties/[id]/reviews
 * Mengambil daftar ulasan publik dan statistik rating untuk kos tertentu.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        property_id: propertyId,
        is_hidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        property: {
          select: {
            owner: {
              select: {
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const totalReviews = reviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let ratingSum = 0;
    let photoReviewsCount = 0;
    const allPhotos: Array<{
      url: string;
      reviewId: string;
      rating: number;
      studentName: string;
      createdAt: string;
      comment?: string | null;
    }> = [];

    for (const r of reviews) {
      ratingSum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }

      if (r.images) {
        try {
          const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
          if (Array.isArray(parsed) && parsed.length > 0) {
            photoReviewsCount++;
            for (const imgUrl of parsed) {
              if (typeof imgUrl === "string" && imgUrl.trim()) {
                allPhotos.push({
                  url: imgUrl.trim(),
                  reviewId: r.id,
                  rating: r.rating,
                  studentName: r.user?.name || "Penyewa",
                  createdAt: r.created_at.toISOString(),
                  comment: r.comment,
                });
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating,
          distribution,
          photoReviewsCount,
        },
        allPhotos,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ulasan" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties/[id]/reviews
 * Mengirim ulasan baru dari penyewa terverifikasi (Verified Tenant).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan" },
        { status: 400 }
      );
    }

    const payload = await authenticateUser(request);
    const userId = payload?.userId || (payload as { id?: string })?.id;

    if (!payload || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Silakan login terlebih dahulu untuk memberi ulasan.",
        },
        { status: 401 }
      );
    }
    let rating: any;
    let comment: any;
    let booking_id: any;
    let uploadedImages: string[] = [];

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        rating = formData.get("rating");
        comment = formData.get("comment");
        booking_id = formData.get("booking_id");

        const rawFiles = [
          ...formData.getAll("images"),
          ...formData.getAll("photos"),
        ];

        const filesToUpload: File[] = [];
        for (const item of rawFiles) {
          if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
            filesToUpload.push(item as File);
          }
        }

        // Batasi maksimal 3 foto kamar asli
        if (filesToUpload.length > 3) {
          return NextResponse.json(
            { success: false, error: "Maksimal 3 foto ulasan yang dapat diunggah." },
            { status: 400 }
          );
        }

        // Validasi tipe file dan batas ukuran (maksimal 5MB)
        for (const f of filesToUpload) {
          const mime = (f.type || "").toLowerCase();
          const ext = f.name ? path.extname(f.name).toLowerCase() : "";
          const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
          const isAllowedImage =
            (mime.startsWith("image/") &&
              (mime.includes("jpeg") ||
                mime.includes("jpg") ||
                mime.includes("png") ||
                mime.includes("webp"))) ||
            allowedExts.includes(ext);

          if (!isAllowedImage) {
            return NextResponse.json(
              {
                success: false,
                error: `Format file '${f.name}' tidak didukung. Harap unggah foto berekstensi JPG, PNG, atau WEBP.`,
              },
              { status: 400 }
            );
          }

          if (f.size > 5 * 1024 * 1024) {
            return NextResponse.json(
              { success: false, error: `Ukuran foto '${f.name}' melebihi batas maksimal 5MB.` },
              { status: 400 }
            );
          }
        }

        if (filesToUpload.length > 0) {
          const uploadResults = await saveUploadedFiles(filesToUpload, "reviews");
          uploadedImages = uploadResults.map((r) => r.url);
        }
      } catch (err: any) {
        console.error("Gagal memproses FormData ulasan:", err);
        return NextResponse.json(
          { success: false, error: err.message || "Gagal mengunggah foto ulasan" },
          { status: 400 }
        );
      }
    } else {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, error: "Format data request tidak valid" },
          { status: 400 }
        );
      }

      rating = body?.rating;
      comment = body?.comment;
      booking_id = body?.booking_id;

      if (Array.isArray(body?.images)) {
        if (body.images.length > 3) {
          return NextResponse.json(
            { success: false, error: "Maksimal 3 foto ulasan yang dapat diunggah." },
            { status: 400 }
          );
        }
        uploadedImages = body.images.filter(
          (img: any) => typeof img === "string" && img.trim().length > 0
        );
      }
    }

    // Validasi rating
    const parsedRating = Number(rating);
    if (!parsedRating || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating harus berupa angka antara 1 sampai 5" },
        { status: 400 }
      );
    }

    // Cari booking yang valid
    let targetBooking;

    if (booking_id) {
      targetBooking = await prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id: userId,
          property_id: propertyId,
          status: {
            in: ["SUCCESS", "PAID", "APPROVED", "ACCEPTED", "COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"],
          },
        },
        include: {
          review: true,
        },
      });

      if (!targetBooking) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Booking tidak ditemukan atau status belum terverifikasi (SUCCESS/PAID/APPROVED/ACCEPTED).",
          },
          { status: 403 }
        );
      }

      if (targetBooking.review) {
        return NextResponse.json(
          {
            success: false,
            error: "Ulasan sudah pernah diberikan untuk transaksi ini.",
          },
          { status: 409 }
        );
      }
    } else {
      // Cari booking terakhir yang belum diulas
      const eligibleBookings = await prisma.booking.findMany({
        where: {
          user_id: userId,
          property_id: propertyId,
          status: {
            in: ["SUCCESS", "PAID", "APPROVED", "ACCEPTED", "COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"],
          },
        },
        include: {
          review: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (eligibleBookings.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Hanya penyewa terverifikasi yang dapat memberikan ulasan.",
          },
          { status: 403 }
        );
      }

      targetBooking = eligibleBookings.find((b) => !b.review);

      if (!targetBooking) {
        return NextResponse.json(
          {
            success: false,
            error: "Anda sudah memberikan ulasan untuk seluruh pesanan kos ini.",
          },
          { status: 409 }
        );
      }
    }

    // Buat ulasan baru
    const newReview = await prisma.review.create({
      data: {
        rating: Math.round(parsedRating),
        comment: typeof comment === "string" ? comment.trim() : null,
        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
        property_id: propertyId,
        user_id: userId,
        booking_id: targetBooking.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        property: {
          select: {
            name: true,
            owner_id: true,
          },
        },
      },
    });

    // Perbarui kolom denormalisasi rating dan total ulasan pada Property secara atomik
    await updatePropertyReviewStats(propertyId);

    // Kirim notifikasi ke mitra pemilik kos bahwa propertinya mendapat ulasan baru
    if (newReview.property?.owner_id) {
      await createInAppNotification({
        ownerId: newReview.property.owner_id,
        title: `Ulasan Baru (${newReview.rating}/5 Bintang)`,
        message: `${newReview.user?.name || "Seorang penyewa"} baru saja mengulas ${newReview.property.name}${newReview.comment ? `: "${newReview.comment.slice(0, 70)}"` : "."}`,
        type: "REVIEW_REPLY",
        link: "/partner/dashboard/reviews",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Ulasan dan rating berhasil dikirim!",
        data: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal mengirim ulasan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat menyimpan ulasan" },
      { status: 500 }
    );
  }
}
