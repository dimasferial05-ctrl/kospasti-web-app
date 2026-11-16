import React from "react";

interface TrustAuraProps {
  className?: string;
}

export function TrustAura({ className = "" }: TrustAuraProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`.trim()}
    >
      {/* 1. Verified Green Trust Glow radiating from center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-emerald-500/22 via-emerald-500/8 to-transparent dark:from-emerald-500/18 dark:via-emerald-500/5 to-transparent blur-3xl rounded-full" />

      {/* 2. Delicate Escrow Guarantee / Security Watermark Rings */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] text-emerald-600/[0.18] dark:text-emerald-400/[0.15]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 800"
        fill="none"
      >
        {/* Outer Circular Bounds */}
        <circle
          cx="400"
          cy="400"
          r="380"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray="5 7"
        />
        <circle
          cx="400"
          cy="400"
          r="340"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle
          cx="400"
          cy="400"
          r="290"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="8 8"
        />
        <circle
          cx="400"
          cy="400"
          r="240"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* Concentric Guilloche / Radial Rays */}
        <path
          d="M 400 20 L 400 780 M 20 400 L 780 400 M 131 131 L 669 669 M 131 669 L 669 131"
          stroke="currentColor"
          strokeWidth="1.0"
          strokeDasharray="4 8"
        />
      </svg>
    </div>
  );
}
