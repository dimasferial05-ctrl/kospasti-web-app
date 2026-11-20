import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyDetail, type PropertyDetail, type RoomTypeItem } from "@/lib/property-detail";
import { generateLodgingJsonLd } from "@/lib/seo";
import PropertyDetailClient from "@/components/property-detail/PropertyDetailClient";

export type { PropertyDetail, RoomTypeItem };

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyDetail(id);

  if (!property) {
    return {
      title: "Kos Tidak Ditemukan - KosPasti",
      description: "Data properti kos yang Anda cari tidak tersedia atau belum dipublikasikan.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com";
  const cleanAppUrl = appUrl.replace(/\/+$/, "");
  const formattedPrice = `Rp ${Number(property.price_per_month || 0).toLocaleString("id-ID")}`;
  const title = `${property.name} - Sewa Kos di Subang | KosPasti`;
  const description =
    property.description?.slice(0, 160) ||
    `Sewa kos ${property.name} (${property.gender_type}) di Subang mulai ${formattedPrice}/bulan dengan kepastian kamar real-time.`;

  return {
    title,
    description,
    openGraph: {
      title: `${property.name} - KosPasti`,
      description,
      url: `${cleanAppUrl}/kos/${property.id}`,
      type: "website",
      images: property.image_url ? [{ url: property.image_url }] : [],
    },
    alternates: {
      canonical: `${cleanAppUrl}/kos/${property.id}`,
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyDetail(id);

  if (!property) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com";
  const jsonLd = generateLodgingJsonLd(property, appUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient initialProperty={property} />
    </>
  );
}
