# Product Wiki

## KosPasti 🏠

> Platform Web Pencarian Kos (PWA) yang memberikan kepastian ketersediaan kamar secara *real-time* dan *effortless* via Magic Link WhatsApp.

### Product Vision
Menjadi platform pencarian tempat tinggal sementara (kos) nomor satu bagi mahasiswa di Indonesia yang memberikan jaminan kepastian 100% tanpa membuang waktu dan biaya survei manual.

### Current Status
- Phase: Prototyping
- Version: 0.1.0
- Last Updated: 2026-08-19

### Quick Navigation

1. [Product Plan](01-Product-Plan)
2. [Problem Statement](02-Problem-Statement)
3. [User Persona](03-User-Persona)
4. [User Journey](04-User-Journey)
5. [Product Requirements Document](05-Product-Requirements-Document)
6. [Product Specification](06-Product-Specification)
7. [User Stories](07-User-Stories)
8. [User Flow](08-User-Flow)
9. [Feature Specification](09-Feature-Specification)
10. [MVP Scope](10-MVP-Scope)
11. [Design Guidelines](11-Design-Guidelines)
12. [Technical Specification](12-Technical-Specification)
13. [Data Model](13-Data-Model)
14. [API Specification](14-API-Specification)
15. [Release Plan](15-Release-Plan)

### Team
| Role | Name |
|---|---|
| Product Owner | King Maharaja Dimas 👑 |
| Product/UX | King Maharaja Dimas 👑 |
| Lead Engineer | King Maharaja Dimas 👑 |
| Engineer | (TBD) |
| Engineer | (TBD) |

# 01. Product Plan

## Product Vision
Menjadi platform pencarian tempat tinggal (kos) nomor satu bagi mahasiswa di Indonesia yang memberikan jaminan kepastian 100% tanpa membuang waktu dan biaya survei manual.

## Product Goal
Memberikan solusi pencarian kos dengan data ketersediaan kamar yang divalidasi secara *real-time* untuk mengeliminasi pengalaman buruk mahasiswa mendatangi kos yang ternyata sudah penuh.

## Target User
1. **Primary User:** Mahasiswa perantau yang sedang mencari kos (Pencari Kos).
2. **Secondary User:** Ibu Kos / Pemilik properti (terutama kalangan lansia yang kurang melek teknologi).

## Problem
Ketidakpastian informasi ketersediaan kamar kos di internet yang menyebabkan mahasiswa membuang waktu, biaya bensin, dan tenaga, serta risiko terkena penipuan DP kos *online*.

## Value Proposition
Kepastian ketersediaan kamar 100% valid dan kemampuan mengamankan (*booking*) kamar dari jarak jauh secara aman, menghemat waktu dan tenaga pengguna.

## Product Strategy
- **Low-Friction Update:** Memanfaatkan integrasi *bot* WhatsApp (Magic Link) agar pemilik kos bisa memperbarui sisa kamar dengan 1 kali klik, tanpa perlu menginstal aplikasi atau *login*.
- **Progressive Web App (PWA):** Mengembangkan produk berbasis web yang sangat ringan dan cepat diakses melalui *browser* HP mahasiswa tanpa harus mengunduh aplikasi besar dari Play Store/App Store.
- **Escrow System (Rekening Bersama):** Menahan uang *Booking Fee* dari mahasiswa agar tidak langsung masuk ke pemilik kos sebelum kedatangan, guna membangun *trust* (kepercayaan).

## MVP Goal
Membuktikan dua asumsi paling berisiko: 
1) Pemilik kos bersedia rutin menekan *Magic Link* di WhatsApp untuk *update* data. 
2) Mahasiswa merasa cukup aman untuk mentransfer *Booking Fee* dari jarak jauh.

## Out of Scope
- Fitur *360° Virtual Tour* ruangan kos (Terlalu memakan biaya dan waktu produksi untuk versi awal).
- Sistem manajemen tagihan bulanan / keuangan untuk pemilik kos.
- Pembuatan aplikasi *Native* (Android `.apk` / iOS `.ipa`).

## Success Metrics
| Metric | Target |
|---|---:|
| Mahasiswa yang mencoba fitur pencarian (Adoption) | 50 Users |
| Conversion Rate penyelesaian *Booking* & Bayar (Activation) | 70% |
| Pemilik kos yang klik Magic Link & update data (Engagement) | 40% |
| Jumlah transaksi *Booking Fee* (Willingness to Pay) | ≥ 20% |

## Timeline
| Milestone | Target Date | Status |
|---|---|---|
| Prototype | 2026-08-26 | 🟡 In Progress |
| User Testing | 2026-09-02 | ⚪ Not Started |
| MVP Release | 2026-09-30 | ⚪ Not Started |

# 02. Problem Statement

## Problem Statement
> Mahasiswa perantau mengalami kesulitan menemukan kamar kosong secara pasti ketika melakukan survei kos secara online dan offline, yang menyebabkan pemborosan waktu, biaya transportasi, dan kelelahan fisik.

## Target User
1. **Pencari Kos (Primary):** Mahasiswa perantau (usia 18-24 tahun) yang mencari tempat tinggal di sekitar area kampus.
2. **Pemilik Kos (Secondary):** Pemilik kos (mayoritas lansia >50 tahun) yang mengelola propertinya secara konvensional dan merasa kesulitan menggunakan teknologi rumit.

## Context
Masalah ini paling parah dirasakan pada masa penerimaan mahasiswa baru atau pergantian semester akademik, di mana ribuan mahasiswa berebut mencari kos di radius 1-3 km dari area kampus dalam waktu yang bersamaan.

## Pain Points
1. **Data Kosong Palsu:** Mahasiswa sering mendapati kos sudah penuh saat didatangi langsung, padahal di aplikasi/internet masih berstatus "Tersedia".
2. **Survei Fisik Melelahkan:** Harus berkeliling masuk gang-gang sempit di bawah terik matahari hanya untuk menebak-nebak dan membaca spanduk "Terima Kos".
3. **Gesekan Teknologi:** Ibu Kos malas memperbarui data karena harus menginstal aplikasi, mengingat *password*, dan mengisi form yang panjang.

## Root Cause
Aplikasi pencarian kos konvensional tidak memiliki sistem pembaruan data yang ramah bagi pengguna lansia (pemilik kos). Akibat rumitnya proses tersebut, pemilik kos membiarkan data kamarnya usang, sehingga menciptakan "rantai misinformasi" yang merugikan para pencari kos.

## Evidence
| Evidence | Source | Finding |
|---|---|---|
| Keluhan Pencarian Kos | User Discovery Interview | 4 dari 5 mahasiswa mengaku pernah mendatangi kos yang di internet berstatus kosong, namun aslinya sudah penuh. |
| Kesulitan Update Data | User Discovery Interview | Mayoritas pemilik kos sering lupa *password* aplikasi manajemen kos dan merasa membalas WA satu per satu sangat merepotkan. |

## Existing Solution
Saat ini, pencari kos mengandalkan pencarian manual (berkeliling gang), bertanya ke grup WhatsApp/Facebook, atau menggunakan aplikasi *listing* properti konvensional (seperti Mamikos) yang sayangnya status kamarnya sangat jarang di- *update* oleh pemilik.

## Impact
- **Time:** Membuang waktu hingga berhari-hari hanya untuk melakukan survei ketersediaan kamar secara fisik.
- **Cost:** Biaya ojek/bensin yang membengkak selama proses keliling, serta tingginya risiko kerugian uang akibat penipuan transfer DP *online* ke pihak yang tidak bertanggung jawab.
- **Revenue:** Pemilik kos kehilangan potensi pendapatan lebih cepat karena kamar yang sudah kosong terlambat diketahui oleh mahasiswa.
- **Operational:** Ibu Kos kelelahan menjawab pesan *"Kamarnya masih kosong, Bu?"* di WhatsApp puluhan kali sehari secara berulang.
- **Other:** Mahasiswa mengalami stres mental dan kecemasan karena takut tidak mendapatkan tempat tinggal sebelum masa kuliah dimulai.

## Validation Summary
Hasil *User Testing* memvalidasi bahwa "Ketidakpastian Data" adalah sumber masalah (*pain point*) terbesar bagi mahasiswa perantau, jauh mengalahkan faktor fasilitas maupun harga. Mengatasi masalah pembaruan status data kamar ini adalah kunci utama (*core value*) dari produk KosPasti.

# 03. User Persona

## Primary Persona

### Name
Dimas (Mahasiswa Perantau)

### Profile
- Age: 19 Tahun.
- Occupation: Mahasiswa Baru.
- Location/context: Berada di kota perantauan (misal: Bandung/Yogyakarta/Malang), mencari kos dalam radius dekat kampus.
- Experience level: Pemula (Baru pertama kali mencari kos sendiri)

### Goals
1. Menemukan kamar kos yang sesuai *budget* dan dekat dengan kampus secepat mungkin.
2. Mendapatkan kepastian bahwa kamar kos yang diincarnya benar-benar masih kosong sebelum didatangi.
3. Mengamankan kamar dari jarak jauh tanpa takut terkena penipuan uang muka (DP).

### Pain Points
1. Frustrasi mendatangi lokasi kos dari aplikasi yang ternyata kamarnya sudah terisi penuh.
2. Kelelahan fisik dan pemborosan uang bensin akibat survei manual menyusuri gang-gang sempit seharian.
3. Takut dan ragu untuk transfer DP karena maraknya kasus penipuan kos *online*.

### Current Behavior
Dimas biasanya melihat-lihat aplikasi *listing* kos atau grup Facebook, lalu terpaksa datang langsung ke lokasi *(go show)* untuk memastikan sendiri ketersediaan kamar, sering kali berujung menelan kekecewaan karena zonk.

### Needs
1. Label ketersediaan kamar (Real-time Availability) yang 100% valid dan akurat.
2. Fitur *Booking* Instan yang aman dengan sistem Rekening Bersama (Escrow).
3. Informasi fasilitas dan harga yang transparan tanpa *hidden fee*.

### Quote
> "Saya capek keliling seharian masuk gang di bawah terik matahari, eh pas ketemu kos yang cocok, ternyata kamarnya udah penuh dari minggu lalu."

---

## Secondary Persona

### Name
Ibu Hj. Ratna (Pemilik Kos)

### Profile
- Age: 55 Tahun
- Occupation: Pensiunan & Pemilik Kos (20 Kamar)
- Location/context: Tinggal di rumah utama yang menyatu atau berdekatan dengan bangunan kos
- Experience level: Rendah / *Gaptek* (Hanya fasih menggunakan WhatsApp dan YouTube)

### Goals
1. Kamar kosnya selalu penuh terisi tanpa harus banyak usaha memasarkan.
2. Terhindar dari kerepotan menjawab pertanyaan berulang *"Kamarnya masih, Bu?"* dari puluhan calon penyewa di WhatsApp.
3. Mendapatkan kepastian penyewa (komitmen DP) agar kamar tidak "di-PHP".

### Pain Points
1. Selalu lupa *password* jika harus mendaftar aplikasi manajemen kos yang rumit.
2. Merasa pusing melihat form isian panjang untuk memperbarui data di internet.
3. Sering kelewatan merespons *chat* calon penyewa karena sedang sibuk mengurus rumah/cucu.

### Current Behavior
Hanya memasang spanduk "Terima Kos Menerima Mahasiswa/i" di pagar depan, dan mengandalkan balas *chat* WhatsApp secara manual jika ada nomor baru yang bertanya.

### Needs
1. Sistem pembaruan sisa kamar (Magic Link) yang bisa diakses langsung via WhatsApp tanpa perlu *login* atau *install* aplikasi.
2. Antarmuka (UI) super simpel dengan ukuran huruf (teks) yang besar agar mudah dibaca.
3. Notifikasi otomatis ke WA jika ada mahasiswa yang mentransfer *booking fee*.

### Quote
> "Aduh Mas, Ibu pusing kalau disuruh instal-instal aplikasi atau masukin *password*. Mending yang praktis-praktis aja lewat WA, yang penting kamarnya cepet laku."

# 04. User Journey

## Scenario
Dimas (Mahasiswa Perantau) mencari dan berusaha mengamankan kamar kos di area sekitar kampus baru sebelum masa orientasi dimulai.

| Stage | User Action | User Thought | Pain/Friction | Opportunity |
|---|---|---|---|---|
| **Trigger** | Dimas diterima di universitas luar kota dan menyadari ia butuh tempat tinggal secepatnya. | "Aku harus segera dapat kos yang dekat kampus dan sesuai *budget* sebelum kehabisan." | Waktu yang sempit dan minimnya pengetahuan tentang area kampus tujuan. | Menyediakan platform pencarian yang langsung fokus pada "Kamar Tersedia Hari Ini". |
| **Discovery** | Dimas mencari di aplikasi *listing* kos konvensional dan menemukan kos yang terlihat bagus dengan status "Tersedia". | "Wah, kos ini bagus dan harganya pas. Tapi ini datanya akurat nggak ya? Masih kosong beneran nggak ya?" | Keraguan terhadap keakuratan data di internet karena reputasi aplikasi kos yang jarang di-*update* pemiliknya. | Memberikan *Badge/Label* "100% Valid" beserta keterangan (*Last updated: 2 jam yang lalu*). |
| **Action** | Karena ragu untuk transfer DP, Dimas memutuskan datang langsung (survei fisik) ke lokasi menggunakan ojek *online*. | "Semoga kamarnya beneran masih ada, capek banget keliling nyari alamat masuk gang." | Menghabiskan uang transportasi, kelelahan fisik, dan saat tiba di lokasi ternyata kamar sudah dipesan orang lain (Zonk). | Fitur *Instant Booking* dengan sistem Rekening Bersama (Escrow) agar Dimas berani mengamankan kamar dari jarak jauh tanpa takut ditipu. |
| **Outcome** | Dimas merasa frustrasi dan terpaksa memulai pencarian dari awal dengan berkeliling jalan kaki dari satu pintu kos ke pintu kos lainnya. | "Sial, buang-buang waktu dan ongkos seharian cuma buat ditolak." | Kerugian waktu, finansial, dan kelelahan mental. | Memastikan Dimas hanya datang ke lokasi untuk *Check-In* dan serah terima kunci, bukan untuk bertanya "Masih kosong atau tidak?". |

## Key Opportunity
Peluang terbesar KosPasti terletak pada mengeliminasi proses **"survei zonk"**. Dengan menghubungkan sistem pembaruan yang sangat mudah bagi Ibu Kos (via WhatsApp Magic Link), kita bisa menyajikan data ketersediaan yang selalu *real-time* kepada pencari kos, sehingga mereka berani melakukan transaksi *booking* instan dari mana saja.

## Desired Journey
Inilah pengalaman ideal yang akan diciptakan oleh KosPasti:
1. Dimas membuka *web app* KosPasti dan mencari kos di area kampusnya.
2. Dimas melihat Kos Mawar dengan label **"Tersedia 2 Kamar - Diperbarui 10 menit yang lalu"**.
3. Tanpa perlu datang ke lokasi, Dimas langsung menekan tombol **"Amankan Kamar"** dan membayar *Booking Fee* (uang ditahan oleh sistem KosPasti, bukan ditransfer langsung ke pemilik untuk mencegah penipuan).
4. Ibu Kos menerima notifikasi WhatsApp bahwa kamarnya sudah dibooking Dimas, dan sistem KosPasti otomatis mengurangi sisa kamar menjadi 1.
5. Dimas datang ke kos beberapa hari kemudian hanya untuk mengambil kunci, merasa tenang dan efisien.

# 05. Product Requirements Document

## Background
Pencarian kamar kos saat ini dipenuhi dengan informasi palsu atau usang karena pemilik kos (yang mayoritas lansia) merasa terlalu rumit untuk memperbarui data melalui aplikasi. Hal ini menyebabkan mahasiswa membuang waktu, biaya transportasi, dan tenaga hanya untuk menemukan bahwa kos yang mereka datangi sudah penuh.

## Objective
Membangun platform PWA (*Progressive Web App*) yang menampilkan ketersediaan kamar kos secara 100% *real-time*, didukung oleh sistem pembaruan data yang paling minim gesekan (*frictionless*) bagi pemilik kos melalui WhatsApp.

## Target User
1. **Pencari Kos:** Mahasiswa perantau usia 18-24 tahun.
2. **Pemilik Kos:** Ibu kos / pensiunan usia >50 tahun.

## User Needs
1. **Pencari Kos:** Butuh kepastian bahwa kamar benar-benar kosong sebelum didatangi, serta cara aman untuk membayarkan DP (*Booking Fee*).
2. **Pemilik Kos:** Butuh cara paling praktis untuk mengubah jumlah sisa kamar kosong tanpa harus mengingat *password* atau mengunduh aplikasi baru.

## Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Sistem dapat mengirimkan *Magic Link* via WhatsApp otomatis ke pemilik kos. | Must |
| FR-002 | Halaman *Magic Link* memungkinkan pemilik kos menambah/mengurangi (+/-) angka sisa kamar tanpa *login*. | Must |
| FR-003 | Halaman utama web menampilkan daftar kos dengan label "Sisa Kamar" dan "Terakhir Diperbarui". | Must |
| FR-004 | Sistem menyediakan fitur *Instant Booking* untuk mahasiswa mengamankan kamar. | Must |
| FR-005 | Integrasi *Payment Gateway* (QRIS/E-Wallet) untuk pembayaran *Booking Fee* (Sistem Escrow). | Must |

## Non-Functional Requirements
- **Performance:** Waktu muat (*load time*) halaman utama web untuk mahasiswa maksimal 3 detik di jaringan 4G.
- **Security:** *Magic Link* harus menggunakan token unik terenkripsi. Uang *booking* dari mahasiswa wajib ditahan oleh sistem KosPasti (Escrow) sebelum pencari kos *check-in*.
- **Accessibility:** UI halaman *Magic Link* untuk pemilik kos harus memiliki teks berukuran besar (minimal 18px) dan kontras warna yang tinggi agar ramah untuk mata lansia.
- **Reliability:** Sistem *bot* WhatsApp harus memiliki *uptime* 99.9% agar pesan pembaruan selalu terkirim.

## MVP Requirements
1. Halaman Pencarian & Detail Kos (Untuk Mahasiswa).
2. Halaman *Checkout* dan Pembayaran QRIS Dummy (Untuk Mahasiswa).
3. Halaman *Update* Counter (+/-) yang super minimalis (Untuk Ibu Kos).
4. *Trigger Bot* WhatsApp API sederhana untuk mengirimkan *Magic Link*.

## Acceptance Criteria
- Pemilik kos berhasil mengubah status dari "1 Kamar" menjadi "0 Kamar" dalam waktu kurang dari 10 detik sejak membuka WhatsApp.
- Perubahan angka kamar dari pemilik kos langsung memantul (*real-time update*) ke layar pencarian mahasiswa tanpa perlu memuat ulang halaman (*refresh*).
- Mahasiswa dapat menyelesaikan alur *booking* dan menerima kuitansi digital penahanan dana kos.

## Out of Scope
- Pembuatan aplikasi *Native* yang harus diunduh lewat Google Play Store atau Apple App Store.
- Fitur *Virtual Tour 360°* untuk melihat isi kamar.
- Fitur manajemen tagihan listrik dan air bulanan anak kos.

# 06. Product Specification

## Feature
Pembaruan Status Kamar via Magic Link WhatsApp

## Objective
Memungkinkan pemilik kos (terutama lansia) untuk memperbarui data ketersediaan kamar kosong dalam hitungan detik tanpa perlu mengunduh aplikasi, mengingat *password*, atau melakukan *login*.

## User
Ibu Hj. Ratna (Pemilik Kos / Secondary Persona)

## User Story
> As a **Pemilik Kos**, I want **mengubah jumlah sisa kamar kosong langsung melalui link yang dikirim ke WhatsApp**, so that **data kamar saya selalu akurat di internet tanpa saya harus repot membuka aplikasi dan memasukkan password**.

## User Flow
1. Sistem KosPasti mengirimkan pesan *broadcast* WhatsApp secara berkala (misal: seminggu sekali) atau di- *trigger* manual oleh pemilik dengan membalas pesan "UPDATE".
2. Pesan tersebut berisi teks sapaan dan sebuah URL *Magic Link* unik.
3. Pemilik kos mengklik URL tersebut.
4. *Browser* HP terbuka (tanpa minta *login*), menampilkan UI sangat sederhana: Nama Kos, Angka Sisa Kamar, dan tombol Plus (+) / Minus (-).
5. Pemilik menekan tombol (-) atau (+) untuk menyesuaikan jumlah kamar kosong saat ini.
6. Pemilik menekan tombol "Simpan".
7. Halaman menampilkan status "Berhasil Diperbarui" dan data langsung berubah secara *real-time* di aplikasi pencarian mahasiswa.

## Business Rules
- *Magic Link* menggunakan sistem Token Unik (bukan ID urut) yang dienkripsi demi keamanan.
- Masa aktif satu *Magic Link* kedaluwarsa (*expired*) dalam waktu 24 jam setelah dikirim.
- Jumlah ketersediaan kamar tidak boleh kurang dari 0.
- Pembaruan dari *Magic Link* otomatis mengubah data `last_updated` di sistem, yang akan memengaruhi peringkat pencarian (kos yang baru di-*update* tampil paling atas).

## UI Requirements
- **Desain Minimalis Ekstrem:** Tidak ada *header*, navigasi menu, atau *footer*. Hanya fokus ke kontrol angka.
- **Ramah Lansia (Accessibility):** Teks angka dan tombol (+/-) harus berukuran sangat besar (minimal *touch target* 48x48 pixel). Kontras warna tajam (misal: tombol hitam, teks putih).
- Status "Tersimpan" harus terlihat sangat jelas (gunakan warna hijau dengan centang besar).

## Data Requirements
- `kos_id` (Relasi ke tabel Kos)
- `magic_token` (String, Enkripsi unik per *generate*)
- `available_rooms` (Integer, data kamar yang dikirim)
- `last_updated` (Timestamp, merekam kapan terakhir tombol simpan ditekan)

## Acceptance Criteria
- [ ] *Magic Link* bisa dibuka langsung dari WhatsApp dan menampilkan antarmuka web tanpa meminta form *Login*.
- [ ] Tombol Minus (-) *disabled* / tidak bisa ditekan jika angka sisa kamar mencapai angka 0.
- [ ] Angka yang disimpan berhasil memicu pembaruan di pangkalan data (Database) dan langsung mengubah tampilan di layar pencari kos (*real-time*).

## Edge Cases
- **Link Kedaluwarsa:** Jika pemilik kos mengklik tautan setelah lewat 24 jam, tampilkan pesan *error* yang ramah: *"Tautan ini sudah kedaluwarsa. Silakan ketik UPDATE di nomor WA ini untuk meminta tautan baru."*
- **Koneksi Terputus:** Jika internet ibu kos mati saat menekan "Simpan", tampilkan *toast/alert*: *"Gagal menyimpan, periksa koneksi internet Ibu."*

# 07. User Stories

## Epic: Real-time Data Update (Magic Link)

### US-001 — Menerima Tautan Magic Link via WA
**As a** Pemilik Kos (Ibu Hj. Ratna)  
**I want** menerima tautan (*link*) khusus melalui pesan WhatsApp  
**So that** saya bisa langsung memperbarui data ketersediaan kamar tanpa perlu repot membuka aplikasi dan memasukkan *password*.

#### Acceptance Criteria
- [ ] Sistem berhasil mengirim pesan WhatsApp ke nomor pemilik kos yang terdaftar.
- [ ] Tautan yang dikirimkan memiliki token unik terenkripsi untuk keamanan.
- [ ] Tautan langsung membuka *browser web* bawaan HP pengguna saat diklik.

#### Priority
Must

#### Related Feature
FR-001

---

### US-002 — Memperbarui Angka Sisa Kamar (Counter)
**As a** Pemilik Kos (Ibu Hj. Ratna)  
**I want** melihat angka sisa kamar saya dan menyesuaikannya menggunakan tombol tambah/kurang (+/-)  
**So that** informasi kamar saya di internet selalu akurat hanya dalam hitungan detik.

#### Acceptance Criteria
- [ ] Halaman web langsung terbuka dan menampilkan form *counter* (+/-) tanpa meminta *Login*.
- [ ] Tombol Minus (-) tidak dapat ditekan jika sisa kamar adalah 0.
- [ ] Saat tombol "Simpan" ditekan, data di *database* diperbarui dan menampilkan notifikasi sukses hijau berukuran besar.

#### Priority
Must

#### Related Feature
FR-002

---

## Epic: Kos Search & Discovery

### US-003 — Melihat Status Kamar Valid (Real-time Availability)
**As a** Mahasiswa Pencari Kos (Dimas)  
**I want** melihat label jumlah ketersediaan kamar beserta waktu terakhir data tersebut diperbarui  
**So that** saya merasa yakin dan tidak membuang waktu mendatangi kos yang ternyata sudah penuh (zonk).

#### Acceptance Criteria
- [ ] Kartu (*card*) kos di halaman utama menampilkan informasi ketersediaan (misal: "Sisa 2 Kamar").
- [ ] Kartu kos menampilkan stempel waktu (misal: "Diperbarui 10 Menit yang lalu").
- [ ] Kos yang sisa kamarnya 0 otomatis turun ke urutan bawah atau diberi label abu-abu "Penuh".

#### Priority
Must

#### Related Feature
FR-003

---

## Epic: Instant Booking & Escrow

### US-004 — Membayar Booking Fee dengan Aman
**As a** Mahasiswa Pencari Kos (Dimas)  
**I want** membayar biaya pemesanan (*Booking Fee*) melalui platform resmi KosPasti  
**So that** kamar incaran saya terkunci (diamankan) sebelum saya datang, dan uang saya aman dari penipuan.

#### Acceptance Criteria
- [ ] Pengguna dapat mengklik tombol "Amankan Kamar" di halaman detail kos.
- [ ] Pengguna diarahkan ke halaman *Checkout* yang memunculkan QRIS pembayaran.
- [ ] Saat pembayaran berhasil, status sisa kamar di *database* otomatis berkurang 1.
- [ ] Uang masuk ke *Escrow* (Rekening Bersama KosPasti), bukan langsung ke rekening pemilik kos.

#### Priority
Must

#### Related Feature
FR-004, FR-005

# 08. User Flow

## Core User Flow (Magic Link Update)
```text
Terima Notifikasi WhatsApp (Entry)
  ↓
Klik Link & Sesuaikan Angka Kamar (Action)
  ↓
Database Diperbarui Secara Real-time (System Response)
  ↓
Status Kamar Menjadi "100% Valid" di Web Mahasiswa (User Gets Value)
  ↓
Kamar Cepat Laku Tanpa Banyak Tanya Jawab (Desired Outcome)
```

## Detailed Flow

**Skenario: Ibu Kos memperbarui data kamar yang baru saja kosong.**
1. Sistem KosPasti mengirimkan pesan WhatsApp ke nomor Ibu Kos (contoh: *"Halo Bu, ada mahasiswa yang nanya nih, kamarnya masih sisa berapa? Klik link ini untuk update ya..."*).
2. Ibu Kos mengklik *Magic Link* tersebut. Tautan otomatis membuka *browser web* bawaan HP (Chrome/Safari) tanpa meminta *Login*.
3. Halaman web menampilkan UI sederhana dengan teks "Sisa Kamar Kosong" dan angka (misal: 0). Ibu Kos menekan tombol Plus (+) sehingga angka berubah menjadi 1.
4. Ibu Kos menekan tombol hijau besar bertuliskan **"Simpan & Tampilkan"**.
5. Sistem memvalidasi tautan, menyimpan perubahan angka ke pangkalan data (*database*), dan otomatis mengubah waktu `last_updated`.

## Alternative Flows

### Error
**Link Kedaluwarsa / Expired:**
Jika Ibu Kos mengklik tautan setelah lewat batas waktu (misal: lebih dari 24 jam), sistem akan mengarahkan ke halaman *Error* yang ramah bertuliskan: *"Maaf Bu, link ini sudah kedaluwarsa untuk keamanan. Silakan ketik kata **UPDATE** dan kirim ke nomor WA ini untuk mendapatkan link baru."*

**Koneksi Terputus:**
Jika internet terputus saat tombol "Simpan" ditekan, muncul *toast message* berwarna merah: *"Gagal menyimpan data. Pastikan internet HP Ibu menyala ya."*

### Empty State
**Kamar Habis (0 Kamar):**
Jika sisa kamar diatur menjadi angka "0", tombol minus (-) akan otomatis dimatikan (*disabled*) agar tidak menjadi angka minus. Tampilan UI akan berubah abu-abu dengan keterangan: *"Status saat ini: Kos Penuh."*

### Success State
**Data Berhasil Disimpan:**
Setelah penomoran berhasil disimpan, halaman langsung berubah menampilkan animasi Centang Hijau besar dengan teks: *"Berhasil! Data kamar Ibu sudah diperbarui dan sekarang tampil paling atas di pencarian mahasiswa."*

# 09. Feature Specification

## Feature List

| ID | Feature | Priority | Status |
|---|---|---|---|
| F-001 | WhatsApp Magic Link (Generator & Updater) | Must | Todo |
| F-002 | Real-time Kos Search & Filtering | Must | Todo |
| F-003 | Instant Booking & Escrow Payment | Must | Todo |
| F-004 | Detail Kos & Keterangan Fasilitas | Must | Todo |
| F-005 | WhatsApp Bot Notification Alerts | Should | Backlog |

---

## Feature Details

### F-001 — WhatsApp Magic Link (Generator & Updater)

**Objective:**  
Menghilangkan hambatan (*friction*) bagi pemilik kos lansia dalam memperbarui data ketersediaan kamar, sehingga platform memiliki data yang 100% akurat.

**User:**  
Pemilik Kos (Ibu Hj. Ratna)

**Input:**  
- Parameter URL (Token unik tersandi).
- Aksi klik tombol `+` (Tambah) atau `-` (Kurang).
- Aksi klik tombol `Simpan`.

**Process:**  
1. Sistem membaca dan memvalidasi `magic_token` pada URL.
2. Jika token valid, sistem menampilkan UI *counter* kamar.
3. Saat pengguna menekan "Simpan", sistem memperbarui nilai `available_rooms` dan `last_updated` di pangkalan data.

**Output:**  
- Tampilan layar sukses berlogo Centang Hijau.
- Angka sisa kamar berubah di aplikasi mahasiswa secara *real-time*.

**Business Rules:**
- Tautan (*link*) kedaluwarsa dalam 24 jam.
- Angka sisa kamar (`available_rooms`) minimum adalah 0.

**Acceptance Criteria:**
- [ ] Tautan dibuka langsung dari WA tanpa meminta form *Login*.
- [ ] Tombol Simpan berhasil mengubah data dan menampilkan pesan sukses.

---

### F-002 — Real-time Kos Search & Filtering

**Objective:**  
Memungkinkan mahasiswa mencari kamar kos sesuai kriteria (lokasi/kampus, harga, gender) dengan menyajikan data yang paling baru diperbarui.

**User:**  
Mahasiswa Pencari Kos (Dimas)

**Input:**  
- Teks pencarian (opsional).
- Pemilihan filter: Rentang Harga, Tipe Kos (Putra/Putri/Campur).

**Process:**  
1. Sistem menarik data tabel Kos dari *database*.
2. Sistem menyaring data berdasarkan input filter dari pengguna.
3. Sistem mengurutkan hasil (*sorting*): Kos dengan `available_rooms` > 0 dan `last_updated` paling baru akan berada di urutan teratas.

**Output:**  
Daftar kartu properti Kos yang menampilkan foto, nama, harga, dan *badge* status sisa kamar.

**Business Rules:**
- Kos dengan sisa kamar 0 tetap ditampilkan, tetapi warnanya diubah menjadi abu-abu dan dipindah ke urutan paling bawah pencarian.

**Acceptance Criteria:**
- [ ] Pencarian dan filter berhasil menampilkan data kos yang sesuai.
- [ ] Terdapat label "Terakhir diperbarui: [Waktu]" pada setiap kartu kos.

---

### F-003 — Instant Booking & Escrow Payment

**Objective:**  
Memungkinkan mahasiswa mengamankan kamar incaran dari jarak jauh secara aman menggunakan sistem Rekening Bersama.

**User:**  
Mahasiswa Pencari Kos (Dimas)

**Input:**  
- Klik tombol "Amankan Kamar".
- Pengisian data penyewa (Nama, No WA, Tanggal Masuk).
- Pemindaian/pembayaran QRIS atau *E-Wallet*.

**Process:**  
1. Sistem membuat ID Transaksi dengan status `Pending`.
2. Sistem memanggil *API Payment Gateway* untuk memunculkan QRIS.
3. Setelah pembayaran sukses, *webhook payment* dipanggil, dan status transaksi berubah menjadi `Paid`.
4. Sistem otomatis mengurangi angka `available_rooms` di *database* sebesar -1.

**Output:**  
Halaman sukses *booking* dan kuitansi digital penahanan dana.

**Business Rules:**
- Uang tidak ditransfer langsung ke pemilik kos, melainkan ditahan oleh KosPasti sampai mahasiswa datang dan serah terima kunci.
- Waktu pembayaran dibatasi (misal: 15 menit), jika lewat, *booking* otomatis dibatalkan.

**Acceptance Criteria:**
- [ ] QRIS muncul dan bisa disimulasikan pembayarannya.
- [ ] Status kamar langsung berkurang otomatis setelah sistem menerima respons pembayaran sukses.

---

### F-004 — Detail Kos & Keterangan Fasilitas

**Objective:**  
Memberikan informasi lengkap mengenai spesifikasi kamar dan aturan kos sebagai bahan pertimbangan akhir bagi pencari kos sebelum melakukan pembayaran.

**User:**  
Mahasiswa Pencari Kos (Dimas)

**Input:**  
- Klik pada salah satu Kartu Kos di halaman pencarian.

**Process:**  
Sistem menarik seluruh relasi data untuk `kos_id` tersebut, termasuk daftar fasilitas (WiFi, AC, Kamar Mandi Dalam), foto galeri, dan aturan kos.

**Output:**  
Halaman Detail Kos yang informatif dengan tombol aksi (CTA) menempel di bagian bawah (*sticky bottom*).

**Business Rules:**
- Jika `available_rooms` = 0, tombol CTA "Amankan Kamar" berubah menjadi "Kamar Penuh" dan dinonaktifkan (*disabled*).

**Acceptance Criteria:**
- [ ] Halaman menampilkan seluruh teks dan ikon fasilitas dengan rapi.
- [ ] Tombol CTA menempel di layar HP pengguna meski halaman di-*scroll*.

---

### F-005 — WhatsApp Bot Notification Alerts

**Objective:**  
Memberikan informasi instan kepada pemilik kos mengenai adanya mahasiswa yang memesan kamarnya.

**User:**  
Sistem KosPasti & Pemilik Kos

**Input:**  
- *Trigger internal*: Terjadi perubahan status transaksi menjadi `Paid` dari fitur F-003.

**Process:**  
1. Sistem menyusun *template* pesan teks berisi detail pemesanan (Nama Mahasiswa, Tanggal Masuk, dan Nominal).
2. Sistem mengirimkan *request* ke *WhatsApp API Gateway* untuk meneruskan pesan tersebut ke nomor HP pemilik kos.

**Output:**  
Pesan masuk di WhatsApp Ibu Kos secara instan.

**Business Rules:**
- Pesan otomatis dikirim selambat-lambatnya 1 menit setelah sistem menerima konfirmasi pembayaran berhasil.

**Acceptance Criteria:**
- [ ] Pesan WA diterima oleh Ibu Kos dengan format teks yang sesuai *template*.

# 10. MVP Scope

## MVP Objective
Membuktikan dua asumsi paling berisiko (*riskiest assumptions*): 
1. Ibu Kos bersedia memperbarui ketersediaan kamar secara rutin hanya dengan mengklik *Magic Link* di WhatsApp tanpa harus *login*.
2. Mahasiswa perantau merasa aman dan bersedia mentransfer *Booking Fee* secara *online* untuk mengamankan kamar yang datanya tervalidasi.

## Must Have
- Sistem pengiriman dan validasi *Magic Link* WhatsApp untuk pemilik kos.
- Halaman UI *update counter* (+/-) sisa kamar yang super sederhana dan tidak membutuhkan *login*.
- Halaman web utama (PWA) untuk mahasiswa mencari kos dengan label "Sisa Kamar" & "Terakhir Diperbarui".
- Fitur *Checkout* dan pembayaran *Booking Fee* (sistem Escrow/Rekening Bersama untuk MVP).

## Should Have
- Filter pencarian kos berdasarkan rentang harga, jenis kelamin (Putra/Putri/Campur), dan fasilitas utama.
- Pesan otomatis (Notifikasi WA) ke pemilik kos saat ada mahasiswa yang berhasil membayar *booking*.

## Could Have
- Integrasi peta interaktif (Google Maps) di halaman detail kos.
- Fitur "Bagikan Kos Ini" ke media sosial atau grup WhatsApp (Share button).

## Not Now
- Pembuatan aplikasi *Native* yang harus di- *download* via Play Store/App Store.
- Fitur manajemen tagihan listrik/air/WiFi bulanan anak kos.
- Fitur *Virtual Tour 360°* atau ulasan video beresolusi tinggi.
- Sistem obrolan internal (*In-app messaging*) antara mahasiswa dan pemilik kos.

## MVP Core Flow
1. **Trigger:** Ibu Kos menerima pesan WA -> klik *Magic Link* -> perbarui angka sisa kamar menjadi "1".
2. **Discovery:** Mahasiswa membuka web KosPasti -> melihat Kos tersebut dengan label *100% Valid* -> klik *Amankan Kamar*.
3. **Action:** Mahasiswa membayar *Booking Fee* via QRIS -> Sistem KosPasti menahan uang tersebut (Escrow).
4. **Outcome:** Ibu Kos mendapat notifikasi WA bahwa kamarnya telah dipesan -> Sisa kamar di web otomatis menjadi "0" -> Mahasiswa datang mengambil kunci.

## MVP Success Criteria
- [ ] Pemilik kos dapat memperbarui ketersediaan kamar melalui WhatsApp dalam waktu kurang dari 10 detik.
- [ ] Perubahan angka sisa kamar langsung memantul (*real-time*) di halaman pencarian tanpa *delay* yang berarti.
- [ ] Konversi pembayaran: Minimal ada mahasiswa yang berhasil menyelesaikan transaksi *Booking Fee* secara *end-to-end* tanpa *error*.

# 11. Design Guidelines

## Design Principles
1. **Simple:** Antarmuka fokus pada satu tujuan utama per halaman (misal: halaman Ibu Kos hanya untuk *update* angka).
2. **Clear:** Status sistem harus langsung terlihat jelas (misal: "Kamar Penuh", "Berhasil Disimpan").
3. **Consistent:** Menggunakan komponen visual yang seragam di seluruh aplikasi.
4. **Accessible:** Ukuran teks besar, area sentuh yang luas, dan kontras warna yang tajam, wajib ramah untuk mata pengguna lansia.

## UI Library
- **shadcn/ui** (Digunakan sebagai fondasi komponen antarmuka yang ringan, dapat diakses, dan dapat dikustomisasi penuh).

## Styling
- **Tailwind CSS** (Menggunakan sistem *utility-first* untuk memastikan konsistensi dan mempercepat proses pembuatan UI).

## Icons
- **Lucide Icons** (Menggunakan ikon bergaris yang bersih, modern, ringan, dan sejalan dengan standar *shadcn/ui*).

## Typography
- **Font Family:** Inter atau sistem *sans-serif* bawaan (bersih, netral, dan mudah dibaca di berbagai resolusi layar).
- **Heading (H1, H2):** Digunakan untuk Nama Kos atau pesan keberhasilan (*Font-weight*: Bold/Semibold).
- **Body Text:** Minimal ukuran 16px untuk antarmuka mahasiswa (Pencari Kos).
- **Accessibility Text:** Minimal ukuran 18px - 24px khusus untuk antarmuka *Magic Link* Ibu Kos agar angka mudah dibaca.

## Spacing
- Menggunakan sistem *Spacing* kelipatan 4 bawaan Tailwind CSS (misal: `p-4` untuk *padding* 16px, `gap-2` untuk jarak 8px).
- **Touch Target:** Setiap elemen interaktif yang bisa diklik (tombol `+`, `-`, dan "Simpan") wajib memiliki area sentuh minimal 48x48 pixel agar tidak terjadi salah pencet (*fat-finger error*).

## Components
- **Kos Property Card:** Kartu yang merangkum foto, nama kos, harga, fasilitas, dan stempel waktu.
- **Availability Badge:** Indikator visual ketersediaan (Warna Hijau = Tersedia, Warna Abu-abu = Penuh).
- **Magic Link Counter:** Komponen tombol tambah/kurang (+/-) berukuran raksasa khusus halaman Ibu Kos.
- **Sticky Bottom Action:** Tombol "Amankan Kamar" atau "Simpan Data" yang selalu menempel di bagian bawah layar HP pengguna (*mobile-first approach*).

## States
Every interactive component should consider:
- **Default:** Tampilan awal komponen saat belum ada interaksi.
- **Hover:** Perubahan bayangan/warna saat kursor di atas elemen (untuk akses *desktop*).
- **Focus:** *Outline* (garis luar) yang jelas saat elemen disorot (untuk aksesibilitas).
- **Loading:** *Skeleton loading* (kerangka bayangan) atau animasi memutar (*spinner*) saat memproses.
- **Empty:** Tombol dinonaktifkan (*disabled*) jika nilai mencapai batas, misal ketersediaan "0".
- **Error:** Teks warna merah dan ikon peringatan jika tautan kedaluwarsa atau koneksi terputus.
- **Success:** Animasi centang berukuran besar dan teks hijau cerah saat penyimpanan data berhasil.

# 12. Technical Specification

## Technology Stack

| Layer | Technology |
|---|---|
| Framework / Frontend | Next.js (App Router) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Icons | Lucide Icons |
| Database | SQLite |
| ORM | Prisma |

## Architecture
KosPasti menggunakan arsitektur **Monolithic / Fullstack Serverless** berbasis Next.js.
- **Frontend:** Menggunakan *React Server Components* (RSC) untuk performa *load* yang cepat dan *Client Components* untuk interaktivitas pengguna.
- **Backend/API:** Menggunakan *Next.js Route Handlers* (`app/api/...`) untuk menangani logika bisnis (seperti validasi *Magic Link* dan *Booking*) secara langsung di dalam satu *codebase*.
- **Database:** Menggunakan SQLite lokal yang diatur menggunakan Prisma ORM. Ini mempercepat proses pembuatan prototipe tanpa perlu menyewa *server database* terpisah.

## Repository
[https://github.com/dimasferial05-ctrl/kospasti-web-app](https://github.com/dimasferial05-ctrl/kospasti-web-app)

## Environment
- Node.js: v20.x (LTS) atau versi terbaru
- Package manager: npm
- Version Control: Git

## Application Structure
```text
kospasti-web-app/
├── prisma/             # Skema database (schema.prisma) & file SQLite
├── public/             # Aset statis (gambar, logo, ikon)
├── src/
│   ├── app/            # Next.js App Router (Halaman UI & API Routes)
│   ├── components/     # UI Library shadcn/ui & Reusable Components
│   ├── lib/            # Fungsi utilitas (Prisma client, generator token)
│   └── styles/         # Konfigurasi Tailwind & CSS global
├── .env                # Variabel lingkungan (Rahasia/Tokens)
├── next.config.mjs     # Konfigurasi aplikasi Next.js
└── package.json        # Daftar dependensi aplikasi
```

## Technical Decisions
| Decision | Reason |
|---|---|
| **Pindah ke Next.js (dari React murni)** | Memungkinkan pembuatan fitur *backend* (API validasi tautan) secara instan di dalam folder yang sama tanpa membuat *server Node/Express* terpisah. |
| **SQLite vs Cloud Database** | Meminimalisir biaya dan hambatan teknis saat tahap pembuatan prototipe. Mudah dimigrasikan ke PostgreSQL di masa depan berkat Prisma. |
| **shadcn/ui vs Framework CSS konvensional** | Komponen jauh lebih modern, mudah diakses (*accessible* untuk lansia), dan *styling*-nya tidak akan bentrok karena terikat langsung dengan Tailwind. |

## Technical Risks
- **Keamanan Magic Link:** URL unik bisa disalin dan dikirim Ibu Kos ke orang yang salah. *(Mitigasi: Token kedaluwarsa otomatis dalam 24 jam dan bisa di-reset manual).*
- **Write-Locks pada SQLite:** Karena menggunakan file lokal tunggal, sistem bisa sedikit melambat jika ada puluhan orang yang melakukan transaksi *Booking* di milidetik yang sama persis. *(Mitigasi: Sangat aman untuk skala jumlah pengguna MVP saat ini).*

# 13. Data Model

## Entities

### Owner (Pemilik Kos)
| Field | Type | Required | Notes |
|---|---|---|---|
| id | String (UUID) | Yes | Primary Key |
| name | String | Yes | Nama Ibu/Bapak Kos |
| phone_number | String | Yes | Nomor WhatsApp aktif untuk menerima link |
| created_at | DateTime | Yes | Default: now() |

### Property (Kamar Kos)
| Field | Type | Required | Notes |
|---|---|---|---|
| id | String (UUID) | Yes | Primary Key |
| name | String | Yes | Nama Kos (Contoh: "Kos Mawar Putra") |
| address | String | Yes | Alamat lengkap |
| price_per_month | Int | Yes | Harga sewa per bulan |
| available_rooms | Int | Yes | Sisa kamar (Target update Magic Link) |
| last_updated | DateTime | Yes | Kapan terakhir Ibu Kos klik simpan |
| owner_id | String (UUID) | Yes | Foreign Key -> Owner.id |

### MagicLink (Token Akses WA)
| Field | Type | Required | Notes |
|---|---|---|---|
| id | String (UUID) | Yes | Primary Key |
| token | String | Yes | String acak yang dienkripsi (Unik) |
| expires_at | DateTime | Yes | Waktu kedaluwarsa (24 jam dari pembuatan) |
| is_valid | Boolean | Yes | Default: true. Menjadi false jika direvoke |
| property_id | String (UUID) | Yes | Foreign Key -> Property.id |

### Booking (Transaksi Mahasiswa)
| Field | Type | Required | Notes |
|---|---|---|---|
| id | String (UUID) | Yes | Primary Key |
| student_name | String | Yes | Nama pencari kos |
| student_phone | String | Yes | Nomor kontak pencari kos |
| status | String | Yes | Enum: PENDING, PAID, CANCELLED |
| amount | Int | Yes | Nominal Booking Fee |
| property_id | String (UUID) | Yes | Foreign Key -> Property.id |
| created_at | DateTime | Yes | Waktu transaksi dibuat |

## Relationships

```text
Owner (1)
 └── (N) Property (1)
           ├── (N) MagicLink
           └── (N) Booking
```
*(Keterangan: 1 Owner bisa memiliki Banyak Property. 1 Property bisa memiliki Banyak riwayat MagicLink dan transaksi Booking).*

## Database Rules
- **Cascade Deletion:** Jika sebuah entitas `Property` dihapus dari pangkalan data, maka semua relasi `MagicLink` dan `Booking` yang terikat pada properti tersebut akan otomatis terhapus (Cascade) untuk mencegah data yatim (*orphan data*).
- **Available Rooms Constraint:** Nilai kolom `available_rooms` di entitas `Property` tidak boleh bernilai negatif (< 0).
- **Token Unique Index:** Kolom `token` pada tabel `MagicLink` harus di-indeks sebagai `Unique` agar pencarian data saat validasi link berjalan sangat cepat.

## Notes
- **No Student Auth Table:** Untuk meminimalisir hambatan (*friction*) pada versi MVP, mahasiswa (Pencari Kos) tidak diwajibkan mendaftar akun/Login. Data mereka (`student_name` dan `student_phone`) langsung dicatat sebagai pelengkap di dalam tabel `Booking` saat *checkout*.
- **Prisma Defaults:** `id` secara bawaan akan di- *generate* oleh Prisma menggunakan fungsi `cuid()` atau `uuid()` agar lebih aman dari serangan penebakan ID.

# 14. API Specification

> Karena KosPasti menggunakan Next.js App Router, API di bawah ini akan diimplementasikan sebagai **Route Handlers** di dalam folder `src/app/api/...`.

## Base URL
`/api`

## Endpoints

### GET /api/properties
**Purpose:** Mengambil daftar kos beserta sisa kamarnya untuk ditampilkan di halaman pencarian mahasiswa.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prop_123",
      "name": "Kos Mawar Putra",
      "price_per_month": 500000,
      "available_rooms": 2,
      "last_updated": "2026-08-19T10:00:00Z"
    }
  ]
}
```

### POST /api/magic-link/update
**Purpose:** Memvalidasi token *Magic Link* dan memperbarui angka sisa kamar secara bersamaan saat Ibu Kos menekan tombol "Simpan".

**Request:**
```json
{
  "token": "abcde12345-token-rahasia",
  "available_rooms": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data kamar berhasil diperbarui",
  "data": {
    "property_id": "prop_123",
    "available_rooms": 1,
    "last_updated": "2026-08-19T11:05:00Z"
  }
}
```

### POST /api/bookings
**Purpose:** Merekam data pemesanan mahasiswa dan menginisiasi pembayaran (menghasilkan *link* QRIS/Payment).

**Request:**
```json
{
  "property_id": "prop_123",
  "student_name": "Dimas",
  "student_phone": "08123456789",
  "amount": 500000
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "book_987",
  "status": "PENDING",
  "payment_url": "[https://dummy-payment-gateway.com/pay/book_987](https://dummy-payment-gateway.com/pay/book_987)"
}
```

## Error Handling
| Status | Meaning | Solusi UI (Frontend) |
|---|---|---|
| 400 | Bad Request | Tampilkan pesan validasi (contoh: "Nomor WA belum diisi"). |
| 401 | Unauthorized | Token *Magic Link* kedaluwarsa, tampilkan halaman peringatan ke Ibu Kos. |
| 404 | Not Found | Data tidak ditemukan di pangkalan data. |
| 500 | Server Error | Tampilkan *toast alert* berwarna merah: "Terjadi kesalahan, coba lagi." |

# 15. Release Plan

## Release Strategy

### Milestone 1 — Foundation
- [x] Repository setup (GitHub, Wiki, Kanban Board)
- [x] Project setup (Next.js App Router, Prisma, SQLite)
- [x] Base UI configuration (Tailwind CSS, shadcn/ui, Lucide Icons)

### Milestone 2 — Core Feature
- [x] Pembuatan API untuk validasi Magic Link & Update Counter
- [x] Pembuatan UI Halaman Utama (Search, Filter, Detail Kos)
- [x] Integrasi UI Halaman Booking & Dummy Payment (QRIS)

### Milestone 3 — Prototype
- [x] Core user flow bekerja penuh (dari klik link WA hingga update UI Web)
- [x] Memasukkan *Seed Data* (Data kos & ibu kos buatan untuk testing)
- [x] Implementasi *Basic error states* (Link expired, Kos penuh, Gagal bayar)

### Milestone 4 — User Testing
- [x] Merekrut partisipan (3 Mahasiswa dan 2 Ibu Kos / proxy lansia)
- [x] Menjalankan skenario *testing* (Skenario update kamar & Skenario booking)
- [x] Mendokumentasikan temuan (*feedback* dan hambatan UX)

### Milestone 5 — Iteration
- [x] Memperbaiki *bug* kritis (*Crash* atau *Error 500*)
- [x] Memperbarui UI/UX prototipe (misal: memperbesar tombol jika lansia masih kesulitan)
- [x] Re-test singkat sebelum status produk dikunci (MVP Ready)

## Release Criteria
- [x] *Core user flow* (alur utama pengguna) dapat berjalan dari awal hingga akhir tanpa hambatan.
- [x] Tidak ada *critical bugs* yang mengganggu manipulasi data.
- [x] Prototipe dapat dites (*testable*) dan responsif di *browser* HP secara langsung.
- [x] Seluruh dokumentasi produk sudah *up-to-date*.

## Version
Current: `0.1.0`

## Changelog
### 0.1.0
- Initial MVP Prototype Release (Fokus penuh pada pembuktian validasi fitur Magic Link & sistem Escrow Booking).