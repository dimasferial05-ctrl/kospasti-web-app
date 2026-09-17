"use client";

import React, { useState, useEffect } from "react";
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
  const [internalValue, setInternalValue] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (onChange) {
      onChange(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = internalValue.trim();
    if (query && !isLoading) {
      onSearch(query);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInternalValue(prompt);
    if (onChange) {
      onChange(prompt);
    }
    if (!isLoading) {
      onSearch(prompt);
    }
  };

  const isHero = variant === "hero";

  return (
    <div className="w-full flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={`relative flex items-center bg-white border border-slate-200/90 rounded-2xl sm:rounded-full transition-all duration-200 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500 focus-within:shadow-lg ${
            isHero ? "p-1.5 sm:p-2" : "p-1.5"
          }`}
        >
          {/* Left Icon (Search Icon standard) */}
          <div className="pl-3 sm:pl-4 pr-2 text-slate-400 flex items-center justify-center shrink-0">
            <Search className={isHero ? "w-5 h-5 sm:w-6 sm:h-6 text-slate-400" : "w-4 h-4 text-slate-400"} />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={internalValue}
            onChange={handleChange}
            disabled={isLoading}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 disabled:opacity-60 ${
              isHero
                ? "py-2.5 sm:py-3.5 text-sm sm:text-base font-medium"
                : "py-2 text-sm"
            }`}
          />

          {/* Actions Container */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1 shrink-0">
            {showReset && onReset && internalValue && (
              <button
                type="button"
                onClick={onReset}
                className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl sm:rounded-full transition-all flex items-center gap-1 cursor-pointer"
                title="Reset Pencarian"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Submit Button (Search Icon with Brand Primary Color) */}
            <button
              type="submit"
              disabled={isLoading || !internalValue.trim()}
              className={`rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm hover:shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
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
          <span className="font-semibold text-slate-500 text-[11px] sm:text-xs shrink-0">
            Saran:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 sm:flex-wrap shrink-0">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.prompt)}
                className="inline-flex items-center px-2.5 py-1 rounded-lg sm:rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/70 hover:border-emerald-200 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
