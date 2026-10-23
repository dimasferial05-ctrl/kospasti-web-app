import React from "react";

export function MapPropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-800 shadow-soft animate-pulse select-none"
    >
      <div className="flex gap-3.5">
        {/* Thumbnail Shimmer */}
        <div className="w-28 h-28 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800" />

        {/* Content Shimmer */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-2">
            {/* Badges Shimmer */}
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>

            {/* Title Shimmer */}
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />

            {/* Address / Distance Shimmer */}
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>

          {/* Price & Rating Shimmer */}
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
