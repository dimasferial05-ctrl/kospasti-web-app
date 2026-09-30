export interface HelpSection {
  title: string;
  content: string;
  tips?: string[];
  warning?: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  category: "user" | "partner";
  title: string;
  subtitle: string;
  iconName: string;
  tags: string[];
  readTime: string;
  summary: string;
  sections: HelpSection[];
  relatedSlugs?: string[];
}

export interface HelpCategory {
  id: "user" | "partner";
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "user",
    title: "Pusat Bantuan Pencari Kos",
    shortTitle: "Pencari Kos",
    description: "Panduan lengkap seputar pencarian kos, alur booking, pembayaran DP, kebijakan penolakan, hingga proses refund.",
    badge: "Pencari Kos & Mahasiswa",
    articles: [
      {
        id: "user-ai-search",
        slug: "cara-cari-kos-filter-ai",
        category: "user",
        title: "Cara Mencari Kos dengan Fitur Filter & AI Prompt",
        subtitle: "Temukan kos impian sesuai kriteria spesifik, budget, dan preferensi lingkungan dalam hitungan detik.",
        iconName: "Search",
        tags: ["Pencarian", "AI Smart Filter", "Peta Kos"],
        readTime: "3 Menit",
        summary: "KosPasti menyediakan dua cara pencarian utama: Pencarian Cerdas berbasis AI Bahasa Alami dan Filter Konvensional (Batas Harga, Tipe Putra/Putri/Campur, Fasilitas).",
        sections: [
          {
            title: "1. Menggunakan Filter AI Bahasa Alami",
            content:
              "Anda dapat mengetik deskripsi kebutuhan sewa kos Anda apa adanya seperti berbicara dengan asisten pribadi. Contoh prompt yang bisa Anda masukkan pada kolom pencarian:\n\n• 'Kos putri AC kamar mandi dalam dekat Unsoed di bawah 1 juta'\n• 'Kos campur pet friendly dengan parkir mobil luas'\n• 'Kos putra murah bebas jam malam dekat stasiun'\n\nSistem AI KosPasti akan membedah preferensi Anda dan mencocokkannya dengan database properti secara akurat.",
            tips: [
              "Gunakan kata kunci fasilitas utama seperti AC, WiFi, atau Parkir Mobil untuk mempersempit hasil.",
              "Sebutkan estimasi budget per bulan agar sistem menyaring kos yang sesuai.",
            ],
          },
          {
            title: "2. Menjelajahi Lewat Peta Kos Interaktif",
            content:
              "Bagi Anda yang mengutamakan kedekatan lokasi dengan kampus atau kantor, buka menu 'Peta Kos'. Anda dapat melihat sebaran titik kos di peta, radius jarak ke kampus terdekat, serta perkiraan waktu tempuh menggunakan kendaraan maupun berjalan kaki.",
            tips: [
              "Klik marker di peta untuk melihat ringkasan harga dan tipe kamar yang masih tersedia.",
            ],
          },
          {
            title: "3. Menyimpan Kos ke Daftar Favorit",
            content:
              "Klik ikon hati (Wishlist) pada kartu properti untuk menyimpannya ke menu 'Kos Favorit' di akun Anda. Ini memudahkan Anda membandingkan fasilitas dan harga sebelum memutuskan melakukan pemesanan.",
          },
        ],
        relatedSlugs: ["alur-pemesanan-booking-dp", "kebijakan-penolakan-refund"],
      },
      {
        id: "user-booking-flow",
        slug: "alur-pemesanan-booking-dp",
        category: "user",
        title: "Alur Pemesanan Kos (Booking → Bayar DP → Persetujuan Pemilik)",
        subtitle: "Memahami 3 tahapan pemesanan kamar kos di KosPasti secara transparan dan aman.",
        iconName: "CalendarCheck",
        tags: ["Booking", "Pembayaran DP", "Persetujuan"],
        readTime: "4 Menit",
        summary: "KosPasti menerapkan sistem komitmen sewa dengan Down Payment (DP) untuk mengunci ketersediaan kamar secara real-time dan mencegah booking palsu.",
        sections: [
          {
            title: "Tahap 1: Pilih Tipe Kamar & Isi Rencana Masuk",
            content:
              "Di halaman detail kos, pilih tipe kamar yang diinginkan (misal Tipe Standar atau Tipe Deluxe). Periksa detail spesifikasi ukuran, fasilitas, serta aturan kos. Tentukan tanggal rencana mulai ngekos (Move-in Date) dan pastikan nomor WhatsApp Anda aktif untuk menerima link konfirmasi.",
          },
          {
            title: "Tahap 2: Pembayaran DP (Down Payment) Otomatis",
            content:
              "Setelah menekan tombol 'Ajukan Booking', Anda akan diarahkan ke halaman invoice pembayaran DP melalui Payment Gateway resmi (QRIS, Virtual Account BCA/BRI/Mandiri, E-Wallet). DP dihitung proporsional sebagai tanda jadi komitmen.",
            warning:
              "Selesaikan pembayaran sebelum batas waktu countdown habis. Jika waktu habis, alokasi kamar akan otomatis dibuka kembali untuk pencari kos lain.",
          },
          {
            title: "Tahap 3: Verifikasi & Persetujuan Pemilik Kos",
            content:
              "Setelah DP terkonfirmasi lunas, sistem KosPasti akan mengirimkan notifikasi instan berupa WhatsApp Magic Link kepada pemilik kos. Pemilik kos memiliki waktu maksimal 1x24 jam untuk menyetujui pesanan Anda.\n\nJika disetujui, Anda akan menerima pesan WhatsApp konfirmasi resmi beserta kontak pemilik dan panduan check-in.",
            tips: [
              "Anda bisa memantau status pesanan kapan saja melalui menu 'Profil' → 'Riwayat Pesanan'.",
              "Sisa pembayaran biaya sewa bulan pertama dapat dilunasi langsung saat hari pertama masuk (check-in) sesuai kesepakatan dengan pemilik kos.",
            ],
          },
        ],
        relatedSlugs: ["kebijakan-penolakan-refund", "panduan-survei-komunikasi-pemilik"],
      },
      {
        id: "user-refund-policy",
        slug: "kebijakan-penolakan-refund",
        category: "user",
        title: "Kebijakan Penolakan oleh Pemilik & Proses Refund",
        subtitle: "Jaminan keamanan 100% uang kembali jika pesanan Anda tidak disetujui atau dibatalkan oleh pemilik kos.",
        iconName: "ShieldAlert",
        tags: ["Refund", "Keamanan", "Garansi Uang Kembali"],
        readTime: "3 Menit",
        summary: "Dana DP Anda tersimpan aman di rekening penampungan resmi KosPasti (Escrow) dan dijamin 100% kembali jika pemilik kos menolak pesanan Anda.",
        sections: [
          {
            title: "Mengapa Pesanan Bisa Ditolak Pemilik Kos?",
            content:
              "Pemilik kos berhak menolak pesanan karena beberapa alasan objektif, misalnya:\n\n• Kuota kamar baru saja terisi penuh oleh penyewa offline sebelum sistem terupdate.\n• Calon penyewa tidak memenuhi kriteria gender kos (misal: laki-laki memesan di kos khusus putri).\n• Tanggal masuk yang diminta melebihi batas toleransi tunggu kamar kosong.",
          },
          {
            title: "Bagaimana Prosedur Pengembalian Dana (Refund)?",
            content:
              "Ketika pemilik kos menolak pesanan Anda atau tidak memberikan respon hingga batas waktu habis, sistem KosPasti akan secara otomatis mengubah status pesanan menjadi 'Ditolak (Refund Diproses)'.\n\n1. Tim Layanan Pelanggan KosPasti akan menghubungi nomor WhatsApp Anda untuk memvalidasi nomor rekening/e-wallet pengembalian.\n2. Dana DP dikembalikan penuh 100% tanpa potongan biaya administrasi dalam waktu 1x24 jam hari kerja.\n3. Anda juga dapat langsung menggunakan saldo tersebut untuk memesan kos alternatif lain di KosPasti.",
            tips: [
              "Pastikan nomor WhatsApp dan identitas di profil Anda valid agar tim kami dapat menghubungi Anda dengan cepat.",
            ],
          },
        ],
        relatedSlugs: ["alur-pemesanan-booking-dp", "pelunasan-dan-checkin"],
      },
      {
        id: "user-survey-guide",
        slug: "panduan-survei-komunikasi-pemilik",
        category: "user",
        title: "Panduan Survei Langsung dan Komunikasi dengan Pemilik Kos",
        subtitle: "Etika dan tips penting saat ingin melakukan survei lokasi atau bertanya langsung ke pemilik kos.",
        iconName: "MapPin",
        tags: ["Survei Lokasi", "WhatsApp", "Tips Ngekos"],
        readTime: "2 Menit",
        summary: "Survei langsung sangat disarankan untuk memastikan kondisi fisik kamar, kenyamanan lingkungan sekitar, serta kecocokan aturan kos dengan gaya hidup Anda.",
        sections: [
          {
            title: "Tips Menghubungi Pemilik Kos via WhatsApp",
            content:
              "Pada halaman detail kos, tersedia tombol 'Chat Pemilik Kos via WhatsApp'. Saat menghubungi pemilik, perkenalkan diri Anda dengan sopan, sebutkan nama kos dan tipe kamar yang Anda minati di KosPasti, serta jadwalkan jam kedatangan survei terlebih dahulu.",
            tips: [
              "Hindari datang langsung tanpa membuat janji terlebih dahulu agar pemilik kos atau penjaga kos siap menyambut Anda.",
              "Tanyakan hal-hal spesifik seperti: daya listrik token, aturan jam malam tamu, ketersediaan parkir kendaraan, dan biaya tambahan (air/sampah/wifi).",
            ],
          },
        ],
        relatedSlugs: ["cara-cari-kos-filter-ai", "alur-pemesanan-booking-dp"],
      },
      {
        id: "user-checkin-settlement",
        slug: "pelunasan-dan-checkin",
        category: "user",
        title: "Pelunasan Sewa & Verifikasi Check-in di KosPasti",
        subtitle: "Langkah-langkah yang harus dilakukan saat hari pertama tiba di kos lokasi.",
        iconName: "KeyRound",
        tags: ["Check-in", "Pelunasan", "Serah Terima Kunci"],
        readTime: "2 Menit",
        summary: "Hari pertama masuk kos adalah momen penting untuk serah terima kunci dan memeriksa kondisi kamar sebelum pelunasan.",
        sections: [
          {
            title: "Langkah Check-in yang Aman",
            content:
              "1. Tunjukkan bukti pesanan berstatus 'Disetujui' dari riwayat pesanan KosPasti kepada pemilik/penjaga kos.\n2. Lakukan inspeksi bersama: cek kasur, AC, kran air kamar mandi, lampu kamar, dan kunci pintu.\n3. Lakukan pelunasan sisa biaya sewa bulan pertama (total harga sewa dikurangi DP yang telah dibayarkan melalui KosPasti).\n4. Minta tanda terima resmi atau simpan bukti transfer pelunasan.",
          },
        ],
        relatedSlugs: ["alur-pemesanan-booking-dp"],
      },
    ],
  },
  {
    id: "partner",
    title: "Pusat Bantuan Mitra (Pemilik Kos)",
    shortTitle: "Pemilik Kos (Mitra)",
    description: "Panduan operasional pengelolaan properti, stok kamar cepat, fitur Magic Link WhatsApp, serta penanganan pesanan masuk.",
    badge: "Mitra KosPasti",
    articles: [
      {
        id: "partner-property-stock",
        slug: "tambah-edit-kos-dan-stok-kamar-cepat",
        category: "partner",
        title: "Cara Menambah, Mengedit Kos & Update Stok Kamar Cepat",
        subtitle: "Kelola data properti, spesifikasi tipe kamar, dan perbarui sisa kamar kosong hanya dalam 1 detik.",
        iconName: "Building2",
        tags: ["Kelola Properti", "Update Kamar", "Tipe Kamar"],
        readTime: "4 Menit",
        summary: "Mitra dapat menambah properti baru, menentukan foto kamar, aturan, serta menggunakan fitur 'Update Kamar Cepat (+ / -)' langsung dari halaman Ringkasan Dasbor.",
        sections: [
          {
            title: "1. Menambah Properti Baru",
            content:
              "Buka menu 'Kelola Properti' di Dasbor Mitra, lalu klik tombol '+ Tambah Properti Baru'.\n\nIsi form secara lengkap:\n• Informasi Dasar: Nama kos, alamat lengkap, koordinat peta Google Maps, dan tipe penghuni (Putra, Putri, atau Campur).\n• Fasilitas & Aturan: Checklist fasilitas umum (WiFi, Dapur Bersama, Parkir Mobil, CCTV) dan aturan (Jam Malam, Hewan Peliharaan).\n• Tipe Kamar & Spesifikasi: Anda dapat menambahkan lebih dari satu tipe kamar (misal: Tipe Standar 3x3 dan Tipe Deluxe 3x4). Masukkan fasilitas khusus dan spesifikasi kamar.\n• Foto & Video Media: Unggah foto beresolusi jelas untuk menarik perhatian calon penyewa.",
            tips: [
              "Kos dengan foto terang dan spesifikasi ukuran kamar lengkap memiliki tingkat booking 3x lebih tinggi.",
            ],
          },
          {
            title: "2. Fitur 'Update Kamar Cepat' di Dasbor",
            content:
              "Anda tidak perlu membuka form edit properti yang panjang hanya untuk mengubah jumlah kamar kosong! Di halaman 'Ringkasan' Dasbor Mitra, terdapat tombol kontrol '+ / -' di samping setiap nama kos.\n\n• Tekan tombol '-' saat ada penyewa offline masuk.\n• Tekan tombol '+' saat ada penyewa yang check-out.",
            tips: [
              "Perubahan kamar akan langsung disinkronkan secara real-time ke halaman pencarian KosPasti sehingga mencegah double-booking.",
            ],
          },
        ],
        relatedSlugs: ["fitur-magic-link-whatsapp", "persetujuan-wa-vs-dasbor"],
      },
      {
        id: "partner-magic-link",
        slug: "fitur-magic-link-whatsapp",
        category: "partner",
        title: "Fitur Magic Link WhatsApp: Cara Kerja & Akses Sekali Klik",
        subtitle: "Kelola ketersediaan kamar dan setujui pesanan langsung dari notifikasi WhatsApp tanpa perlu login.",
        iconName: "Zap",
        tags: ["Magic Link", "WhatsApp Bot", "Otomasi"],
        readTime: "3 Menit",
        summary: "Magic Link adalah teknologi tautan aman terenkripsi berumur terbatas (tokenized URL) yang dikirimkan KosPasti ke WhatsApp pemilik kos untuk aksi cepat.",
        sections: [
          {
            title: "Bagaimana Cara Kerja Magic Link?",
            content:
              "Setiap kali ada calon penyewa yang membayar DP atau saat sistem meminta pembaruan status berkala, KosPasti akan mengirimkan pesan WhatsApp otomatis ke nomor terdaftar Anda.\n\nDi dalam pesan tersebut, terdapat link khusus (misal: `kospasti.id/update/abc123xyz`). Saat link tersebut Anda klik, halaman pembaruan aman akan terbuka secara instan tanpa meminta Anda mengetik email atau password kembali.",
          },
          {
            title: "Apakah Magic Link Aman?",
            content:
              "Ya, sangat aman. Magic Link dilengkapi token enkripsi unik dan memiliki masa kedaluwarsa otomatis. Hanya orang yang memegang akses nomor WhatsApp Anda yang dapat membuka link tersebut.",
            warning:
              "Jangan membagikan (forward) pesan berisi Magic Link kepada pihak lain untuk mencegah perubahan data oleh orang yang tidak berwenang.",
          },
        ],
        relatedSlugs: ["persetujuan-wa-vs-dasbor", "tambah-edit-kos-dan-stok-kamar-cepat"],
      },
      {
        id: "partner-approval-methods",
        slug: "persetujuan-wa-vs-dasbor",
        category: "partner",
        title: "Perbedaan Menyetujui Pesanan via WhatsApp vs Dasbor Mitra",
        subtitle: "Pilih cara kerja yang paling nyaman bagi Anda untuk merespons pesanan calon penyewa kos.",
        iconName: "CalendarCheck",
        tags: ["Persetujuan Pesanan", "Dasbor Mitra", "WhatsApp"],
        readTime: "3 Menit",
        summary: "KosPasti memberikan fleksibilitas penuh: Anda dapat menyetujui pesanan langsung via Magic Link WhatsApp di ponsel, atau melalui tabel manajemen pesanan di Dasbor Web.",
        sections: [
          {
            title: "Opsi 1: Menyetujui via WhatsApp (Paling Cepat)",
            content:
              "Cocok ketika Anda sedang bepergian atau sibuk. Saat notifikasi WhatsApp masuk, cukup klik tombol 'Setujui Pesanan' atau buka Magic Link yang tertera. Dalam 1 kali klik, status pesanan berubah menjadi Disetujui dan notifikasi otomatis dikirim ke penyewa.",
          },
          {
            title: "Opsi 2: Menyetujui via Dasbor Web Mitra",
            content:
              "Buka menu 'Daftar Pesanan' di `kospasti.id/partner/dashboard/bookings`. Di sini Anda dapat melihat informasi lebih komprehensif: detail profil calon penyewa, tanggal rencana masuk, riwayat chat, serta tombol 'Setujui' atau 'Tolak'.",
            tips: [
              "Jika Anda menolak pesanan, sistem secara otomatis akan mengembalikan sisa kamar ke stok aktif dan memulai proses pengembalian dana DP ke calon penyewa.",
            ],
          },
        ],
        relatedSlugs: ["fitur-magic-link-whatsapp", "pencairan-dana-keamanan"],
      },
      {
        id: "partner-funds-payout",
        slug: "pencairan-dana-keamanan",
        category: "partner",
        title: "Pencairan Dana DP Sewa & Keamanan Transaksi",
        subtitle: "Alur penarikan dana Down Payment ke rekening bank mitra pemilik kos.",
        iconName: "DollarSign",
        tags: ["Pencairan Dana", "Keuangan", "Bagi Hasil"],
        readTime: "3 Menit",
        summary: "Dana DP dari penyewa disimpan aman di rekening penampungan resmi KosPasti dan diteruskan ke rekening bank pemilik kos setelah proses verifikasi check-in.",
        sections: [
          {
            title: "Alur Penerusan Dana DP",
            content:
              "1. Calon penyewa membayar DP melalui sistem pembayaran resmi KosPasti.\n2. Pemilik kos menyetujui pesanan.\n3. Pada tanggal check-in (atau maksimal H+1 setelah penyewa masuk), dana DP akan ditransfer langsung ke rekening bank mitra yang terdaftar.\n4. Tidak ada potongan tersembunyi bagi pemilik kos.",
            tips: [
              "Pastikan nama rekening bank penerima sama dengan nama identitas KTP/pemilik kos yang terdaftar di akun KosPasti untuk mempercepat proses pencairan.",
            ],
          },
        ],
        relatedSlugs: ["persetujuan-wa-vs-dasbor"],
      },
      {
        id: "partner-occupancy-tips",
        slug: "tips-meningkatkan-okupansi-kos",
        category: "partner",
        title: "Tips Meningkatkan Okupansi & Daya Tarik Properti Kos",
        subtitle: "Strategi praktis agar kamar kos Anda cepat penuh dan konsisten diminati mahasiswa/karyawan.",
        iconName: "TrendingUp",
        tags: ["Tips Bisnis", "Okupansi", "Promosi"],
        readTime: "3 Menit",
        summary: "Data KosPasti membuktikan bahwa kecepatan respon, kelengkapan informasi kamar, dan transparansi aturan menjadi faktor utama penentu keputusan penyewa.",
        sections: [
          {
            title: "Strategi Terbaik Pemilik Kos Sukses",
            content:
              "• Pasang Foto Kamar Berkualitas: Ambil foto dengan pencahayaan alami di siang hari, perlihatkan sudut kasur, meja, jendela, dan kebersihan kamar mandi.\n• Lengkapi Spesifikasi Kamar: Tuliskan ukuran kamar (misal: 3x4 meter), jenis token listrik, dan arah ventilasi secara transparan.\n• Respon Cepat di WhatsApp: Balas chat calon penyewa dalam waktu kurang dari 15 menit untuk mengunci ketertarikan mereka.\n• Rutin Perbarui Stok Kamar: Selalu sesuaikan sisa kamar kosong lewat tombol Cepat di Dasbor agar data selalu akurat.",
          },
        ],
        relatedSlugs: ["tambah-edit-kos-dan-stok-kamar-cepat"],
      },
    ],
  },
];
