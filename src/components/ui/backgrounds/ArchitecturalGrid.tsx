import React from "react";

interface ArchitecturalGridProps {
  className?: string;
  variant?: "default" | "dark";
}

export function ArchitecturalGrid({
  className = "",
  variant = "default",
}: ArchitecturalGridProps) {
  const isDarkVariant = variant === "dark";

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`.trim()}
    >
      {/* 1. Ambient Spotlights for depth */}
      {isDarkVariant ? (
        <>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-slate-800/40 rounded-full blur-[90px]" />
        </>
      ) : (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-emerald-500/3 to-transparent dark:from-emerald-500/5 dark:via-transparent blur-2xl" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-teal-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -left-24 w-80 h-80 bg-slate-400/5 dark:bg-slate-700/5 rounded-full blur-3xl" />
        </>
      )}

      {/* 2. Architectural Blueprint Isometric / Square Structural Grid */}
      <svg
        className={`absolute inset-0 w-full h-full ${
          isDarkVariant
            ? "text-slate-700/30 dark:text-slate-800/40"
            : "text-slate-900/[0.03] dark:text-slate-100/[0.035]"
        }`}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id={`architectural-grid-${variant}`}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            {/* Fine Grid Cells */}
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            {/* Subtle Structural Cross Accent at every 48px vertex */}
            <path
              d="M 23 24 L 25 24 M 24 23 L 24 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
          {/* Radial Fade Mask to smoothly dissolve edges without harsh rectangular cuts */}
          <radialGradient
            id={`grid-fade-mask-${variant}`}
            cx="50%"
            cy="50%"
            r="65%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#000" stopOpacity="1" />
            <stop offset="65%" stopColor="#000" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <mask id={`mask-${variant}`}>
            <rect
              width="100%"
              height="100%"
              fill={`url(#grid-fade-mask-${variant})`}
            />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill={`url(#architectural-grid-${variant})`}
          mask={`url(#mask-${variant})`}
        />
      </svg>
    </div>
  );
}

