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
            facilities: "WiFi, Dapur Umum, Parkir Motor, Ruang Jemur",
            is_pet_friendly: false,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Tebet Barat Dalam VII No. 12, Tebet, Jakarta Selatan",
            latitude: -6.2374,
            longitude: 106.8526,
            room_types: {
              create: [
                {
                  name: "Tipe A (AC + KM Dalam)",
                  price_per_month: 1100000,
                  available_rooms: 1,
                  facilities: "AC, Kasur Springbed, Lemari, Kamar Mandi Dalam",
                },
                {
                  name: "Tipe B (Standar)",
                  price_per_month: 850000,
                  available_rooms: 2,
                  facilities: "Kasur, Lemari, Kamar Mandi Luar, Kipas Angin",
                },
              ],
            },
          },
          {
            name: "Kos Taekwang Jaya Mandiri",
            price_per_month: 900000,
            available_rooms: 4,
            gender_type: "CAMPUR",
            facilities: "WiFi Super Cepat, Dapur Bersama, Parkir Motor, Keamanan",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Raya Subang - Cirebon, Cibogo, Dekat PT Taekwang, Subang",
            latitude: -6.5595,
            longitude: 107.7875,
            room_types: {
              create: [
                {
                  name: "Tipe Deluxe (Dapur Mini + AC)",
                  price_per_month: 1200000,
                  available_rooms: 2,
                  facilities: "AC, Kasur Springbed, Kamar Mandi Dalam, Dapur Mini",
                },
                {
                  name: "Tipe Standar (KM Dalam)",
                  price_per_month: 900000,
                  available_rooms: 2,
                  facilities: "Kasur Springbed, Kamar Mandi Dalam, Kipas Angin",
                },
              ],
            },
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
      properties: {
        include: {
          room_types: true,
        },
      },
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
            facilities: "WiFi, Dapur Bersama, Keamanan 24 Jam, CCTV, Parkir Motor",
            is_pet_friendly: false,
            is_24_hours: false,
            image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Kyai Tapa No. 45, Grogol, Jakarta Barat",
            latitude: -6.1674,
            longitude: 106.7881,
            room_types: {
              create: [
                {
                  name: "Tipe VIP (Balkon + AC + Water Heater)",
                  price_per_month: 1500000,
                  available_rooms: 1,
                  facilities: "AC, Smart TV, Water Heater, Kasur Springbed, Kamar Mandi Dalam, Balkon",
                },
                {
                  name: "Tipe Standar Putri (AC)",
                  price_per_month: 1250000,
                  available_rooms: 1,
                  facilities: "AC, Kasur Springbed, Kamar Mandi Dalam, Lemari",
                },
              ],
            },
          },
          {
            name: "Kos Putri An-Nur UNSUB",
            price_per_month: 800000,
            available_rooms: 3,
            gender_type: "PUTRI",
            facilities: "WiFi Cepat, Dapur Bersama, CCTV, Ruang Santai",
            is_pet_friendly: true,
            is_24_hours: false,
            image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
            address: "Jl. RA Kartini No. 15, Dekat Universitas Subang (UNSUB), Subang",
            latitude: -6.5592,
            longitude: 107.7656,
            room_types: {
              create: [
                {
                  name: "Tipe A (AC + KM Dalam)",
                  price_per_month: 950000,
                  available_rooms: 1,
                  facilities: "AC, Kasur, Lemari, Kamar Mandi Dalam",
                },
                {
                  name: "Tipe B (Non-AC + KM Dalam)",
                  price_per_month: 800000,
                  available_rooms: 2,
                  facilities: "Kasur, Lemari, Kamar Mandi Dalam, Kipas Angin",
                },
              ],
            },
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
      properties: {
        include: {
          room_types: true,
        },
      },
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
            facilities: "WiFi Cepat, Dapur Bersama, Parkir Mobil/Motor, CCTV, Ruang Coworking",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Margonda Raya No. 108, Pondok Cina, Beji, Depok",
            latitude: -6.3686,
            longitude: 106.8332,
            room_types: {
              create: [
                {
                  name: "Tipe Suite (King Bed + Smart TV + Water Heater)",
                  price_per_month: 1900000,
                  available_rooms: 2,
                  facilities: "AC, Smart TV, Water Heater, King Bed, Kamar Mandi Dalam, Balkon",
                },
                {
                  name: "Tipe Deluxe (AC + KM Dalam)",
                  price_per_month: 1600000,
                  available_rooms: 3,
                  facilities: "AC, Kasur Springbed, Kamar Mandi Dalam, Meja Kerja",
                },
              ],
            },
          },
          {
            name: "Kos Paviliun Alun-Alun Subang",
            price_per_month: 1100000,
            available_rooms: 4,
            gender_type: "CAMPUR",
            facilities: "WiFi Kencang, Akses Bebas 24 Jam, Boleh Bawa Kucing, Parkir Motor",
            is_pet_friendly: true,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Wangsa Goparana No. 8, Dekat Alun-Alun Subang, Subang Kota",
            latitude: -6.5710,
            longitude: 107.7615,
            room_types: {
              create: [
                {
                  name: "Tipe Paviliun Utama (Dapur Mini)",
                  price_per_month: 1300000,
                  available_rooms: 2,
                  facilities: "AC, Dapur Mini, Kamar Mandi Dalam, Kasur Springbed",
                },
                {
                  name: "Tipe Studio",
                  price_per_month: 1100000,
                  available_rooms: 2,
                  facilities: "AC, Kamar Mandi Dalam, Kasur Busa, Meja",
                },
              ],
            },
          },
          {
            name: "Kos Asri Polsub Cibogo",
            price_per_month: 650000,
            available_rooms: 6,
            gender_type: "PUTRA",
            facilities: "WiFi, Dapur Bersama, Parkir Motor Luas, Suasana Hening & Tenang",
            is_pet_friendly: false,
            is_24_hours: true,
            image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            address: "Jl. Brigjen Katamso, Dekat Kampus Polsub Cibogo, Subang",
            latitude: -6.5683,
            longitude: 107.8347,
            room_types: {
              create: [
                {
                  name: "Tipe A (Kamar Luas)",
                  price_per_month: 750000,
                  available_rooms: 2,
                  facilities: "Kasur Busa, Lemari 2 Pintu, Meja Belajar",
                },
                {
                  name: "Tipe B (Standar)",
                  price_per_month: 650000,
                  available_rooms: 4,
                  facilities: "Kasur, Lemari, Kipas Angin",
                },
              ],
            },
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
      properties: {
        include: {
          room_types: true,
        },
      },
      magic_links: true,
    },
  });

  console.log("✅ Seeded owners and properties with magic links & room types:");
  console.log(` - ${owner1.name} -> ${owner1.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ${p.room_types.length} tipe, ID: ${p.id})`).join(", ")} | Token: magic-bambang-123`);
  console.log(` - ${owner2.name} -> ${owner2.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ${p.room_types.length} tipe, ID: ${p.id})`).join(", ")} | Token: magic-sri-456`);
  console.log(` - ${owner3.name} -> ${owner3.properties.map((p) => `${p.name} (Sisa ${p.available_rooms} kamar, ${p.room_types.length} tipe, ID: ${p.id})`).join(", ")} | Token: magic-hendra-789`);

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
