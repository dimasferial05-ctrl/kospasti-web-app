import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean up existing data in reverse order of relationships
  await prisma.review.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();

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
            rules: "1. Dilarang merokok di dalam kamar\n2. Tamu lawan jenis dilarang masuk ke kamar\n3. Menjaga kebersihan dan ketenangan lingkungan kos\n4. Mematikan listrik dan kran air saat tidak digunakan\n5. Gerbang ditutup pukul 23:00 WIB",
            rental_terms: "1. Menyerahkan fotokopi / foto KTP atau Kartu Tanda Mahasiswa yang masih berlaku\n2. Pembayaran sewa dilakukan di awal setiap bulan\n3. Uang deposit jaminan Rp 200.000 (dikembalikan saat selesai sewa)\n4. Maksimal 1 orang per kamar",
            youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
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
                  specifications: "Ukuran kamar: 3x4 meter • Lantai 1 • Daya Listrik: 900 VA (Token) • Jendela hadap luar",
                  image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe B (Standar)",
                  price_per_month: 850000,
                  available_rooms: 2,
                  facilities: "Kasur, Lemari, Kamar Mandi Luar, Kipas Angin",
                  specifications: "Ukuran kamar: 3x3 meter • Lantai 2 • Listrik sudah termasuk • Ventilasi alami",
                  image_url: "https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Bebas jam malam 24 jam dengan akses kartu gerbang\n2. Hewan peliharaan wajib dijaga kebersihannya\n3. Tamu menginap wajib lapor pengelola\n4. Menjaga ketertiban jam istirahat malam",
            rental_terms: "1. Identitas KTP / KTM / ID Karyawan\n2. Uang jaminan sewa Rp 150.000\n3. Minimal kontrak 1 bulan",
            youtube_url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
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
                  specifications: "Ukuran kamar: 3.5x4 meter • Dapur mini pribadi & sink • AC 0.5 PK • Lantai 1",
                  image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe Standar (KM Dalam)",
                  price_per_month: 900000,
                  available_rooms: 2,
                  facilities: "Kasur Springbed, Kamar Mandi Dalam, Kipas Angin",
                  specifications: "Ukuran kamar: 3x3 meter • Kamar mandi dalam kloset duduk • Lantai 2",
                  image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Khusus putri, laki-laki dilarang masuk kamar\n2. Jam malam gerbang pukul 22:30 WIB\n3. Dilarang merokok dan minum keras\n4. Menjaga kebersihan dapur umum",
            rental_terms: "1. KTP dan kontak darurat keluarga\n2. Pembayaran sebelum tanggal 5 tiap bulan\n3. Deposit Rp 200.000",
            youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
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
                  specifications: "Ukuran kamar: 4x4 meter • Balkon pribadi luas • Water heater & AC 1 PK • Lantai 2",
                  image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe Standar Putri (AC)",
                  price_per_month: 1250000,
                  available_rooms: 1,
                  facilities: "AC, Kasur Springbed, Kamar Mandi Dalam, Lemari",
                  specifications: "Ukuran kamar: 3.5x3 meter • AC 0.5 PK • Lemari 2 pintu & cermin • Lantai 1",
                  image_url: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Khusus mahasiswi / karyawati\n2. Wajib menjaga suasana tenang terutama saat jam belajar\n3. Jam malam gerbang pukul 23:00 WIB",
            rental_terms: "1. Kartu identitas mahasiswi (KTM) atau KTP\n2. Pembayaran awal minimal 1 bulan",
            youtube_url: "",
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
                  specifications: "Ukuran kamar: 3x3.5 meter • Kamar mandi dalam • AC • Lantai 2",
                  image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe B (Non-AC + KM Dalam)",
                  price_per_month: 800000,
                  available_rooms: 2,
                  facilities: "Kasur, Lemari, Kamar Mandi Dalam, Kipas Angin",
                  specifications: "Ukuran kamar: 3x3 meter • Kamar mandi dalam • Kipas angin • Lantai 1",
                  image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Bebas akses 24 jam dengan smart lock\n2. Boleh membawa hewan peliharaan (kucing/anjing kecil)\n3. Dilarang membuat kegaduhan di atas pukul 23:00 WIB\n4. Tamu lawan jenis diperbolehkan berkunjung di ruang tamu bersama",
            rental_terms: "1. KTP asli / paspor / SIM yang berlaku\n2. Uang jaminan (deposit) 1 bulan sewa\n3. Pembayaran via transfer/QRIS selambatnya tanggal 1 awal bulan",
            youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
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
                  specifications: "Ukuran kamar: 4x5 meter • King bed 180x200 • Smart TV 32 inch • Water heater • Balkon pribadi",
                  image_url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe Deluxe (AC + KM Dalam)",
                  price_per_month: 1600000,
                  available_rooms: 3,
                  facilities: "AC, Kasur Springbed, Kamar Mandi Dalam, Meja Kerja",
                  specifications: "Ukuran kamar: 3.5x3.5 meter • Single springbed 120x200 • Meja kerja ergonomis • AC 0.5 PK",
                  image_url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Akses 24 jam bebas tanpa jam malam\n2. Menjaga ketertiban dan kebersihan fasilitas bersama\n3. Dilarang membawa barang terlarang atau narkoba",
            rental_terms: "1. KTP dan nomor darurat keluarga\n2. Uang jaminan sewa Rp 200.000\n3. Kontrak sewa minimal 1 bulan",
            youtube_url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
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
                  specifications: "Ukuran kamar: 4x4 meter • Dapur mini privat • Listrik token mandiri • Parkir mobil depan kamar",
                  image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe Studio",
                  price_per_month: 1100000,
                  available_rooms: 2,
                  facilities: "AC, Kamar Mandi Dalam, Kasur Busa, Meja",
                  specifications: "Ukuran kamar: 3x3.5 meter • Meja & rak buku • AC hemat energi • Kamar mandi dalam",
                  image_url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80",
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
            rules: "1. Khusus mahasiswa / pelajar putra yang tertib\n2. Menjaga ketenangan di jam belajar malam (20:00 - 05:00)\n3. Dilarang membawa minuman keras atau judi\n4. Mematikan listrik dan kran air setelah pakai",
            rental_terms: "1. KTP dan Kartu Tanda Mahasiswa (KTM) aktif\n2. Pembayaran sewa dilakukan diawal bulan\n3. Uang deposit jaminan Rp 100.000",
            youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
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
                  specifications: "Ukuran kamar: 3.5x4 meter • Meja belajar & kursi • Lemari 2 pintu • Sirkulasi udara sejuk",
                  image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
                },
                {
                  name: "Tipe B (Standar)",
                  price_per_month: 650000,
                  available_rooms: 4,
                  facilities: "Kasur, Lemari, Kipas Angin",
                  specifications: "Ukuran kamar: 3x3 meter • Kasur busa tebal • Lemari pakaian • Termasuk biaya listrik standar",
                  image_url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
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

  // 4. Create dummy users
  const user1 = await prisma.user.create({
    data: {
      name: "Andi Saputra",
      email: "andi.saputra@kospasti.id",
      whatsapp: "08111222333",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      bio: "Mahasiswa Teknik Informatika tingkat akhir.",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Siti Aminah",
      email: "siti.aminah@kospasti.id",
      whatsapp: "08222333444",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      bio: "Karyawati swasta mencari kos dekat kantor.",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi.santoso@kospasti.id",
      whatsapp: "08333444555",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
      bio: "Mahasiswa baru rantau butuh kos putra yang tenang.",
    },
  });

  const user4 = await prisma.user.create({
    data: {
      name: "Dewi Lestari",
      email: "dewi.lestari@kospasti.id",
      whatsapp: "08444555666",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      bio: "Pecinta kucing dan lingkungan tenang.",
    },
  });

  const user5 = await prisma.user.create({
    data: {
      name: "Eko Prasetyo",
      email: "eko.prasetyo@kospasti.id",
      whatsapp: "08555666777",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      bio: "Karyawan PT Taekwang Subang.",
    },
  });

  // 5. Create dummy bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const booking1 = await prisma.booking.create({
    data: {
      student_name: user1.name,
      student_whatsapp: user1.whatsapp || "628111222333",
      move_in_date: tomorrow,
      status: "PAID",
      property_id: owner1.properties[0].id,
      room_type_id: owner1.properties[0].room_types[0].id,
      user_id: user1.id,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      student_name: user2.name,
      student_whatsapp: user2.whatsapp || "628222333444",
      move_in_date: nextMonth,
      status: "ACCEPTED",
      property_id: owner2.properties[0].id,
      room_type_id: owner2.properties[0].room_types[1].id,
      user_id: user2.id,
    },
  });

  await prisma.booking.create({
    data: {
      student_name: user3.name,
      student_whatsapp: user3.whatsapp || "628333444555",
      move_in_date: tomorrow,
      status: "REJECTED",
      property_id: owner3.properties[0].id,
      room_type_id: owner3.properties[0].room_types[0].id,
      user_id: user3.id,
    },
  });

  await prisma.booking.create({
    data: {
      student_name: user4.name,
      student_whatsapp: user4.whatsapp || "628444555666",
      move_in_date: nextMonth,
      status: "PENDING",
      property_id: owner2.properties[1].id,
      room_type_id: owner2.properties[1].room_types[0].id,
      user_id: user4.id,
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      student_name: user5.name,
      student_whatsapp: user5.whatsapp || "628555666777",
      move_in_date: tomorrow,
      status: "PAID",
      property_id: owner3.properties[1].id,
      room_type_id: owner3.properties[1].room_types[1].id,
      user_id: user5.id,
    },
  });

  // 6. Create dummy reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Lingkungan sangat nyaman, WiFi cepat untuk kuliah online, dan bapak kos ramah.",
      property_id: owner1.properties[0].id,
      user_id: user1.id,
      booking_id: booking1.id,
      is_hidden: false,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Lokasi strategis dekat pabrik Taekwang, fasilitas bersih dan parkiran luas.",
      property_id: owner3.properties[1].id,
      user_id: user5.id,
      booking_id: booking5.id,
      is_hidden: false,
    },
  });

  // Create an expired magic link for testing the UI
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1);
  
  await prisma.magicLink.create({
    data: {
      token: "magic-bambang-expired",
      expires_at: expiredDate,
      is_used: false,
      owner_id: owner1.id,
    }
  });

  // Create an already used magic link
  await prisma.magicLink.create({
    data: {
      token: "magic-sri-used",
      expires_at: oneWeekLater,
      is_used: true,
      owner_id: owner2.id,
    }
  });

  // --- SEED CRAWLED DATA DARI SUBANG ---
  console.log("📥 Loading crawled data from Subang...");
  const subangDataPath = path.join(__dirname, "data_kos_subang.json");
  if (fs.existsSync(subangDataPath)) {
    const rawData = fs.readFileSync(subangDataPath, "utf-8");
    const subangKosList = JSON.parse(rawData);

    let subangCount = 0;
    for (const kos of subangKosList) {
      await prisma.owner.create({
        data: {
          name: kos.owner_name,
          whatsapp_number: kos.whatsapp,
          properties: {
            create: [
              {
                name: kos.property_name,
                price_per_month: kos.price,
                available_rooms: Math.floor(Math.random() * 10) + 1,
                gender_type: kos.gender_type,
                facilities: "WiFi, Kasur, Lemari, Kamar Mandi Dalam",
                is_pet_friendly: Math.random() > 0.8,
                is_24_hours: Math.random() > 0.5,
                rules: kos.rules || "1. Dilarang merokok di dalam kamar\n2. Menjaga kebersihan dan ketenangan lingkungan kos\n3. Tamu lawan jenis dilarang menginap\n4. Mematikan kran air dan listrik saat keluar",
                rental_terms: kos.rental_terms || "1. Menyerahkan identitas resmi (KTP atau Kartu Tanda Mahasiswa)\n2. Membayar uang sewa lunas di muka\n3. Deposit jaminan kunci & fasilitas Rp 150.000",
                youtube_url: kos.youtube_url || null,
                image_url: kos.image_url,
                address: kos.address,
                latitude: kos.lat,
                longitude: kos.lng,
                room_types: {
                  create: [
                    {
                      name: "Kamar Standar",
                      price_per_month: kos.price,
                      available_rooms: Math.floor(Math.random() * 5) + 1,
                      facilities: "Kasur, Lemari, Meja Belajar",
                      specifications: "Ukuran kamar: 3x3 meter • Kamar mandi dalam • Sirkulasi jendela langsung • Kapasitas 1 orang",
                      image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
                    }
                  ]
                }
              }
            ]
          }
        }
      });
      subangCount++;
    }
    console.log(`✅ Successfully seeded ${subangCount} properties from Subang data.`);
  }

  // Set seeded properties to PUBLISHED by default for development
  await prisma.property.updateMany({
    data: { status: "PUBLISHED" },
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
