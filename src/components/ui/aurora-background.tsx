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
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.08)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,rgba(6,11,20,0.95)_0%,rgba(6,11,20,0.95)_7%,transparent_10%,transparent_12%,rgba(6,11,20,0.95)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#059669_10%,#0d9488_15%,#0284c7_20%,#059669_25%,#10b981_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[24px]
            after:content-[""] after:absolute after:inset-0
            after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-screen
            pointer-events-none
            absolute -inset-[20px] opacity-45 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_30%,transparent_80%)]`
          )}
        />
        {/* Subtle top/bottom edge ambient fade to blend seamlessly */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060b14]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#060b14]/80 to-transparent" />
      </div>
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

