# KosPasti 🏠

Platform Web Pencarian Kos (PWA) yang memberikan kepastian ketersediaan kamar secara *real-time* dan *effortless* bagi mahasiswa perantau dan pemilik kos.

## 🎯 Core Value
Menyelesaikan masalah ketidakpastian data kamar kos dengan menghubungkan pencari kos ke status *real-time* yang diperbarui oleh pemilik kos menggunakan *Magic Link* via WhatsApp.

## 🚀 MVP Features
1. **Real-time Availability Status:** Label ketersediaan kamar yang 100% valid.
2. **Magic Link via WA:** Pembaruan status 1-klik untuk pemilik kos (tanpa *login/install*).
3. **Instant Booking & E-Wallet:** Mengamankan kamar dari jarak jauh dengan aman.

## 📂 Folder Structure (Draft)
```text
kospasti/
├── public/             # Static assets (images, icons)
├── src/
│   ├── components/     # Reusable UI components (buttons, cards)
│   ├── pages/          # Application routes (Search, Booking, Owner Dashboard)
│   ├── styles/         # Global styling and CSS modules
│   └── utils/          # Helper functions (API formatters, etc.)
├── .gitignore
└── README.md

🌿 Branching Strategy
- main: Production-ready code (Stabil).
- staging: Pre-production testing.
- feature/[nama-fitur]: Untuk pengembangan fitur baru (contoh: feature/magic-link).
- bugfix/[nama-bug]: Untuk perbaikan masalah (contoh: bugfix/payment-error).
