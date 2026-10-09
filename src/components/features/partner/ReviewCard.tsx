"use client";

import React, { useState } from "react";
import {
  Star,
  Building2,
  BedDouble,
  Calendar,
  User,
  MessageSquare,
  Reply,
  MessageSquareReply,
  Loader2,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";

export interface ReviewCardData {
  id: string;
  rating: number;
  comment?: string | null;
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
    email?: string;
  } | null;
  property: {
    id: string;
    name: string;
    image_url?: string | null;
    address?: string | null;
  };
  booking?: {
    id: string;
    student_name: string;
    room_type_id?: string | null;
    room_type?: {
      id: string;
      name: string;
      price_per_month?: number;
    } | null;
  } | null;
}

interface ReviewCardProps {
  review: ReviewCardData;
  onReplyUpdated?: (
    reviewId: string,
    reply: string | null,
    repliedAt: string | null
  ) => void;
}

export function ReviewCard({ review, onReplyUpdated }: ReviewCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.reply || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reviewerName = review.user?.name || review.booking?.student_name || "Penyewa Kos";
  const initial = reviewerName.trim().charAt(0).toUpperCase();

  const formattedDate = new Date(review.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const propertyName = review.property.name;
  const roomTypeName = review.booking?.room_type?.name;

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) {
      setErrorMessage("Teks balasan ulasan tidak boleh kosong.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/partner/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan balasan ulasan.");
      }

      setIsFormOpen(false);
      onReplyUpdated?.(
        review.id,
        data.review?.reply || trimmed,
        data.review?.replied_at || new Date().toISOString()
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat membalas ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus balasan ulasan ini?")) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/partner/reviews/${review.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus balasan.");
      }

      setReplyText("");
      setIsFormOpen(false);
      onReplyUpdated?.(review.id, null, null);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menghapus balasan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float flex flex-col justify-between gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          {review.user?.avatar && !avatarError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={review.user.avatar}
              alt={reviewerName}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-sm border border-emerald-200 dark:border-emerald-800/60 select-none shadow-xs">
              {initial || <User className="w-4 h-4" />}
            </div>
          )}

          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm md:text-base leading-tight">
              {reviewerName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Stars & Score */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-100 dark:fill-slate-800 text-slate-200 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            {review.rating}.0
          </span>
        </div>
      </div>

      {/* Context Badge (Property & Room Type) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{propertyName}</span>
        </span>

        {roomTypeName ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
            <BedDouble className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Tipe: {roomTypeName}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            Kamar Standar
          </span>
        )}
      </div>

      {/* Comment Body */}
      <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-sm">
        {review.comment && review.comment.trim() ? (
          <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
            &ldquo;{review.comment.trim()}&rdquo;
          </p>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 italic text-xs flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Tidak ada komentar teks (hanya memberikan rating bintang).
          </p>
        )}
      </div>

      {/* Partner Reply Section */}
      <div className="pt-1">
        {/* Jika balasan sudah ada dan form tidak sedang terbuka untuk edit */}
        {review.reply && !isFormOpen && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl p-3.5 text-sm transition-all duration-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <MessageSquareReply className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tanggapan Anda (Pemilik)</span>
                {review.replied_at && (
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    •{" "}
                    {new Date(review.replied_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyText(review.reply || "");
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 px-2 py-0.5 rounded-md transition-all active:scale-95"
                  title="Edit tanggapan"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReply}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-0.5 rounded-md transition-all active:scale-95 disabled:opacity-50"
                  title="Hapus tanggapan"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  <span>Hapus</span>
                </button>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line pl-5">
              {review.reply}
            </p>
          </div>
        )}

        {/* Form Balasan (Inline) */}
        {isFormOpen ? (
          <form onSubmit={handleSaveReply} className="space-y-2 mt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              <MessageSquareReply className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{review.reply ? "Edit Tanggapan Ulasan" : "Tulis Tanggapan Ulasan"}</span>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis ucapan terima kasih atau klarifikasi ramah kepada penyewa..."
              rows={3}
              disabled={isSubmitting}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
              autoFocus
            />

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setReplyText(review.reply || "");
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-soft hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{review.reply ? "Simpan Perubahan" : "Kirim Tanggapan"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tombol untuk membuka form balas jika belum ada reply */
          !review.reply && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setReplyText("");
                  setErrorMessage(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Balas Ulasan</span>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
