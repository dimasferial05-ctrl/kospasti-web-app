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
          <div className="absolute top-0 right-1/4 w-[550px] h-[550px] bg-emerald-500/18 rounded-full blur-[110px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-700/50 rounded-full blur-[100px]" />
        </>
      ) : (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/18 via-emerald-500/6 to-transparent dark:from-emerald-500/12 dark:via-transparent blur-2xl" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-teal-500/10 dark:bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -left-24 w-80 h-80 bg-slate-400/10 dark:bg-slate-700/10 rounded-full blur-3xl" />
        </>
      )}

      {/* 2. Architectural Blueprint Isometric / Square Structural Grid */}
      <svg
        className={`absolute inset-0 w-full h-full ${
          isDarkVariant
            ? "text-slate-600/50 dark:text-slate-500/40"
            : "text-slate-900/[0.08] dark:text-slate-100/[0.10]"
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
              strokeWidth="1.2"
            />
            {/* Subtle Structural Cross Accent at every 48px vertex */}
            <path
              d="M 22 24 L 26 24 M 24 22 L 24 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </pattern>
          {/* Radial Fade Mask: White (#fff) is visible, Black (#000) is transparent */}
          <radialGradient
            id={`grid-fade-mask-${variant}`}
            cx="50%"
            cy="50%"
            r="70%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.85" />
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
