"use client";

import React, { useState } from "react";
import { Scale, Check } from "lucide-react";
import { useCompare, CompareItem } from "@/hooks/useCompare";

export interface CompareButtonProps {
  property: CompareItem;
  variant?: "icon" | "button";
  size?: "sm" | "md" | "lg";
  className?: string;
  onToggle?: (isAdded: boolean) => void;
  showText?: boolean;
}

export function CompareButton({
  property,
  variant = "icon",
  size = "md",
  className = "",
  onToggle,
  showText = false,
}: CompareButtonProps) {
  const { isInCompare, toggleCompare, isLoaded } = useCompare();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isSelected = isLoaded && property?.id ? isInCompare(property.id) : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!property?.id) return;

    const result = toggleCompare(property);
    if (!result.success && result.message) {
      setFeedbackMessage(result.message);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setFeedbackMessage(null);
      onToggle?.(result.isAdded);
    }
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  if (variant === "button") {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleClick}
          aria-label={isSelected ? `Hapus ${property.name} dari perbandingan` : `Bandingkan kos ${property.name}`}
          aria-pressed={isSelected}
          title={isSelected ? "Hapus dari daftar bandingkan" : "Bandingkan dengan kos lain"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
            isSelected
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-soft"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300"
          } ${className}`}
        >
          {isSelected ? (
            <Check className={`${iconSizes} text-white`} />
          ) : (
            <Scale className={`${iconSizes} ${isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"}`} />
          )}
          <span>{isSelected ? "Sedang Dibandingkan" : "Bandingkan"}</span>
        </button>

        {feedbackMessage && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap shadow-float animate-fadeIn">
            {feedbackMessage}
          </div>
        )}
      </div>
    );
  }

  // Variant: Icon (cocok untuk kartu kos)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        aria-label={isSelected ? `Hapus ${property.name} dari komparasi` : `Bandingkan kos ${property.name}`}
        aria-pressed={isSelected}
        title={isSelected ? "Hapus dari komparasi" : "Bandingkan kos ini"}
        className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${sizeClasses} ${
          isSelected
            ? "bg-emerald-600 text-white border border-emerald-600 shadow-soft"
            : "bg-white/90 hover:bg-white text-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-soft"
        } ${className}`}
      >
        {isSelected ? (
          <Check className={`${iconSizes} text-white`} />
        ) : (
          <Scale className={`${iconSizes} text-slate-700 dark:text-slate-200`} />
        )}
        {showText && (
          <span className="ml-1 text-xs font-semibold">
            {isSelected ? "Terpilih" : "Bandingkan"}
          </span>
        )}
      </button>

      {feedbackMessage && (
        <div className="absolute right-0 top-full mt-1.5 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap shadow-float animate-fadeIn">
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}

export default CompareButton;
