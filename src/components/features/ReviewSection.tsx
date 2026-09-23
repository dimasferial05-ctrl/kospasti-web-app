"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Check,
  AlertCircle,
  Loader2,
  Send,
  PenSquare,
} from "lucide-react";

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ReviewSectionProps {
  propertyId: string;
  propertyName: string;
}

function ReviewAvatar({
  src,
  name,
}: {
  src?: string | null;
  name?: string | null;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || "P").trim().charAt(0).toUpperCase();

  if (!src || hasError) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-xs border border-slate-200 select-none">
        <span className="uppercase">{initial || "U"}</span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name || "Foto Profil"}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
    />
  );
}

export function ReviewSection({ propertyId, propertyName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Input State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/properties/${propertyId}/reviews`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data.reviews || []);
        setStats(
          data.data.stats || {
            totalReviews: 0,
            averageRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          }
        );
      }
    } catch (err) {
      console.error("Gagal memuat ulasan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  const checkEligibility = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/reviews/eligibility`);
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEligible(data.data.eligible);
        if (data.data.booking_id) {
          setTargetBookingId(data.data.booking_id);
        }
      }
    } catch (err) {
      console.error("Gagal memeriksa kelayakan ulasan:", err);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setFormError("Silakan pilih rating 1 sampai 5.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: selectedRating,
          comment: commentText,
          booking_id: targetBookingId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal mengirim ulasan. Silakan coba lagi.");
        return;
      }

      setFormSuccess("Ulasan Anda berhasil dikirim dan dipublikasikan.");
      setCommentText("");
      setIsFormOpen(false);
      setIsEligible(false);
      fetchReviews();
      checkEligibility();
    } catch (err) {
      console.error("Error submitting review:", err);
      setFormError("Terjadi kendala jaringan saat mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRatingDisplay = hoverRating !== null ? hoverRating : selectedRating;

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return "Sangat Baik";
      case 4:
        return "Baik";
      case 3:
        return "Cukup";
      case 2:
        return "Kurang";
      case 1:
        return "Sangat Kurang";
      default:
        return "";
    }
  };

  return (
    <section id="reviews-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Ulasan Penghuni
            </h3>
            {stats.totalReviews > 0 && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {stats.totalReviews} ulasan
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ulasan dari penyewa terverifikasi di {propertyName}.
          </p>
        </div>

        {isEligible && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs"
          >
            <PenSquare className="w-4 h-4" />
            {isFormOpen ? "Tutup Form" : "Tulis Ulasan"}
          </button>
        )}
      </div>

      {/* Form Submission */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="my-6 p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Beri Penilaian Pengalaman Tinggal
            </h4>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              Penyewa Terverifikasi
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Rating Stars Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Rating Keseluruhan
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRatingDisplay;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 text-slate-300 hover:scale-110 active:scale-95 transition-all focus:outline-none"
                      aria-label={`Pilih rating ${star}`}
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                          isFilled
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 hover:text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                {activeRatingDisplay} / 5 ({getRatingLabel(activeRatingDisplay)})
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="mb-4">
            <label
              htmlFor="review-comment"
              className="block text-xs font-semibold text-slate-600 mb-2"
            >
              Ceritakan Pengalaman Anda (Opsional)
            </label>
            <textarea
              id="review-comment"
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bagaimana kondisi fasilitas, kebersihan, keamanan, dan respon pemilik kos?"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim Ulasan
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {formSuccess && (
        <div className="my-4 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Rating Breakdown Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center p-5 sm:p-6 bg-slate-50/60 rounded-2xl border border-slate-100">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center pb-4 md:pb-0 md:border-r border-slate-200/80">
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
            <span className="text-lg font-bold text-slate-400">/ 5</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1.5">
            {stats.totalReviews > 0
              ? `Rata-rata dari ${stats.totalReviews} ulasan`
              : "Belum ada ulasan"}
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const percentage =
              stats.totalReviews > 0
                ? Math.round((count / stats.totalReviews) * 100)
                : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs text-slate-600">
                <span className="w-14 flex items-center gap-1 font-medium shrink-0">
                  {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-400 font-mono text-[11px] shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-2" />
          <p className="text-xs font-medium">Memuat ulasan...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/40 rounded-2xl border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Belum Ada Ulasan</p>
          <p className="text-xs text-slate-400 mt-1">
            Ulasan akan muncul di sini setelah penyewa menyelesaikan masa pemesanan.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {reviews.map((rev) => {
            const dateFormatted = new Date(rev.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div key={rev.id} className="py-4 first:pt-2 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ReviewAvatar src={rev.user?.avatar} name={rev.user?.name} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {rev.user?.name || "Penyewa"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[11px] font-medium">
                          <Check className="w-3 h-3" />
                          Terverifikasi
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{dateFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-slate-700 text-xs sm:text-sm mt-2.5 leading-relaxed pl-12">
                    {rev.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
