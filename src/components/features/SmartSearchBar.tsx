"use client";

import React, { useState } from "react";
import { Search, Loader2, RotateCcw, AlertCircle } from "lucide-react";

export interface SuggestionItem {
  label: string;
  prompt: string;
}

export const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { label: "Dekat UI, <2 Jt", prompt: "Kos putri dekat UI ada AC harga di bawah 2 juta" },
  { label: "Dekat Monas, WiFi", prompt: "Kos putra dekat Monas Jakarta fasilitas WiFi" },
  { label: "Dekat Polsub Subang", prompt: "Kos dekat Politeknik Negeri Subang harga murah" },
  { label: "Dekat Gandaria, 1.5Jt", prompt: "Kos campur dekat Mall Gandaria City budget 1.5jt" },
];

interface SmartSearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  onSearch: (prompt: string) => void;
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  variant?: "hero" | "compact";
  showSuggestions?: boolean;
  suggestions?: SuggestionItem[];
  onReset?: () => void;
  showReset?: boolean;
  autoFocus?: boolean;
}

export function SmartSearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  error = null,
  placeholder = 'Cari kos... contoh: "Kos putri dekat UI ada AC harga di bawah 2 juta"',
  variant = "hero",
  showSuggestions = true,
  suggestions = DEFAULT_SUGGESTIONS,
  onReset,
  showReset = false,
  autoFocus = false,
}: SmartSearchBarProps) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(value || "");
  const currentValue = isControlled ? (value ?? "") : uncontrolledValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onChange?.(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = currentValue.trim();
    if (query && !isLoading) {
      onSearch(query);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!isControlled) {
      setUncontrolledValue(prompt);
    }
    onChange?.(prompt);
    if (!isLoading) {
      onSearch(prompt);
    }
  };

  const isHero = variant === "hero";

  return (
    <div className="w-full flex flex-col gap-3.5">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={`relative flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl sm:rounded-full transition-all duration-300 shadow-soft-lg hover:shadow-float focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:border-emerald-500 ${
            isHero ? "p-2 sm:p-2.5" : "p-1.5"
          }`}
        >
          {/* Left Icon (Search Icon standard) */}
          <div className="pl-3 sm:pl-4 pr-2 text-slate-400 flex items-center justify-center shrink-0">
            <Search className={isHero ? "w-5 h-5 sm:w-6 sm:h-6 text-emerald-600/70" : "w-4 h-4 text-emerald-600/70"} />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={currentValue}
            onChange={handleChange}
            disabled={isLoading}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium disabled:opacity-60 ${
              isHero
                ? "py-2.5 sm:py-3.5 text-sm sm:text-base"
                : "py-2 text-sm"
            }`}
          />

          {/* Actions Container */}
          <div className="flex items-center gap-2 pr-1 shrink-0">
            {showReset && onReset && currentValue && (
              <button
                type="button"
                onClick={onReset}
                className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl sm:rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Reset Pencarian"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Submit Button (Search Icon with Brand Primary Color) */}
            <button
              type="submit"
              disabled={isLoading || !currentValue.trim()}
              className={`rounded-xl sm:rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-soft hover:shadow-glow-emerald flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 ${
                isHero
                  ? "px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm"
                  : "px-4 sm:px-5 py-2 text-xs"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Mencari...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestion Chips: Horizontal scrollable carousel on mobile */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar pb-1 sm:pb-0 px-1 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">
            Saran:
          </span>
          <div className="flex items-center gap-2 sm:flex-wrap shrink-0">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.prompt)}
                className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/90 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-300 text-[11px] sm:text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0 text-left shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-2xl border border-rose-200 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

