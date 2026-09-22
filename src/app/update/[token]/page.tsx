"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Loader2,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  Building2,
  ShieldCheck,
  BedDouble,
  Sparkles,
  Layers,
} from "lucide-react";

interface RoomType {
  id: string;
  name: string;
  available_rooms: number;
  price_per_month?: number;
}

interface Property {
  id: string;
  name: string;
  available_rooms: number;
  room_types?: RoomType[];
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
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
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
          const initialCounts: Record<string, number> = {};
          const firstProp = data.properties[0];
          if (firstProp.room_types && firstProp.room_types.length > 0) {
            firstProp.room_types.forEach((rt) => {
              initialCounts[rt.id] = rt.available_rooms ?? 0;
            });
          } else {
            initialCounts["default"] = firstProp.available_rooms ?? 0;
          }
          setRoomCounts(initialCounts);
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

  const handleDecrement = (roomTypeId: string) => {
    setRoomCounts((prev) => {
      const current = prev[roomTypeId] ?? 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        [roomTypeId]: Math.max(0, current - 1),
      };
    });
  };

  const handleIncrement = (roomTypeId: string) => {
    setRoomCounts((prev) => {
      const current = prev[roomTypeId] ?? 0;
      return {
        ...prev,
        [roomTypeId]: current + 1,
      };
    });
  };

  const handleSelectProperty = (index: number) => {
    setSelectedPropertyIndex(index);
    const targetProp = propertyData?.properties[index];
    if (targetProp) {
      const counts: Record<string, number> = {};
      if (targetProp.room_types && targetProp.room_types.length > 0) {
        targetProp.room_types.forEach((rt) => {
          counts[rt.id] = rt.available_rooms ?? 0;
        });
      } else {
        counts["default"] = targetProp.available_rooms ?? 0;
      }
      setRoomCounts(counts);
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

      const hasRoomTypes =
        targetProperty.room_types && targetProperty.room_types.length > 0;

      const payload = hasRoomTypes
        ? {
            token,
            propertyId: targetProperty.id,
            updates: targetProperty.room_types!.map((rt) => ({
              roomTypeId: rt.id,
              availableRooms: roomCounts[rt.id] ?? 0,
            })),
          }
        : {
            token,
            propertyId: targetProperty.id,
            availableRooms:
              roomCounts["default"] ?? targetProperty.available_rooms ?? 0,
          };

      const response = await fetch("/api/magic-link/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  const formatRupiah = (val?: number) => {
    if (!val) return null;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-soft mb-5">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Menghubungkan Tautan Kos
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Memuat data ketersediaan kamar secara aman...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error || !propertyData) {
    const errorMessage = error || "Data properti tidak ditemukan.";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center max-w-sm w-full shadow-soft-lg flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <XCircle className="w-7 h-7 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Akses Tidak Valid
          </h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            {errorMessage}
          </p>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Tautan ini mungkin sudah pernah digunakan atau telah kedaluwarsa. Silakan hubungi admin untuk tautan terbaru.
          </p>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center max-w-sm w-full shadow-soft-lg flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-1">
            Berhasil Diperbarui
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Data Tersimpan!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Jumlah kamar kosong kos Anda telah diperbarui ke sistem KosPasti. Anda dapat menutup halaman ini.
          </p>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentProperty =
    propertyData.properties[selectedPropertyIndex] || propertyData.properties[0];

  const roomTypes =
    currentProperty?.room_types && currentProperty.room_types.length > 0
      ? currentProperty.room_types
      : null;

  const totalAvailable = roomTypes
    ? roomTypes.reduce((sum, rt) => sum + (roomCounts[rt.id] ?? 0), 0)
    : (roomCounts["default"] ?? currentProperty?.available_rooms ?? 0);

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 sm:py-10 px-4">
      <div className="max-w-md sm:max-w-xl mx-auto flex flex-col gap-6">
        {/* Top Header Card (SaaS Card Layout as requested) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-soft-sm relative overflow-hidden">
          <div className="flex flex-col gap-3.5">
            {/* Top Row: Owner info & total room status badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">
                Pemilik: <strong className="text-slate-900 font-bold">{propertyData.ownerName}</strong>
              </span>

              <div
                className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  totalAvailable > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border-rose-200/80"
                }`}
              >
                {totalAvailable > 0 ? `Total ${totalAvailable} Kamar Siap` : "Kos Penuh"}
              </div>
            </div>

            {/* Property Selector Tabs if Owner has multiple properties */}
            {propertyData.properties.length > 1 && (
              <div className="pt-1">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Pilih Properti Kos:
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {propertyData.properties.map((prop, idx) => (
                    <button
                      key={prop.id}
                      onClick={() => handleSelectProperty(idx)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedPropertyIndex === idx
                          ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {prop.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Property Heading */}
            <div className="pt-2 border-t border-slate-100">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 shrink-0" />
                <span>{currentProperty ? currentProperty.name : "Kos Anda"}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Atur jumlah kamar kosong yang siap disewakan hari ini. Gunakan tombol minus/plus di bawah untuk menyesuaikan.
              </p>
            </div>
          </div>
        </div>

        {/* Room Types Large Counter Cards */}
        <div className="flex flex-col gap-5">
          {roomTypes ? (
            roomTypes.map((rt) => {
              const count = roomCounts[rt.id] ?? 0;
              const formattedPrice = formatRupiah(rt.price_per_month);

              return (
                <div
                  key={rt.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft-sm flex flex-col items-center"
                >
                  {/* Card Title & Badges */}
                  <div className="w-full flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <BedDouble className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words">
                          {rt.name}
                        </h3>
                        {formattedPrice && (
                          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                            {formattedPrice} <span className="text-slate-400 font-normal">/ bulan</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border shrink-0 ${
                        count === 0
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {count === 0 ? "Penuh (0)" : `Tersedia ${count}`}
                    </span>
                  </div>

                  {/* Large Counter Controls (Big, Friendly, Tactile) */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8 w-full my-3">
                    {/* Minus Button */}
                    <button
                      type="button"
                      onClick={() => handleDecrement(rt.id)}
                      disabled={count <= 0}
                      aria-label={`Kurangi Kamar ${rt.name}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-150 flex items-center justify-center shadow-soft-sm cursor-pointer select-none"
                    >
                      <Minus className="w-7 h-7 stroke-[2.5]" />
                    </button>

                    {/* Room Count Display */}
                    <div className="flex flex-col items-center min-w-[4.5ch]">
                      <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight tabular-nums select-none">
                        {count}
                      </span>
                      <span className="text-xs uppercase font-bold text-slate-400 mt-1 tracking-wider">
                        Kamar
                      </span>
                    </div>

                    {/* Plus Button */}
                    <button
                      type="button"
                      onClick={() => handleIncrement(rt.id)}
                      aria-label={`Tambah Kamar ${rt.name}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-soft-sm cursor-pointer select-none"
                    >
                      <Plus className="w-7 h-7 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Fallback single counter */
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft-sm flex flex-col items-center">
              <div className="w-full flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <BedDouble className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
                      Kamar Standar
                    </h3>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold border shrink-0 ${
                    totalAvailable === 0
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {totalAvailable === 0 ? "Penuh (0)" : `Tersedia ${totalAvailable}`}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 sm:gap-8 w-full my-3">
                <button
                  type="button"
                  onClick={() => handleDecrement("default")}
                  disabled={totalAvailable <= 0}
                  aria-label="Kurangi Kamar"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-150 flex items-center justify-center shadow-soft-sm cursor-pointer select-none"
                >
                  <Minus className="w-7 h-7 stroke-[2.5]" />
                </button>

                <div className="flex flex-col items-center min-w-[4.5ch]">
                  <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight tabular-nums select-none">
                    {totalAvailable}
                  </span>
                  <span className="text-xs uppercase font-bold text-slate-400 mt-1 tracking-wider">
                    Kamar
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleIncrement("default")}
                  aria-label="Tambah Kamar"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-soft-sm cursor-pointer select-none"
                >
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Total Summary Badge */}
        <div className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-900 text-sm font-semibold">
          <span>Total Sisa Kamar Kosong:</span>
          <span className="font-extrabold text-base">{totalAvailable} Kamar</span>
        </div>

        {/* Helper Note */}
        <p className="text-xs text-slate-400 text-center -mt-2">
          Tekan tombol <span className="font-bold text-slate-600">[+]</span> atau{" "}
          <span className="font-bold text-slate-600">[-]</span> untuk memperbarui jumlah kamar kosong siap sewa.
        </p>

        {/* Submit Button */}
        <div className="w-full pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-soft hover:shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Data</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
