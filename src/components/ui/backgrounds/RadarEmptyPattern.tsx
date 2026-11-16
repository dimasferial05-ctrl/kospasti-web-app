import React from "react";

interface RadarEmptyPatternProps {
  className?: string;
}

export function RadarEmptyPattern({ className = "" }: RadarEmptyPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 flex items-center justify-center ${className}`.trim()}
    >
      {/* Soft Center Radar Ambient Glow */}
      <div className="absolute w-52 h-52 bg-emerald-500/10 dark:bg-emerald-500/8 rounded-full blur-2xl" />

      <svg
        className="relative z-0 w-[360px] h-[360px] text-slate-400/60 dark:text-slate-600/60"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 300"
        fill="none"
      >
        {/* Concentric Search Radar Rings */}
        <circle
          cx="150"
          cy="150"
          r="140"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 7"
        />
        <circle
          cx="150"
          cy="150"
          r="105"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle
          cx="150"
          cy="150"
          r="70"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx="150"
          cy="150"
          r="35"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* Crosshair alignment lines */}
        <line
          x1="150"
          y1="10"
          x2="150"
          y2="290"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <line
          x1="10"
          y1="150"
          x2="290"
          y2="150"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      </svg>
    </div>
  );
}
