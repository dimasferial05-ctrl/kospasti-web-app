"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2, XCircle, CheckCircle, ArrowLeft, Home } from "lucide-react";

interface Property {
  id: string;
  name: string;
  available_rooms: number;
}

interface PropertyData {
  ownerName: string;
  properties: Property[];
}

export default function UpdateRoomPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number>(0);
  const [roomCount, setRoomCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;

    async function fetchTokenData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/magic-link/validate?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || "Tautan tidak valid atau sudah kedaluwarsa.");
          return;
        }

        const data: PropertyData = result.data;
        setPropertyData(data);

        if (data.properties && data.properties.length > 0) {
          setRoomCount(data.properties[0].available_rooms ?? 0);
        }
      } catch (err) {
        console.error("Gagal memuat data token:", err);
        setError("Gagal memuat data. Periksa koneksi internet Anda.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokenData();
  }, [token]);

  const handleDecrement = () => {
    if (roomCount > 0) {
      setRoomCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleIncrement = () => {
    setRoomCount((prev) => prev + 1);
  };

  const handleSelectProperty = (index: number) => {
    setSelectedPropertyIndex(index);
    if (propertyData?.properties[index]) {
      setRoomCount(propertyData.properties[index].available_rooms ?? 0);
    }
  };

  const handleSubmit = async () => {
    const targetProperty =
      propertyData?.properties[selectedPropertyIndex] ||
      propertyData?.properties[0];

    if (!token || !targetProperty) {
      alert("Data properti atau token tidak valid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/magic-link/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          propertyId: targetProperty.id,
          availableRooms: roomCount,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
      } else {
        alert(result.error || "Gagal menyimpan data.");
      }
    } catch (err) {
      console.error("Gagal mengirim data pembaruan:", err);
      alert("Gagal menyimpan data. Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600 mb-4" />
        <p className="text-base font-medium text-slate-700">Memuat data...</p>
        <p className="text-xs text-slate-400 mt-1">Menghubungkan tautan Anda...</p>
      </div>
    );
  }

  // 2. Error State
  if (error || !propertyData) {
    const errorMessage = error || "Data properti tidak ditemukan.";

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh] w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm w-full shadow-xs flex flex-col items-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4 stroke-[1.75]" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Akses Ditolak</h2>
          <p className="text-sm font-medium text-red-700 mb-3 leading-snug">
            {errorMessage}
          </p>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Tautan ini mungkin sudah kedaluwarsa atau pernah digunakan. Silakan hubungi admin untuk mendapatkan tautan baru.
          </p>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-red-200 text-red-800 hover:bg-red-100/80 hover:text-red-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh] w-full">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-sm w-full shadow-xs flex flex-col items-center">
          <CheckCircle className="w-20 h-20 text-green-500 mb-4 stroke-[1.75]" />
          <h2 className="text-xl font-bold text-green-900 mb-2">
            Pembaruan Berhasil!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Data sisa kamar kos Anda telah diperbarui ke sistem. Silakan tutup halaman ini dan kembali ke WhatsApp.
          </p>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-green-200 text-green-800 hover:bg-green-100/80 hover:text-green-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentProperty = propertyData.properties[selectedPropertyIndex] || propertyData.properties[0];

  // 3. Main Counter / Success State
  return (
    <div className="flex-1 flex flex-col justify-between py-6 px-4 max-w-sm mx-auto w-full">
      <div className="flex flex-col items-center">
        {/* Owner Greeting & Header */}
        <div className="w-full text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
            <span>👋</span> Halo, {propertyData.ownerName}
          </span>

          {/* Multiple Properties Selector if available */}
          {propertyData.properties.length > 1 && (
            <div className="flex gap-2 justify-center mb-4 overflow-x-auto py-1">
              {propertyData.properties.map((prop, idx) => (
                <button
                  key={prop.id}
                  onClick={() => handleSelectProperty(idx)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPropertyIndex === idx
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {prop.name}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Home className="w-6 h-6 text-slate-700 shrink-0" />
            <span>{currentProperty ? currentProperty.name : "Kos Anda"}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">Atur Sisa Kamar Kosong Anda:</p>
        </div>

        {/* Counter Component */}
        <div className="w-full max-w-xs bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 my-4 shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-center gap-6 w-full my-4">
            {/* Minus Button */}
            <button
              type="button"
              onClick={handleDecrement}
              disabled={roomCount <= 0}
              aria-label="Kurangi Kamar"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all flex items-center justify-center shadow-xs cursor-pointer select-none"
            >
              <Minus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Room Count Display */}
            <div className="flex flex-col items-center min-w-[4ch]">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight select-none tabular-nums">
                {roomCount}
              </span>
              <span className="text-xs uppercase font-semibold text-slate-400 mt-1 tracking-wider">
                Kamar
              </span>
            </div>

            {/* Plus Button */}
            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Tambah Kamar"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer select-none"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Availability Status Badge */}
          <div className="mt-4">
            {roomCount === 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                Penuh (0 Kamar Tersedia)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Tersedia {roomCount} Kamar
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center max-w-xs mt-2">
          Tekan tombol <span className="font-semibold text-slate-600">[+]</span> atau{" "}
          <span className="font-semibold text-slate-600">[-]</span> untuk memperbarui jumlah kamar kosong yang siap disewakan.
        </p>
      </div>

      {/* Submit Button */}
      <div className="w-full pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            "Simpan Data"
          )}
        </button>
      </div>
    </div>
  );
}
