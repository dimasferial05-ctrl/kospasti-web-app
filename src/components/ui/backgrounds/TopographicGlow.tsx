import React from "react";

interface TopographicGlowProps {
  className?: string;
}

export function TopographicGlow({ className = "" }: TopographicGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`.trim()}
    >
      {/* 1. Soft Emerald Ambient Radial Spotlight centered behind search area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[480px] sm:h-[580px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/22 via-emerald-500/8 to-transparent dark:from-emerald-500/18 dark:via-emerald-500/5 dark:to-transparent blur-3xl" />

      {/* 2. Secondary soft warm slate depth at top corners */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-3xl" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-teal-500/15 dark:bg-teal-600/10 rounded-full blur-3xl" />

      {/* 3. Subtle Geographic & Topographic Contour Curves */}
      <svg
        className="absolute inset-0 w-full h-full text-emerald-900/[0.14] dark:text-emerald-400/[0.12]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 600"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M-100 120 C 300 240, 600 -40, 1000 180 C 1200 280, 1400 160, 1600 220"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M-100 200 C 250 320, 700 80, 1100 280 C 1300 360, 1500 240, 1650 300"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M-100 280 C 200 400, 750 160, 1150 360 C 1350 440, 1480 320, 1680 380"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path
          d="M-50 80 C 350 180, 650 -10, 950 140 C 1250 250, 1450 100, 1650 150"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </div>
  );
}
