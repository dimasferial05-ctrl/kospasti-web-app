"use client";

import React, { useState } from "react";
import { Star, Building2, BedDouble, Calendar, User, MessageSquare } from "lucide-react";

export interface ReviewCardData {
  id: string;
  rating: number;
  comment?: string | null;
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
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [avatarError, setAvatarError] = useState(false);

  const reviewerName = review.user?.name || review.booking?.student_name || "Penyewa Kos";
  const initial = reviewerName.trim().charAt(0).toUpperCase();

  const formattedDate = new Date(review.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const propertyName = review.property.name;
  const roomTypeName = review.booking?.room_type?.name;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float flex flex-col justify-between gap-4">
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
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm border border-emerald-200 select-none shadow-xs">
              {initial || <User className="w-4 h-4" />}
            </div>
          )}

          <div>
            <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
              {reviewerName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
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
                    : "fill-slate-100 text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
            {review.rating}.0
          </span>
        </div>
      </div>

      {/* Context Badge (Property & Room Type) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{propertyName}</span>
        </span>

        {roomTypeName ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
            <BedDouble className="w-3.5 h-3.5 text-slate-500" />
            <span>Tipe: {roomTypeName}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/50">
            Kamar Standar
          </span>
        )}
      </div>

      {/* Comment Body */}
      <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 text-sm">
        {review.comment && review.comment.trim() ? (
          <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
            &ldquo;{review.comment.trim()}&rdquo;
          </p>
        ) : (
          <p className="text-slate-400 italic text-xs flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Tidak ada komentar teks (hanya memberikan rating bintang).
          </p>
        )}
      </div>
    </div>
  );
}
