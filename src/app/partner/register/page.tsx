"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  DollarSign,
  BedDouble,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  HelpCircle,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import LocationPicker from "@/components/map/LocationPicker";

export default function PartnerRegisterPage() {
  const router = useRouter();

  // Multi-step State (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Akun
    name: "",
    email: "",
    password: "",
    whatsapp_number: "",
    // Step 2: Properti
    propertyName: "",
    address: "",
    latitude: "",
    longitude: "",
    gender_type: "CAMPUR",
    is_pet_friendly: false,
    is_24_hours: true,
    // Step 3: Kamar & Fasilitas
    price_per_month: "",
    available_rooms: "5",
    facilities: "WiFi, Kasur, Lemari, Kamar Mandi Dalam, AC",
    rules: "Menjaga kebersihan dan ketertiban bersama.",
    image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCoordHelp, setShowCoordHelp] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    "WiFi",
    "Kasur",
    "Lemari",
    "Kamar Mandi Dalam",
    "AC",
  ]);
  const [customFacility, setCustomFacility] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [facilitiesList, setFacilitiesList] = useState<string[]>([
    "WiFi",
    "AC",
    "Kamar Mandi Dalam",
    "Kasur",
    "Lemari",
    "Meja & Kursi",
    "Dapur Bersama",
    "Parkir Motor",
    "Parkir Mobil",
    "Water Heater",
    "CCTV 24 Jam",
    "Mesin Cuci",
  ]);

  const handleFacilityToggle = (item: string) => {
    let updated: string[];
    if (selectedFacilities.includes(item)) {
      updated = selectedFacilities.filter((f) => f !== item);
    } else {
      updated = [...selectedFacilities, item];
    }
    setSelectedFacilities(updated);
    setFormData((prev) => ({ ...prev, facilities: updated.join(", ") }));
  };

  const handleAddCustomFacility = () => {
    const trimmed = customFacility.trim();
    if (!trimmed) return;

    if (!facilitiesList.includes(trimmed)) {
      setFacilitiesList((prev) => [...prev, trimmed]);
    }
    if (!selectedFacilities.includes(trimmed)) {
      const updated = [...selectedFacilities, trimmed];
      setSelectedFacilities(updated);
      setFormData((prev) => ({ ...prev, facilities: updated.join(", ") }));
    }
    setCustomFacility("");
  };

  const validateStep1 = () => {
    setErrorMsg(null);
    if (!formData.name.trim()) {
      setErrorMsg("Nama lengkap pemilik kos wajib diisi.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Format alamat email tidak valid.");
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setErrorMsg(
        "Password harus minimal 8 karakter dan mengandung setidaknya 1 huruf besar, 1 huruf kecil, dan 1 angka."
      );
      return false;
    }
    const waOnlyDigits = formData.whatsapp_number.replace(/\D/g, "");
    if (waOnlyDigits.length < 9 || waOnlyDigits.length > 13) {
      setErrorMsg("Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!formData.propertyName.trim()) {
      setErrorMsg("Nama properti kos wajib diisi.");
      return false;
    }
    if (!formData.address.trim()) {
      setErrorMsg("Alamat lengkap lokasi kos wajib diisi.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setErrorMsg(null);
    const price = Number(formData.price_per_month);
    if (!formData.price_per_month || isNaN(price) || price <= 0) {
      setErrorMsg("Harga sewa per bulan harus diisi dengan angka valid.");
      return false;
    }
    const rooms = Number(formData.available_rooms);
    if (isNaN(rooms) || rooms < 0) {
      setErrorMsg("Jumlah kamar harus berupa angka yang valid.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setErrorMsg(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          whatsapp_number: formData.whatsapp_number.replace(/\D/g, ""),
          price_per_month: Number(formData.price_per_month),
          available_rooms: Number(formData.available_rooms),
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal melakukan pendaftaran mitra.");
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/partner/login?registered=1");
      }, 2000);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan atau server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="max-w-3xl mx-auto w-full">
        {/* Back to Home Action */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors px-3.5 py-2 rounded-full bg-white border border-slate-200 shadow-2xs hover:border-emerald-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/logo.jpg"
              alt="KosPasti Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover shadow-soft group-hover:rotate-3 transition-transform"
            />
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              KosPasti <span className="text-emerald-600 font-bold">Mitra</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Sebagai Mitra Pemilik Kos
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola properti kos Anda secara mandiri dengan teknologi modern &amp; praktis.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-soft border border-slate-200/80 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {[
              { num: 1, label: "Akun Mitra", icon: User },
              { num: 2, label: "Properti", icon: Building2 },
              { num: 3, label: "Fasilitas", icon: BedDouble },
              { num: 4, label: "Konfirmasi", icon: CheckCircle2 },
            ].map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;

              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-105"
                        : isPassed
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold mt-2 ${
                      isActive ? "text-emerald-700" : isPassed ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-start gap-3">
              <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Pendaftaran Berhasil!</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Akun Mitra dan properti Anda telah aktif. Mengalihkan Anda ke halaman login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: AKUN MITRA */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Informasi Akun Mitra</h2>
                  <p className="text-xs text-slate-500">
                    Kredensial ini digunakan untuk masuk ke Dashboard Mitra Anda.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Pemilik Kos *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alamat Email (Login) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp Aktif *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={13}
                      placeholder="08123456789 (maks 13 digit)"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_number: e.target.value.replace(/\D/g, "").slice(0, 13),
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nomor WA digunakan untuk menerima notifikasi pesanan dan konfirmasi sewa.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Akun *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimal 8 karakter (huruf besar, kecil, & angka)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DATA PROPERTI PERDANA */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Data Properti Kos Perdana</h2>
                  <p className="text-xs text-slate-500">
                    Masukkan detail kos pertama yang ingin Anda daftarkan di KosPasti.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Properti Kos *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kos Melati Asri Subang"
                      value={formData.propertyName}
                      onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori / Tipe Penghuni *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["PUTRA", "PUTRI", "CAMPUR"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender_type: type })}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                          formData.gender_type === type
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {type === "PUTRA" ? "Khusus Putra" : type === "PUTRI" ? "Khusus Putri" : "Campur"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alamat Lengkap Kos *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      required
                      rows={2}
                      placeholder="Jl. RA Kartini No. 45, RT 02/RW 03, Kel. Soklat, Kec. Subang, Jawa Barat"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Titik Koordinat Peta Interaktif */}
                <div>
                  <LocationPicker
                    latitude={formData.latitude ? Number(formData.latitude) : null}
                    longitude={formData.longitude ? Number(formData.longitude) : null}
                    onChange={(lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        latitude: String(lat),
                        longitude: String(lng),
                      }));
                    }}
                    onAddressChange={(address) => {
                      setFormData((prev) => ({
                        ...prev,
                        address,
                      }));
                    }}
                    label="Titik Koordinat Lokasi Kos (Peta)"
                    helperText="Geser pin merah atau klik peta untuk menentukan lokasi akurat. Koordinat dan alamat lengkap akan terisi secara otomatis."
                  />
                  {/* Input hidden untuk menjamin kompatibilitas form submission */}
                  <input type="hidden" name="latitude" value={formData.latitude} />
                  <input type="hidden" name="longitude" value={formData.longitude} />
                </div>

                {/* Aturan & Kebijakan Tambahan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_24_hours}
                      onChange={(e) => setFormData({ ...formData, is_24_hours: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Akses 24 Jam</span>
                      <span className="text-slate-500">Bebas jam malam untuk penghuni</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_pet_friendly}
                      onChange={(e) => setFormData({ ...formData, is_pet_friendly: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Boleh Hewan (Pet Friendly)</span>
                      <span className="text-slate-500">Izinkan kucing / peliharaan kecil</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: KAMAR & FASILITAS */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kamar, Harga &amp; Fasilitas</h2>
                  <p className="text-xs text-slate-500">
                    Tentukan tarif bulanan dan fasilitas yang tersedia untuk calon penyewa.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Harga Sewa per Bulan (Rp) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="10000"
                        placeholder="Contoh: 850000"
                        value={formData.price_per_month}
                        onChange={(e) => setFormData({ ...formData, price_per_month: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Jumlah Kamar Tersedia *
                    </label>
                    <div className="relative">
                      <BedDouble className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Contoh: 5"
                        value={formData.available_rooms}
                        onChange={(e) => setFormData({ ...formData, available_rooms: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Fasilitas Checkbox Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Fasilitas Tersedia
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {facilitiesList.map((item) => {
                      const isChecked = selectedFacilities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleFacilityToggle(item)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                            isChecked
                              ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                              : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{item}</span>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Tambah fasilitas lain..."
                      value={customFacility}
                      onChange={(e) => setCustomFacility(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomFacility();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFacility}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* URL Foto Properti */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    URL Foto Utama Properti
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bisa diedit dan ditambahkan galeri foto lebih lengkap di Dashboard setelah akun dibuat.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: SELESAI / REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Ringkasan Pendaftaran Mitra</h2>
                  <p className="text-xs text-slate-500">
                    Mohon periksa kembali data akun dan properti Anda sebelum mengirimkan form.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Akun Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        1. Akun Mitra
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        Ubah
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Nama Pemilik:</span>
                        <span className="font-bold text-slate-800">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Email Login:</span>
                        <span className="font-bold text-slate-800">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">WhatsApp:</span>
                        <span className="font-bold text-slate-800">{formData.whatsapp_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Password:</span>
                        <span className="font-bold text-slate-800">••••••••</span>
                      </div>
                    </div>
                  </div>

                  {/* Properti Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        2. Properti &amp; Kamar
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        Ubah
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Nama Kos:</span>
                        <span className="font-bold text-slate-800">{formData.propertyName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Kategori:</span>
                        <span className="font-bold text-slate-800">
                          {formData.gender_type === "PUTRA"
                            ? "Khusus Putra"
                            : formData.gender_type === "PUTRI"
                            ? "Khusus Putri"
                            : "Campur"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Alamat:</span>
                        <span className="font-bold text-slate-800">{formData.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Harga Sewa:</span>
                        <span className="font-bold text-emerald-700">
                          Rp {Number(formData.price_per_month).toLocaleString("id-ID")} / bulan
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Kamar Tersedia:</span>
                        <span className="font-bold text-slate-800">{formData.available_rooms} Kamar</span>
                      </div>
                    </div>
                  </div>

                  {/* Fasilitas Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        3. Fasilitas
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        Ubah
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {formData.facilities || "Fasilitas standar"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Dengan menekan tombol submit, Anda menyetujui syarat &amp; ketentuan kemitraan resmi KosPasti.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading || isSuccess}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              ) : (
                <Link
                  href="/partner/login"
                  className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-600"
                >
                  Sudah punya akun Mitra? Masuk
                </Link>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <span>Lanjutkan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Pendaftaran...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Selesaikan &amp; Buat Akun Mitra</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Butuh bantuan pendaftaran?{" "}
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20KosPasti,%20saya%20butuh%20bantuan%20pendaftaran%20mitra."
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 font-bold hover:underline"
          >
            Hubungi Admin WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
