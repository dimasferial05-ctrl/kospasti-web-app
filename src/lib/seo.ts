export interface PropertySeoData {
  id: string;
  name: string;
  description?: string | null;
  price_per_month: number;
  available_rooms: number;
  address?: string | null;
  image_url?: string | null;
  facilities?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  average_rating?: number;
  total_reviews?: number;
  owner?: {
    name?: string;
    whatsapp_number?: string;
  } | null;
}

export function generateLodgingJsonLd(property: PropertySeoData, baseUrl: string) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const formattedUrl = `${cleanBase}/kos/${property.id}`;
  const facilitiesList = property.facilities
    ? property.facilities.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  const fullImageUrl = property.image_url
    ? property.image_url.startsWith("http://") || property.image_url.startsWith("https://")
      ? property.image_url
      : `${cleanBase}${property.image_url.startsWith("/") ? "" : "/"}${property.image_url}`
    : null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "Place"],
    name: property.name,
    description:
      property.description ||
      `Sewa kos ${property.name} di Subang dengan harga transparan dan kepastian kamar real-time.`,
    url: formattedUrl,
    image: fullImageUrl ? [fullImageUrl] : [],
    priceRange: `Rp ${property.price_per_month.toLocaleString("id-ID")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || "Subang",
      addressLocality: "Subang",
      addressRegion: "Jawa Barat",
      addressCountry: "ID",
    },
    offers: {
      "@type": "Offer",
      price: property.price_per_month,
      priceCurrency: "IDR",
      availability:
        property.available_rooms > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      validFrom: new Date().toISOString().split("T")[0],
    },
  };

  if (property.owner?.whatsapp_number) {
    const rawWa = property.owner.whatsapp_number.replace(/\D/g, "");
    schema.telephone = rawWa.startsWith("0") ? `+62${rawWa.slice(1)}` : `+${rawWa}`;
  }

  if (property.latitude && property.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  if (property.total_reviews && property.total_reviews > 0 && property.average_rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: property.average_rating,
      reviewCount: property.total_reviews,
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (facilitiesList.length > 0) {
    schema.amenityFeature = facilitiesList.map((facility) => ({
      "@type": "LocationFeatureSpecification",
      name: facility,
      value: true,
    }));
  }

  return schema;
}
