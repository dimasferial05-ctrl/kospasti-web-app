import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface PropertyReviewStatsResult {
  averageRating: number;
  totalReviews: number;
}

/**
 * Menghitung ulang rata-rata rating dan total ulasan aktif (is_hidden: false)
 * langsung via agregasi database dan memperbarui kolom denormalisasi Property.
 */
export async function updatePropertyReviewStats(
  propertyId: string,
  tx?: Prisma.TransactionClient | typeof prisma
): Promise<PropertyReviewStatsResult> {
  const client = tx || prisma;

  const agg = await client.review.aggregate({
    where: {
      property_id: propertyId,
      is_hidden: false,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const totalReviews = agg._count.rating || 0;
  const averageRating =
    totalReviews > 0 ? Number((agg._avg.rating || 0).toFixed(1)) : 0.0;

  await client.property.update({
    where: { id: propertyId },
    data: {
      average_rating: averageRating,
      total_reviews: totalReviews,
    },
  });

  return { averageRating, totalReviews };
}

/**
 * Utilitas untuk menyinkronkan seluruh properti di database jika diperlukan
 */
export async function syncAllPropertiesReviewStats(): Promise<number> {
  const properties = await prisma.property.findMany({
    select: { id: true },
  });

  for (const property of properties) {
    await updatePropertyReviewStats(property.id);
  }

  return properties.length;
}
