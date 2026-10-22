"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  RotateCcw,
  AlertCircle,
  MapPin,
  GraduationCap,
  School,
  HeartPulse,
  Factory,
  Compass,
  Building2,
} from "lucide-react";
import {
  getPrefixLocationSuggestions,
  LocationSuggestion,
} from "@/data/locationSuggestions";

const CATEGORY_CONFIG: Record<
  LocationSuggestion["category"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }
> = {
  kampus: {
    label: "Kampus",
    icon: GraduationCap,
    badgeClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60",
  },
  sekolah: {
    label: "Sekolah",
    icon: School,
    badgeClass:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60",
  },
  rumah_sakit: {
    label: "Faskes",
    icon: HeartPulse,
    badgeClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60",
  },
  pabrik: {
    label: "Industri",
    icon: Factory,
    badgeClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60",
  },
  landmark: {
    label: "Landmark",
    icon: Compass,
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60",
  },
  wilayah: {
    label: "Wilayah",
    icon: MapPin,
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  },
  kota: {
    label: "Kota",
    icon: Building2,
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  },
};

export interface SuggestionItem {
  label: string;
  prompt: string;
}

export const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { label: "Dekat Polsub Subang", prompt: "Kos dekat Politeknik Negeri Subang harga terjangkau" },
  { label: "Dekat Alun-Alun Subang", prompt: "Kos dekat Alun-alun Subang fasilitas lengkap" },
  { label: "Dekat RSUD Subang", prompt: "Kos dekat RSUD Subang aman dan nyaman" },
  { label: "Campur, <1 Jt Subang", prompt: "Kos campur di Subang harga di bawah 1 juta" },
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
  placeholder = 'Cari kos... contoh: "Kos putri dekat Polsub Subang ada AC di bawah 1 juta"',
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

  const [activeSuggestions, setActiveSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const updateSuggestions = (val: string) => {
    if (val.trim().length >= 2) {
      const results = getPrefixLocationSuggestions(val, 20);
      setActiveSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setActiveSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onChange?.(val);
    updateSuggestions(val);
  };

  // Auto-scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const buttons = listRef.current.querySelectorAll("button");
      if (buttons[highlightedIndex]) {
        buttons[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    let newQuery = suggestion.label;
    const trimmed = currentValue.trim();
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      words[words.length - 1] = suggestion.label;
      newQuery = words.join(" ");
    }

    if (!isControlled) {
      setUncontrolledValue(newQuery);
    }
    onChange?.(newQuery);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || activeSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < activeSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : activeSuggestions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < activeSuggestions.length) {
      e.preventDefault();
      handleSelectLocation(activeSuggestions[highlightedIndex]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const query = currentValue.trim();
    if (query && !isLoading) {
      onSearch(query);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setIsOpen(false);
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
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <div
            className={`relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-full transition-all duration-300 shadow-soft-lg hover:shadow-float focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:border-emerald-500 ${
              isHero ? "p-2 sm:p-2.5" : "p-1.5"
            }`}
          >
            {/* Left Icon (Search Icon standard) */}
            <div className="pl-3 sm:pl-4 pr-2 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
              <Search className={isHero ? "w-5 h-5 sm:w-6 sm:h-6 text-emerald-600/70 dark:text-emerald-400" : "w-4 h-4 text-emerald-600/70 dark:text-emerald-400"} />
            </div>

            {/* Text Input dengan Semantik WAI-ARIA Combobox & Label Aksesibel */}
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen && activeSuggestions.length > 0}
              aria-controls="location-suggestions-list"
              aria-activedescendant={
                isOpen && highlightedIndex >= 0 ? `suggestion-item-${highlightedIndex}` : undefined
              }
              aria-label="Cari kos berdasarkan lokasi, kampus, atau fasilitas"
              value={currentValue}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => {
                if (currentValue.trim().length >= 2 && activeSuggestions.length > 0) {
                  setIsOpen(true);
                }
              }}
              disabled={isLoading}
              autoFocus={autoFocus}
              placeholder={placeholder}
              className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium disabled:opacity-60 ${
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
                  aria-label="Reset pencarian"
                  className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl sm:rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Reset Pencarian"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              {/* Submit Button per docs/DESIGN.md */}
              <button
                type="submit"
                disabled={isLoading || !currentValue.trim()}
                aria-label="Cari kos"
                className={`rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold transition-all duration-200 shadow-soft hover:shadow-float flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
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

        {/* Floating Autocomplete Suggestions with Scrollable Container */}
        {isOpen && activeSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-float overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2 flex flex-col text-left">
            {/* Minimalist Professional Header */}
            <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/80 shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Rekomendasi Lokasi ({activeSuggestions.length})
                </span>
              </div>
              <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">↑↓</kbd>
                <span>navigasi</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] shadow-2xs">↵</kbd>
                <span>pilih</span>
              </div>
            </div>

            {/* Scrollable List with sleek custom scrollbar & Semantik Listbox */}
            <div
              id="location-suggestions-list"
              role="listbox"
              aria-label="Rekomendasi Lokasi"
              ref={listRef}
              className="p-1.5 flex flex-col gap-0.5 max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent] dark:[scrollbar-color:theme(colors.slate.700)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
            >
              {activeSuggestions.map((item, idx) => {
                const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.landmark;
                const IconComponent = config.icon;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={idx}
                    id={`suggestion-item-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    type="button"
                    onClick={() => handleSelectLocation(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                      isHighlighted
                        ? "bg-slate-100/90 dark:bg-slate-800/90"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isHighlighted
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-400"
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-sm font-semibold truncate transition-colors ${
                          isHighlighted
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ml-2 transition-colors ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Footer */}
            <div className="px-4 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between select-none">
              <span>Klik lokasi untuk melengkapi kata kunci</span>
              <span className="hidden sm:inline text-[9px] text-slate-400">Esc untuk menutup</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips: Horizontal scrollable carousel on mobile */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar pb-1 sm:pb-0 px-1 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] shrink-0">
            Saran:
          </span>
          <div className="flex items-center gap-2 sm:flex-wrap shrink-0">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.prompt)}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-semibold shadow-2xs hover:shadow-soft transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-3 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

