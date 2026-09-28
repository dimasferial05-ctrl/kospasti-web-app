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
        "relative flex flex-col items-center justify-center bg-slate-900 text-slate-100 transition-colors overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.1)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.1)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,rgba(15,23,42,0.9)_0%,rgba(15,23,42,0.9)_7%,transparent_10%,transparent_12%,rgba(15,23,42,0.9)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#10b981_10%,#06b6d4_15%,#3b82f6_20%,#8b5cf6_25%,#10b981_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px]
            after:content-[""] after:absolute after:inset-0
            after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-40 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_20%,transparent_75%)]`
          )}
        />
      </div>
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};
