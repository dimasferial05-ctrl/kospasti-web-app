import { prisma } from "@/lib/prisma";

export interface PropertyMediaItem {
  id?: string;
  url: string;
  type: string; // "IMAGE" | "VIDEO"
}

export interface RoomTypeItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  facilities?: string | null;
  specifications?: string | null;
  image_url?: string | null;
}

export interface PropertyDetail {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  media?: PropertyMediaItem[];
  room_types?: RoomTypeItem[];
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  rules?: string | null;
  rental_terms?: string | null;
  youtube_url?: string | null;
  average_rating?: number;
  total_reviews?: number;
  status?: string;
  updated_at?: string;
  owner?: {
    name: string;
    whatsapp_number: string;
    avatar_url?: string | null;
  };
}

/**
 * Mengambil data detail kos beserta relasi owner, media, room_types, dan ulasan secara langsung dari database
 */
export async function getPropertyDetail(id: string): Promise<PropertyDetail | null> {
  if (!id) return null;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            whatsapp_number: true,
            avatar_url: true,
          },
        },
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
        reviews: {
          where: {
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
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!property) return null;

    const activeReviews = property.reviews || [];
    const totalReviews = activeReviews.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              activeReviews.reduce((sum, r) => sum + r.rating, 0) /
              totalReviews
            ).toFixed(1)
          )
        : (property.average_rating || 0);

    return {
      id: property.id,
      name: property.name,
      price_per_month: property.price_per_month,
      available_rooms: property.available_rooms,
      gender_type: property.gender_type,
      facilities: property.facilities,
      image_url: property.image_url,
      media: property.media,
      room_types: property.room_types,
      description: property.description,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      is_pet_friendly: property.is_pet_friendly,
      is_24_hours: property.is_24_hours,
      rules: property.rules,
      rental_terms: property.rental_terms,
      youtube_url: property.youtube_url,
      average_rating: avgRating,
      total_reviews: totalReviews || property.total_reviews || 0,
      status: property.status,
      updated_at: property.updated_at ? property.updated_at.toISOString() : undefined,
      owner: property.owner,
    };
  } catch (error) {
    console.error("Gagal mengambil detail properti dari database:", error);
    return null;
  }
}
