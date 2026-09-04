"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Check,
  Home,
  User,
} from "lucide-react";

interface PropertyDetail {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  description?: string | null;
  updated_at?: string;
  owner?: {
    name: string;
    whatsapp_number: string;
  };
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [minDate, setMinDate] = useState("");

  const handleBookingSubmit = async () => {
    // 1. Validasi Sederhana
    if (!studentName || !waNumber || !moveInDate) {
      alert("Mohon lengkapi semua data diri Anda.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Panggil API Booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id, // id diambil dari parameter URL
          studentName,
          waNumber,
          moveInDate,
        }),
      });

      const responseData = await response.json();

      // 3. Cek Status Respons
      if (!response.ok) {
        throw new Error(responseData.error || "Gagal melakukan pemesanan.");
      }

      // 4. Redirect ke Halaman Checkout QRIS
      router.push(`/checkout/${responseData.data.bookingId}`);
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Gagal melakukan pemesanan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Mendapatkan format YYYY-MM-DD hari ini di sisi client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchPropertyDetail() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${id}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data) {
            setProperty(json.data);
          } else {
            setError(json.error || "Kos tidak ditemukan");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal memuat detail kos:", err);
          setError("Terjadi kesalahan saat memuat data kos");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPropertyDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Memuat detail kamar...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Kos tidak ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-xs">
            {error || "Data properti yang Anda cari tidak tersedia atau ID tidak valid."}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const formattedPrice = `Rp ${property.price_per_month.toLocaleString("id-ID")}`;
  const isFull = property.available_rooms === 0;
  const isAvailable = property.available_rooms > 0;
  const normalizedGender = property.gender_type?.toUpperCase() || "";
  const genderBadgeStyle = (() => {
    switch (normalizedGender) {
      case "PUTRA":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PUTRI":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "CAMPUR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  })();

  const facilitiesList = property.facilities
    ? property.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 -m-4 flex flex-col">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-bold text-slate-800 truncate">
          Detail Kos
        </h1>
      </div>

      {/* Foto Utama */}
      <div className="w-full h-64 relative bg-slate-200 overflow-hidden flex items-center justify-center">
        {property.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={property.image_url}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <Home className="w-12 h-12 stroke-[1.5]" />
            <span className="text-xs">Tidak ada foto</span>
          </div>
        )}
      </div>

      {/* Body Section */}
      <div className="flex flex-col gap-3 p-4">
        {/* Informasi Dasar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${genderBadgeStyle}`}
            >
              {property.gender_type}
            </span>
            {isAvailable ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                Tersedia {property.available_rooms} Kamar
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                Kamar Penuh
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {property.name}
            </h2>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formattedPrice}{" "}
              <span className="text-xs font-normal text-slate-500">
                / bulan
              </span>
            </p>
          </div>
        </div>

        {/* Fasilitas & Deskripsi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900">Fasilitas Kos</h3>
          {facilitiesList.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {facilitiesList.map((facility, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{facility}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {property.facilities || "Tidak ada rincian fasilitas"}
            </p>
          )}

          {property.description && (
            <div className="mt-2 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                Deskripsi
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}
        </div>

        {/* Info Pemilik */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Dikelola oleh</p>
              <p className="text-sm font-semibold text-slate-800">
                {property.owner?.name || "Pemilik Kos"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex justify-between items-center z-50">
        <div className="max-w-md mx-auto w-full flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">
              Harga per bulan
            </p>
            <p className="text-base font-bold text-slate-900">
              {formattedPrice}{" "}
              <span className="text-xs font-normal text-slate-500">/ bln</span>
            </p>
            {isFull && (
              <p className="text-[10px] text-rose-500 font-medium">
                Mohon maaf, semua kamar telah terisi.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isFull}
            onClick={() => setIsModalOpen(true)}
            className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${
              isFull
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {isFull ? "Kamar Penuh" : "Amankan Kamar"}
          </button>
        </div>
      </div>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Lengkapi Data Diri
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data ini akan dikirimkan ke Pemilik Kos
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Nomor WhatsApp (Contoh: 0812...)"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rencana Tanggal Masuk
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleBookingSubmit}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Memproses..." : "Lanjut Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
