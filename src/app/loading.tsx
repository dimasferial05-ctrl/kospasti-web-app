import React from "react";
import { KosPropertyCardSkeleton } from "@/components/features/KosPropertyCardSkeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header / Hero Search Skeleton */}
      <div className="w-full max-w-3xl mx-auto mb-10 flex flex-col items-center gap-4">
        <div className="h-8 w-48 sm:w-64 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-4 w-72 sm:w-96 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-14 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft mt-2" />
      </div>

      {/* Section Heading Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Property Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <KosPropertyCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
