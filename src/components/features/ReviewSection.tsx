"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Star,
  Check,
  AlertCircle,
  Loader2,
  Send,
  PenSquare,
  Camera,
  ImagePlus,
  X,
  Maximize2,
} from "lucide-react";

export interface ReviewPhotoItem {
  url: string;
  reviewId: string;
  rating: number;
  studentName: string;
  createdAt: string;
  comment?: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  images?: string | null;
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  property?: {
    owner?: {
      name: string;
      avatar_url?: string | null;
    } | null;
  } | null;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
  photoReviewsCount?: number;
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
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center shrink-0 text-xs border border-slate-200 dark:border-slate-700 select-none">
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
  const [allPhotos, setAllPhotos] = useState<ReviewPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Input State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Lightbox Modal State
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<ReviewPhotoItem | null>(null);

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
        setAllPhotos(data.data.allPhotos || []);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedLightboxPhoto(null);
      }
    };
    if (selectedLightboxPhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLightboxPhoto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 3) {
      setFormError("Maksimal 3 foto kamar asli yang dapat diunggah.");
      return;
    }

    const validFiles: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setFormError(`File '${f.name}' bukan merupakan gambar yang valid.`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setFormError(`Ukuran foto '${f.name}' melebihi batas 5MB.`);
        return;
      }
      validFiles.push(f);
    }

    const updated = [...selectedFiles, ...validFiles].slice(0, 3);
    setSelectedFiles(updated);

    const urls = updated.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setFormError(null);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    const urls = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

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

      const formData = new FormData();
      formData.append("rating", String(selectedRating));
      if (commentText.trim()) {
        formData.append("comment", commentText.trim());
      }
      if (targetBookingId) {
        formData.append("booking_id", targetBookingId);
      }
      for (const file of selectedFiles) {
        formData.append("images", file);
      }

      const res = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal mengirim ulasan. Silakan coba lagi.");
        return;
      }

      setFormSuccess("Ulasan Anda berhasil dikirim dan dipublikasikan.");
      setCommentText("");
      setSelectedFiles([]);
      setPreviewUrls([]);
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
    <section id="reviews-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ulasan Penghuni
            </h3>
            {stats.totalReviews > 0 && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {stats.totalReviews} ulasan
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ulasan dari penyewa terverifikasi di {propertyName}.
          </p>
        </div>

        {isEligible && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
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
          className="my-6 p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Beri Penilaian Pengalaman Tinggal
            </h4>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 rounded-md">
              Penyewa Terverifikasi
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Rating Stars Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
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
                      className="p-1 text-slate-300 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
                      aria-label={`Pilih rating ${star}`}
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                          isFilled
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 dark:text-slate-600 hover:text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {activeRatingDisplay} / 5 ({getRatingLabel(activeRatingDisplay)})
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="mb-4">
            <label
              htmlFor="review-comment"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2"
            >
              Ceritakan Pengalaman Anda (Opsional)
            </label>
            <textarea
              id="review-comment"
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bagaimana kondisi fasilitas, kebersihan, keamanan, dan respon pemilik kos?"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Upload Foto Kamar Asli */}
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Foto Kondisi Kamar Asli (Opsional, Maks. 3 Foto)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedFiles.length}/3 foto
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bantu calon penghuni lain melihat kondisi nyata kamar, kamar mandi, atau fasilitas kos.
            </p>

            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {/* Thumbnail Previews */}
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-2xs"
                >
                  <img
                    src={url}
                    alt={`Preview foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={`Hapus foto ${idx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Trigger Button */}
              {selectedFiles.length < 3 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 active:scale-95">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Tambah</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center pb-4 md:pb-0 md:border-r border-slate-200/80 dark:border-slate-800">
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
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
                    : "text-slate-200 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
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
              <div key={star} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-14 flex items-center gap-1 font-medium shrink-0">
                  {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 dark:bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-400 dark:text-slate-500 font-mono text-[11px] shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Photo Gallery */}
      {allPhotos.length > 0 && (
        <div className="my-6 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Foto Asli dari Penghuni
              </h4>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                {allPhotos.length} foto
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {allPhotos.map((photo, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setSelectedLightboxPhoto(photo)}
                className="group relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer focus:outline-none"
                aria-label={`Lihat foto ulasan oleh ${photo.studentName}`}
              >
                <img
                  src={photo.url}
                  alt={`Foto ulasan ${photo.studentName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex items-center gap-1 text-[10px] text-white font-medium">
                    <Maximize2 className="w-3 h-3" />
                    <span className="truncate">{photo.studentName}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-2" />
          <p className="text-xs font-medium">Memuat ulasan...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/40 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum Ada Ulasan</p>
          <p className="text-xs text-slate-400 mt-1">
            Ulasan akan muncul di sini setelah penyewa menyelesaikan masa pemesanan.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {rev.user?.name || "Penyewa"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
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
                            : "text-slate-200 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm mt-2.5 leading-relaxed pl-12">
                    {rev.comment}
                  </p>
                )}

                {/* Review Photos Thumbnail Strip */}
                {(() => {
                  let reviewImages: string[] = [];
                  if (rev.images) {
                    try {
                      const parsed =
                        typeof rev.images === "string" ? JSON.parse(rev.images) : rev.images;
                      if (Array.isArray(parsed)) reviewImages = parsed;
                    } catch {
                      reviewImages = [];
                    }
                  }
                  if (!reviewImages.length) return null;

                  return (
                    <div className="flex items-center gap-2.5 mt-3 pl-12 flex-wrap">
                      {reviewImages.map((imgUrl, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() =>
                            setSelectedLightboxPhoto({
                              url: imgUrl,
                              reviewId: rev.id,
                              rating: rev.rating,
                              studentName: rev.user?.name || "Penyewa",
                              createdAt: rev.created_at,
                              comment: rev.comment,
                            })
                          }
                          className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer focus:outline-none"
                          aria-label={`Perbesar foto ulasan ${imgIdx + 1}`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Foto ulasan kamar ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {rev.reply && (() => {
                  const ownerName = rev.property?.owner?.name || "Pemilik Kos";
                  const ownerInitial = (ownerName || "P").trim().charAt(0).toUpperCase() || "P";

                  return (
                    <div className="mt-4 ml-8 sm:ml-12 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100/70 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 transition-all shadow-xs">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar Mitra (Foto atau Inisial) */}
                        {rev.property?.owner?.avatar_url ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                            <Image
                              src={rev.property.owner.avatar_url}
                              alt={ownerName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-700 text-xs select-none">
                            {ownerInitial}
                          </div>
                        )}

                        {/* Detail Nama & Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                            {ownerName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide shadow-xs">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            Mitra KosPasti
                          </span>
                        </div>

                        {/* Waktu Balasan */}
                        {rev.replied_at && (
                          <span className="text-[11px] text-slate-400 font-medium ml-auto">
                            {new Date(rev.replied_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Isi Balasan */}
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-11">
                        {rev.reply}
                      </p>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Foto Kamar Asli
                </span>
                <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                  <Check className="w-3 h-3" />
                  Penghuni Terverifikasi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLightboxPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="relative w-full max-h-[65vh] min-h-[280px] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={selectedLightboxPhoto.url}
                alt="Foto ulasan kamar"
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Footer / Review Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLightboxPhoto.studentName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= selectedLightboxPhoto.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(selectedLightboxPhoto.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {selectedLightboxPhoto.comment && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  &ldquo;{selectedLightboxPhoto.comment}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
