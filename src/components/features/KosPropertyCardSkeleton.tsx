import React from "react";

export function KosPropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden flex flex-col h-full animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 relative" />

      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
        <div className="flex flex-col gap-2.5">
          {/* Badge Row */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Title */}
          <div className="w-3/4 h-5 rounded-md bg-slate-200 dark:bg-slate-800 mt-1" />

          {/* Facilities */}
          <div className="w-full h-3.5 rounded-md bg-slate-200 dark:bg-slate-800 mt-1" />
        </div>

        {/* Footer: Price & Owner */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="w-28 h-6 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="w-20 h-4 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
