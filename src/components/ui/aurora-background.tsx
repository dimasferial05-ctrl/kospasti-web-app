"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-[#060b14] text-slate-100 transition-colors overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Layer 1: Primary Flowing Aurora Mesh */}
        <div
          className="absolute -inset-[40px] opacity-65 filter blur-[32px] will-change-transform animate-aurora pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.45), transparent 70%),
              radial-gradient(ellipse 60% 40% at 20% 40%, rgba(6, 182, 212, 0.35), transparent 60%),
              radial-gradient(ellipse 70% 50% at 80% 60%, rgba(14, 165, 233, 0.3), transparent 70%),
              radial-gradient(ellipse 90% 60% at 50% 120%, rgba(5, 150, 105, 0.4), transparent 70%),
              repeating-linear-gradient(100deg, rgba(6, 11, 20, 0.9) 0%, rgba(6, 11, 20, 0.9) 7%, transparent 10%, transparent 12%, rgba(6, 11, 20, 0.9) 16%),
              repeating-linear-gradient(100deg, #059669 10%, #0d9488 15%, #0284c7 20%, #10b981 25%, #047857 30%)
            `,
            backgroundSize: "250% 200%",
          }}
        />

        {/* Layer 2: Secondary Shifting & Breathing Wave */}
        <div
          className="absolute -inset-[50px] opacity-45 filter blur-[42px] will-change-transform animate-aurora-shift pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 70% 30%, rgba(52, 211, 153, 0.5), transparent 55%),
              radial-gradient(ellipse at 30% 70%, rgba(6, 182, 212, 0.45), transparent 55%),
              repeating-linear-gradient(120deg, #10b981 0%, #06b6d4 25%, #3b82f6 50%, #10b981 75%)
            `,
            backgroundSize: "200% 200%",
          }}
        />

        {/* Optional Radial Gradient Mask */}
        {showRadialGradient && (
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)] pointer-events-none" />
        )}

        {/* Subtle top/bottom edge ambient fade to blend seamlessly */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060b14] via-[#060b14]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060b14] via-[#060b14]/75 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

