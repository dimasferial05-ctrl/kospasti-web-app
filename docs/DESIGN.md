# KosPasti Design System & UI/UX Guidelines

Dokumen ini adalah **"Kitab Suci UI/UX"** untuk pengembangan KosPasti. Seluruh pengembangan UI dan komponen di masa depan **wajib** mematuhi pedoman ini untuk menghilangkan kesan antarmuka yang kaku ("AI Slop") dan memastikan produk terasa modern, berkarakter, dan di-desain oleh manusia profesional.

---

## 1. Brand Identity & Core Principles
*Vibe* utama KosPasti adalah: **Modern, Trustworthy (Dapat Dipercaya), Clean, dan Accessible.**
- **White-space is King:** Jangan buat UI yang terlalu padat. Berikan ruang bernapas (*margin/padding* yang longgar) di antara elemen-elemen UI.
- **Human-Centric:** UI harus terasa responsif dan "hidup", bukan sekadar kotak statis.
- **Clarity over Cleverness:** Utamakan kejelasan fungsionalitas daripada desain yang rumit namun membingungkan.

---

## 2. Color Palette (Warna Kustom)
Tinggalkan warna murni bawaan Tailwind (`#000000` atau `#FFFFFF` murni). Gunakan warna yang lebih ramah di mata (*tinted*).

- **Background (Off-White):** Hindari putih murni. Gunakan **`#FAFAFA`** atau `bg-slate-50` sebagai latar belakang utama halaman.
- **Text & Foreground (Tinted Dark):** Hindari hitam pekat. Gunakan **`#0F172A`** (`text-slate-900`) untuk *Heading* utama, dan **`#64748B`** (`text-slate-500`) untuk subteks.
- **Primary (Trust & Growth):** Gunakan spektrum *Emerald* (`#10B981` hingga `#047857`) untuk merepresentasikan rasa aman dan transaksi yang tervalidasi.
  - *Contoh kelas Tailwind:* `bg-emerald-600 text-white`
- **Accent (Urgency & Energy):** Gunakan *Rose* (`#E11D48`) atau *Amber* (`#D97706`) untuk penanda peringatan, sisa kamar sedikit, atau aksi destruktif.

---

## 3. Typography System
Font utama yang disarankan adalah **Plus Jakarta Sans** atau **Inter** untuk tampilan yang *clean* dan geometris.

Aturan ketebalan (*Font Weight*) untuk memberikan kontras:
- **Heading (H1, H2, H3):** Jangan gunakan *Reguler*. Wajib gunakan `font-extrabold` atau `font-black` dipadukan dengan `tracking-tight` (jarak huruf rapat) agar terlihat premium.
  - *Contoh:* `<h1 className="text-3xl font-black text-slate-900 tracking-tight">`
- **Body / Subtext:** Gunakan `font-medium` atau `font-semibold` alih-alih *normal/light* agar teks lebih terbaca (legibel) di layar resolusi tinggi.
  - *Contoh:* `<p className="text-sm font-medium text-slate-500">`

---

## 4. Spacing & Layouting
Gunakan kelipatan 4 (`0.25rem`) dari *spacing scale* Tailwind secara konsisten.
- **Section Padding:** Gunakan `py-12` hingga `py-20` untuk jarak antar *section* besar.
- **Card Padding:** Gunakan `p-5` atau `p-6` (hindari `p-2` atau `p-3` yang membuat konten terlihat sesak).
- **Gap (Flex/Grid):** Gunakan `gap-4` atau `gap-6` untuk jarak antar elemen di dalam grid.

---

## 5. Component Borders & Radius (Bentuk)
Jangan mencampur aduk ukuran radius (`rounded`). Terapkan hierarki ketegasan bentuk berikut:
- **Cards & Modals (Wadah Utama):** `rounded-2xl` atau `rounded-3xl` (Sangat melengkung dan ramah).
- **Inputs, Dropdowns, & Large Buttons:** `rounded-xl` atau `rounded-lg` (Bentuk presisi, tidak terlalu bulat).
- **Badges, Tags, & Status Pills:** `rounded-full` (Kapsul sempurna).

---

## 6. Shadows & Elevation (Kedalaman)
**Aturan Emas:** Jangan buat UI yang datar (*flat*). Desain premium ala Vercel/Stripe selalu mengandalkan bayangan ultra-halus dipadukan dengan *border* super tipis.

- Selalu tambahkan `border border-slate-200/60` (border sangat transparan/tipis) pada setiap Card putih (`bg-white`).
- Gunakan kustom class (yang sudah disiapkan di `globals.css`) alih-alih `shadow-md` bawaan Tailwind:
  - `shadow-soft`: Untuk *Card* standar.
  - `shadow-float`: Untuk elemen yang melayang (seperti *dropdown* atau *floating action button*).
- *Contoh Penggunaan:*
  ```tsx
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6">
    ...
  </div>
  ```

---

## 7. Micro-interactions & States (Kesan Hidup)
Setiap tombol atau *link* interaktif HARUS merespons kursor. Jangan biarkan ada elemen interaktif yang "mati" atau kaku.

- **Transition:** Selalu tambahkan `transition-all duration-200` (atau gunakan `transition-spring` dari globals).
- **Hover State:** Ubah latar belakang, warna border, atau angkat sedikit ke atas.
  - *Contoh:* `hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5`
- **Active State (Saat Ditekan):** Berikan efek taktil dengan memperkecil ukuran sepersekian detik.
  - *Contoh:* `active:scale-95`
- **Focus Ring (Aksesibilitas):** Saat input atau tombol mendapat fokus (terutama via keyboard), wajibkan *ring*.
  - *Contoh Input:* `focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500`

### Contoh Tombol Utama (Primary Button) yang Sempurna:
```tsx
<button className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-soft hover:shadow-float hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2">
  Pesan Sekarang
</button>
```

---

*File ini adalah kontrak komitmen. Setiap kali AI atau Developer men-generate UI baru, aturan-aturan ini wajib ditegakkan tanpa kompromi.*
