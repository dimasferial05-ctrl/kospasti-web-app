import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean up existing data in reverse order of relationships
  await prisma.booking.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();

  console.log("🧹 Cleaned up existing records.");

  const oneWeekLater = new Date();
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);

  // 1. Owner 1: Pak Bambang (Kos Putra)
  const owner1 = await prisma.owner.create({
    data: {
      name: "Bambang Sudarsono",
      whatsapp_number: "6281234567890",
      properties: {
        create: [
          {
            name: "Kos Mawar Putra",
            price_per_month: 850000,
            available_rooms: 3,
            gender_type: "PUTRA",
            facilities: "WiFi, Kasur, Lemari, Kamar Mandi Luar, Parkir Motor",
            is_pet_friendly: false,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Tebet Barat Dalam VII No. 12, Tebet, Jakarta Selatan",
            latitude: -6.2374,
            longitude: 106.8526,
          },
          {
            name: "Kos Taekwang Jaya Mandiri",
            price_per_month: 900000,
            available_rooms: 4,
            gender_type: "CAMPUR",
            facilities: "WiFi Super Cepat, Kasur Springbed, Kamar Mandi Dalam, Dapur Bersama, Parkir Motor",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Raya Subang - Cirebon, Cibogo, Dekat PT Taekwang, Subang",
            latitude: -6.5595,
            longitude: 107.7875,
          },
        ],
      },
      magic_links: {
        create: [
          {
            token: "magic-bambang-123",
            expires_at: oneWeekLater,
            is_used: false,
          },
        ],
      },
    },
    include: {
      properties: true,
      magic_links: true,
    },
  });

  // 2. Owner 2: Ibu Sri Wahyuni (Kos Putri)
  const owner2 = await prisma.owner.create({
    data: {
      name: "Sri Wahyuni",
      whatsapp_number: "6281987654321",
      properties: {
        create: [
          {
            name: "Kos Melati Putri",
            price_per_month: 1250000,
            available_rooms: 2,
            gender_type: "PUTRI",
            facilities: "WiFi, AC, Kasur Springbed, Kamar Mandi Dalam, Dapur Bersama, Keamanan 24 Jam, CCTV",
            is_pet_friendly: false,
            is_24_hours: false,
            image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Kyai Tapa No. 45, Grogol, Jakarta Barat",
            latitude: -6.1674,
            longitude: 106.7881,
          },
          {
            name: "Kos Putri An-Nur UNSUB",
            price_per_month: 800000,
            available_rooms: 3,
            gender_type: "PUTRI",
            facilities: "WiFi Cepat, AC, Kamar Mandi Dalam, Kasur, Dapur Bersama, CCTV",
            is_pet_friendly: true,
            is_24_hours: false,
            image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
            address: "Jl. RA Kartini No. 15, Dekat Universitas Subang (UNSUB), Subang",
            latitude: -6.5592,
            longitude: 107.7656,
          },
        ],
      },
      magic_links: {
        create: [
          {
            token: "magic-sri-456",
            expires_at: oneWeekLater,
            is_used: false,
          },
        ],
      },
    },
    include: {
      properties: true,
      magic_links: true,
    },
  });

  // 3. Owner 3: Pak Dimas Ferial Hidayat (Kos Campur)
  const owner3 = await prisma.owner.create({
    data: {
      name: "Dimas Ferial Hidayat",
      whatsapp_number: "6281315132327",
      properties: {
        create: [
          {
            name: "Kos Campur Sejahtera",
            price_per_month: 1600000,
            available_rooms: 5,
            gender_type: "CAMPUR",
            facilities: "WiFi Cepat, AC, Smart TV, Water Heater, Kamar Mandi Dalam, Balkon, Parkir Mobil/Motor",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Margonda Raya No. 108, Pondok Cina, Beji, Depok",
            latitude: -6.3686,
            longitude: 106.8332,
          },
          {
            name: "Kos Paviliun Alun-Alun Subang",
            price_per_month: 1100000,
            available_rooms: 4,
            gender_type: "CAMPUR",
            facilities: "AC, WiFi Kencang, Kamar Mandi Dalam, Akses Bebas 24 Jam, Boleh Bawa Kucing, Dapur Mini",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Wangsa Goparana No. 8, Dekat Alun-Alun Subang, Subang Kota",
            latitude: -6.5710,
            longitude: 107.7615,
          },
          {
            name: "Kos Asri Polsub Cibogo",
            price_per_month: 650000,
            available_rooms: 6,
            gender_type: "PUTRA",
            facilities: "WiFi, Kasur, Lemari, Dapur Bersama, Parkir Motor Luas, Suasana Hening & Tenang",
            is_pet_friendly: false,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Brigjen Katamso, Dekat Kampus Polsub Cibogo, Subang",
            latitude: -6.5683,
            longitude: 107.8347,
          },
        ],
      },
      magic_links: {
        create: [
          {
            token: "magic-hendra-789",
            expires_at: oneWeekLater,
            is_used: false,
          },
        ],
      },
    },
    include: {
      properties: true,
      magic_links: true,
    },
  });

  console.log("✅ Seeded owners and properties with magic links:");
  console.log(` - ${owner1.name} -> ${owner1.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ID: ${p.id})`).join(", ")} | Token: magic-bambang-123`);
  console.log(` - ${owner2.name} -> ${owner2.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ID: ${p.id})`).join(", ")} | Token: magic-sri-456`);
  console.log(` - ${owner3.name} -> ${owner3.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ID: ${p.id})`).join(", ")} | Token: magic-hendra-789`);

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
