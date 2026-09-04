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
            image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
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
            available_rooms: 0, // Testing Full/Empty State
            gender_type: "PUTRI",
            facilities: "WiFi, AC, Kasur Springbed, Kamar Mandi Dalam, Dapur Bersama, Keamanan 24 Jam",
            image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
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

  // 3. Owner 3: Pak Hendra Gunawan (Kos Campur)
  const owner3 = await prisma.owner.create({
    data: {
      name: "Hendra Gunawan",
      whatsapp_number: "6285712345678",
      properties: {
        create: [
          {
            name: "Kos Campur Sejahtera",
            price_per_month: 1600000,
            available_rooms: 5,
            gender_type: "CAMPUR",
            facilities: "WiFi Cepat, AC, Smart TV, Water Heater, Kamar Mandi Dalam, Balkon, Parkir Mobil/Motor",
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
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
