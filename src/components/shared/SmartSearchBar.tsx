"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Loader2, Send, RotateCcw, AlertCircle } from "lucide-react";

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
          className={`relative flex items-center bg-white border border-slate-200/90 rounded-2xl sm:rounded-full transition-all duration-200 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-500 focus-within:shadow-lg ${
            isHero ? "p-1.5 sm:p-2" : "p-1.5"
          }`}
        >
          {/* Left Icon */}
          <div className="pl-3 sm:pl-4 pr-2 text-slate-400 flex items-center justify-center shrink-0">
            {isHero ? (
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            ) : (
              <MapPin className="w-4 h-4 text-slate-400" />
            )}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !internalValue.trim()}
              className={`rounded-xl sm:rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
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
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggestion Chips */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1.5 text-xs px-1">
          <span className="font-semibold text-slate-500 text-[11px] sm:text-xs">
            Saran Pencarian:
          </span>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(item.prompt)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg sm:rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/60 hover:border-indigo-200 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer text-left"
            >
              {item.label}
            </button>
          ))}
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
