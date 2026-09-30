"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info } from "lucide-react";

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  widthClass?: string;
}

export function Tooltip({
  content,
  children,
  position = "bottom",
  className = "",
  widthClass = "w-64 sm:w-72 max-w-[85vw]",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isVisible]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div
        onClick={() => setIsVisible((prev) => !prev)}
        className="inline-flex items-center"
      >
        {children}
      </div>

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 transition-all duration-150 animate-in fade-in zoom-in-95 ${positionClasses[position]}`}
        >
          <div
            className={`bg-slate-900/95 backdrop-blur-md text-slate-100 text-xs font-normal px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 ${widthClass} whitespace-normal text-left leading-relaxed`}
          >
            {content}
          </div>
          <div
            className={`w-0 h-0 border-4 absolute ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

interface HelpTooltipProps {
  text: string;
  variant?: "help" | "info";
  position?: "top" | "bottom" | "left" | "right";
  iconSize?: number;
  className?: string;
  widthClass?: string;
}

export function HelpTooltip({
  text,
  variant = "help",
  position = "bottom",
  iconSize = 14,
  className = "",
  widthClass,
}: HelpTooltipProps) {
  const Icon = variant === "help" ? HelpCircle : Info;

  return (
    <Tooltip
      content={text}
      position={position}
      className={className}
      widthClass={widthClass}
    >
      <button
        type="button"
        className="text-slate-400 hover:text-emerald-600 focus:text-emerald-600 focus:outline-none transition-colors p-0.5 rounded-full inline-flex items-center justify-center cursor-help"
        aria-label="Informasi Bantuan"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Icon size={iconSize} className="shrink-0" />
      </button>
    </Tooltip>
  );
}
