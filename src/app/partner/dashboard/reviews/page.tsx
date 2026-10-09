"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Star,
  Building2,
  BedDouble,
  Search,
  RotateCcw,
  MessageSquareQuote,
  Loader2,
  AlertCircle,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { ReviewCard, ReviewCardData } from "@/components/features/partner/ReviewCard";

interface RoomTypeOption {
  id: string;
  name: string;
  price_per_month?: number;
}

interface PropertyOption {
  id: string;
  name: string;
  image_url?: string | null;
  room_types: RoomTypeOption[];
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  positivePercentage: number;
  distribution: Record<number, number>;
}

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    positivePercentage: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("ALL");
  const [selectedRating, setSelectedRating] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Room type options available based on selected property
  const availableRoomTypes = useMemo(() => {
    if (selectedPropertyId === "ALL") {
      return [];
    }
    const prop = properties.find((p) => p.id === selectedPropertyId);
    return prop?.room_types || [];
  }, [properties, selectedPropertyId]);

  // Handle property change (resets room type if property changes)
  const handlePropertyChange = (newPropertyId: string) => {
    setSelectedPropertyId(newPropertyId);
    setSelectedRoomTypeId("ALL");
  };

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (selectedPropertyId !== "ALL") {
        params.set("property_id", selectedPropertyId);
      }
      if (selectedRoomTypeId !== "ALL") {
        params.set("room_type_id", selectedRoomTypeId);
      }
      if (selectedRating !== "ALL") {
        params.set("rating", selectedRating.toString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/partner/reviews${queryString}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memuat ulasan mitra.");
        return;
      }

      setReviews(data.reviews || []);
      if (data.properties) {
        setProperties(data.properties);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat memuat ulasan.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPropertyId, selectedRoomTypeId, selectedRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Client-side text search filtering
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase().trim();

    return reviews.filter((r) => {
      const studentName = r.user?.name || r.booking?.student_name || "";
      const comment = r.comment || "";
      const reply = r.reply || "";
      const propertyName = r.property?.name || "";
      const roomTypeName = r.booking?.room_type?.name || "";

      return (
        studentName.toLowerCase().includes(q) ||
        comment.toLowerCase().includes(q) ||
        reply.toLowerCase().includes(q) ||
        propertyName.toLowerCase().includes(q) ||
        roomTypeName.toLowerCase().includes(q)
      );
    });
  }, [reviews, searchQuery]);

  const handleReplyUpdated = useCallback(
    (reviewId: string, reply: string | null, repliedAt: string | null) => {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, reply, replied_at: repliedAt } : r
        )
      );
    },
    []
  );

  const resetFilters = () => {
    setSelectedPropertyId("ALL");
    setSelectedRoomTypeId("ALL");
    setSelectedRating("ALL");
    setSearchQuery("");
  };

  const isFilteringActive =
    selectedPropertyId !== "ALL" ||
    selectedRoomTypeId !== "ALL" ||
    selectedRating !== "ALL" ||
    searchQuery.trim().length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Ulasan &amp; Evaluasi Penyewa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau ulasan dari penyewa terverifikasi di seluruh kos dan tipe kamar Anda untuk menjaga kepuasan penghuni.
          </p>
        </div>

        {isFilteringActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reset Semua Filter</span>
          </button>
        )}
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Rata-rata Rating
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.averageRating > 0 ? stats.averageRating : "-"}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-100 dark:fill-slate-800 text-slate-200 dark:text-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/70 dark:border-amber-800/60">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Ulasan Masuk
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.totalReviews}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Ulasan</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Dari seluruh kos aktif Anda
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/70 dark:border-emerald-800/60">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Positive Review Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kepuasan Positif
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.positivePercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Ulasan bintang 4 &amp; 5
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/70 dark:border-blue-800/60">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Star Breakdown Mini Bars */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-center gap-1.5">
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = stats.distribution[ratingVal] || 0;
            const percentage =
              stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <div key={ratingVal} className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 w-4">{ratingVal}★</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 w-6 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Property Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Properti</span>
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Properti ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Tipe Kamar</span>
            </label>
            <select
              value={selectedRoomTypeId}
              onChange={(e) => setSelectedRoomTypeId(e.target.value)}
              disabled={selectedPropertyId === "ALL"}
              className={`w-full border rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                selectedPropertyId === "ALL"
                  ? "bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
              }`}
            >
              <option value="ALL">
                {selectedPropertyId === "ALL"
                  ? "Pilih properti terlebih dahulu"
                  : `Semua Tipe Kamar (${availableRoomTypes.length})`}
              </option>
              {availableRoomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cari Ulasan</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama penyewa atau isi ulasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Rating Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">
            Bintang:
          </span>
          {(["ALL", 5, 4, 3, 2, 1] as const).map((starOption) => {
            const isSelected = selectedRating === starOption;
            return (
              <button
                key={starOption}
                type="button"
                onClick={() => setSelectedRating(starOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {starOption === "ALL" ? (
                  <span>Semua Rating</span>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                    <span>{starOption} Bintang</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchReviews}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Memuat data ulasan...</p>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="w-20 h-3 bg-slate-100 dark:bg-slate-700 rounded-md" />
                </div>
              </div>
              <div className="w-48 h-5 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800/60">
            <MessageSquareQuote className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {isFilteringActive
              ? "Tidak Ada Ulasan yang Sesuai Filter"
              : "Belum Ada Ulasan Masuk"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-sm">
            {isFilteringActive
              ? "Cobalah mengubah atau mereset filter untuk melihat ulasan lain."
              : "Ulasan dari penyewa yang telah diverifikasi (SUCCESS/PAID/APPROVED/ACCEPTED) akan otomatis muncul di sini."}
          </p>

          {isFilteringActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-soft hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        /* Reviews List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan {filteredReviews.length} dari {reviews.length} ulasan
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReplyUpdated={handleReplyUpdated}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
