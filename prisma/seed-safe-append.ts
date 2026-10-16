import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menjalankan Safe Append Seeding (Tanpa Hapus Data)...");

  // 1. Data Kos Manual (Kos Mawar Putra, Kos Melati Putri, Kos Campur Sejahtera)
  const manualKosData = [
    {
      owner_name: "Bambang Sudarsono",
      whatsapp: "6281234567890",
      kos: {
        name: "Kos Mawar Putra",
        price_per_month: 850000,
        available_rooms: 3,
        gender_type: "PUTRA",
        facilities: "WiFi, Dapur Umum, Parkir Motor, Ruang Jemur",
        is_pet_friendly: false,
        is_24_hours: true,
        status: "PUBLISHED",
        rules: "1. Dilarang merokok di dalam kamar\n2. Tamu lawan jenis dilarang masuk ke kamar\n3. Menjaga kebersihan dan ketenangan lingkungan kos\n4. Mematikan listrik dan kran air saat tidak digunakan\n5. Gerbang ditutup pukul 23:00 WIB",
        rental_terms: "1. Menyerahkan fotokopi / foto KTP atau Kartu Tanda Mahasiswa yang masih berlaku\n2. Pembayaran sewa dilakukan di awal setiap bulan\n3. Uang deposit jaminan Rp 200.000 (dikembalikan saat selesai sewa)\n4. Maksimal 1 orang per kamar",
        youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        address: "Jl. Tebet Barat Dalam VII No. 12, Tebet, Jakarta Selatan",
        latitude: -6.2374,
        longitude: 106.8526,
        room_types: [
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
            facilities: "Kipas Angin, Kasur Busa, Lemari Pakaian, Meja Belajar",
            specifications: "Ukuran kamar: 3x3 meter • Lantai 2 • Kamar Mandi Luar • Ventilasi udara baik",
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          },
        ],
      },
    },
    {
      owner_name: "Sri Wahyuni",
      whatsapp: "6289876543210",
      kos: {
        name: "Kos Melati Putri",
        price_per_month: 900000,
        available_rooms: 2,
        gender_type: "PUTRI",
        facilities: "WiFi, CCTV 24 Jam, Penjaga Kos, Dapur Bersama, Kulkas Bersama",
        is_pet_friendly: false,
        is_24_hours: false,
        status: "PUBLISHED",
        rules: "1. Khusus putri/mahasiswi/karyawati\n2. Jam malam maksimal pukul 22:00 WIB\n3. Tamu pria dilarang masuk area kamar (hanya di ruang tamu luar)\n4. Menjaga kebersihan dapur bersama setelah memasak",
        rental_terms: "1. KTP dan Kartu Mahasiswa / ID Karyawan\n2. Pembayaran sewa bulanan paling lambat tanggal 5 setiap bulan\n3. Biaya tambahan untuk barang elektronik watt besar (kulkas mini/dispenser)",
        youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        address: "Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan, Jakarta Selatan",
        latitude: -6.2608,
        longitude: 106.8155,
        room_types: [
          {
            name: "Kamar Deluxe (AC + Water Heater)",
            price_per_month: 1300000,
            available_rooms: 1,
            facilities: "AC Daikin, Water Heater, Meja Rias, Lemari 2 Pintu",
            specifications: "Ukuran kamar: 3.5x4 meter • Lantai dasar • Kamar mandi dalam dengan shower air hangat",
            image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Kamar Standar Putri",
            price_per_month: 900000,
            available_rooms: 1,
            facilities: "Kipas Angin Dinding, Kasur Single, Meja Belajar",
            specifications: "Ukuran kamar: 3x3 meter • Kamar mandi dalam • Kipas angin • Lantai 1",
            image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
          },
        ],
      },
    },
    {
      owner_name: "Dimas Ferial Hidayat",
      whatsapp: "6281315132399",
      kos: {
        name: "Kos Campur Sejahtera",
        price_per_month: 1600000,
        available_rooms: 5,
        gender_type: "CAMPUR",
        facilities: "WiFi Cepat, Dapur Bersama, Parkir Mobil/Motor, CCTV, Ruang Coworking",
        is_pet_friendly: true,
        is_24_hours: true,
        status: "PUBLISHED",
        rules: "1. Bebas akses 24 jam dengan smart lock\n2. Boleh membawa hewan peliharaan (kucing/anjing kecil)\n3. Dilarang membuat kegaduhan di atas pukul 23:00 WIB\n4. Tamu lawan jenis diperbolehkan berkunjung di ruang tamu bersama",
        rental_terms: "1. KTP asli / paspor / SIM yang berlaku\n2. Uang jaminan (deposit) 1 bulan sewa\n3. Pembayaran via transfer/QRIS selambatnya tanggal 1 awal bulan",
        youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
        address: "Jl. Margonda Raya No. 108, Pondok Cina, Beji, Depok",
        latitude: -6.3686,
        longitude: 106.8332,
        room_types: [
          {
            name: "Tipe Suite (King Bed + Smart TV + Water Heater)",
            price_per_month: 1900000,
            available_rooms: 2,
            facilities: "AC, Smart TV, Water Heater, King Bed, Kamar Mandi Dalam, Balkon",
            specifications: "Ukuran kamar: 4x5 meter • King bed 180x200 • Smart TV 32 inch • Water heater • Balkon pribadi",
            image_url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Tipe Eksekutif",
            price_per_month: 1600000,
            available_rooms: 3,
            facilities: "AC, Kasur Queen, Meja Kerja Ergonomis, Lemari Besar",
            specifications: "Ukuran kamar: 3.5x4 meter • Lantai 2 • Jendela besar view taman",
            image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          },
        ],
      },
    },
  ];

  let manualAdded = 0;
  for (const item of manualKosData) {
    // Cek apakah properti sudah ada
    const existingProperty = await prisma.property.findFirst({
      where: { name: item.kos.name },
    });

    if (existingProperty) {
      console.log(`⏩ Properti "${item.kos.name}" sudah ada, melewati.`);
      continue;
    }

    // Cek atau buat owner
    let owner = await prisma.owner.findFirst({
      where: { whatsapp_number: item.whatsapp },
    });

    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          name: item.owner_name,
          whatsapp_number: item.whatsapp,
        },
      });
    }

    // Buat properti baru beserta tipe kamar
    await prisma.property.create({
      data: {
        name: item.kos.name,
        price_per_month: item.kos.price_per_month,
        available_rooms: item.kos.available_rooms,
        gender_type: item.kos.gender_type,
        facilities: item.kos.facilities,
        is_pet_friendly: item.kos.is_pet_friendly,
        is_24_hours: item.kos.is_24_hours,
        status: item.kos.status,
        rules: item.kos.rules,
        rental_terms: item.kos.rental_terms,
        youtube_url: item.kos.youtube_url,
        image_url: item.kos.image_url,
        address: item.kos.address,
        latitude: item.kos.latitude,
        longitude: item.kos.longitude,
        owner_id: owner.id,
        room_types: {
          create: item.kos.room_types.map((rt) => ({
            name: rt.name,
            price_per_month: rt.price_per_month,
            available_rooms: rt.available_rooms,
            facilities: rt.facilities,
            specifications: rt.specifications,
            image_url: rt.image_url,
          })),
        },
      },
    });

    manualAdded++;
    console.log(`✅ Berhasil menambahkan properti manual: "${item.kos.name}"`);
  }

  // 2. Data Kos Crawled Subang (data_kos_subang.json)
  const subangDataPath = path.join(__dirname, "data_kos_subang.json");
  let subangAdded = 0;

  if (fs.existsSync(subangDataPath)) {
    const rawData = fs.readFileSync(subangDataPath, "utf-8");
    const subangKosList = JSON.parse(rawData);

    for (const kos of subangKosList) {
      // Cek apakah properti sudah ada
      const existingProp = await prisma.property.findFirst({
        where: { name: kos.property_name },
      });

      if (existingProp) {
        continue;
      }

      // Pastikan format nomor WhatsApp tidak bentrok
      let owner = await prisma.owner.findFirst({
        where: { whatsapp_number: kos.whatsapp },
      });

      if (!owner) {
        owner = await prisma.owner.create({
          data: {
            name: kos.owner_name,
            whatsapp_number: kos.whatsapp,
          },
        });
      }

      await prisma.property.create({
        data: {
          name: kos.property_name,
          price_per_month: kos.price,
          available_rooms: Math.floor(Math.random() * 10) + 1,
          gender_type: kos.gender_type,
          facilities: "WiFi, Kasur, Lemari, Kamar Mandi Dalam",
          is_pet_friendly: Math.random() > 0.8,
          is_24_hours: Math.random() > 0.5,
          status: "PUBLISHED",
          rules:
            kos.rules ||
            "1. Dilarang merokok di dalam kamar\n2. Menjaga kebersihan dan ketenangan lingkungan kos\n3. Tamu lawan jenis dilarang menginap\n4. Mematikan kran air dan listrik saat keluar",
          rental_terms:
            kos.rental_terms ||
            "1. Menyerahkan identitas resmi (KTP atau Kartu Tanda Mahasiswa)\n2. Membayar uang sewa lunas di muka\n3. Deposit jaminan kunci & fasilitas Rp 150.000",
          youtube_url: kos.youtube_url || null,
          image_url: kos.image_url,
          address: kos.address,
          latitude: kos.lat,
          longitude: kos.lng,
          owner_id: owner.id,
          room_types: {
            create: [
              {
                name: "Kamar Standar",
                price_per_month: kos.price,
                available_rooms: Math.floor(Math.random() * 5) + 1,
                facilities: "Kasur, Lemari, Meja Belajar",
                specifications:
                  "Ukuran kamar: 3x3 meter • Kamar mandi dalam • Sirkulasi jendela langsung • Kapasitas 1 orang",
                image_url:
                  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
              },
            ],
          },
        },
      });

      subangAdded++;
    }
  }

  const [totalProps, totalOwners, totalLocations] = await Promise.all([
    prisma.property.count(),
    prisma.owner.count(),
    prisma.location.count(),
  ]);

  console.log("🎉 SEEDING SELESAI DENGAN AMAN!");
  console.log(`- Kos manual ditambahkan: ${manualAdded}`);
  console.log(`- Kos Subang ditambahkan: ${subangAdded}`);
  console.log(`- Total properti di database sekarang: ${totalProps}`);
  console.log(`- Total pemilik (mitra) di database: ${totalOwners}`);
  console.log(`- Total lokasi di database (tetap utuh): ${totalLocations}`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding aman:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
