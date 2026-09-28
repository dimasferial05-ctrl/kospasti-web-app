"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function GooeyFilter({
  filterId,
  blur,
}: {
  filterId: string;
  blur: number;
}) {
  return (
    <svg className="absolute hidden h-0 w-0" aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId, className }: { layoutId: string; className?: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className={cn("size-4 shrink-0 transition-colors", className)}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.35,
  type: "spring" as const,
  bounce: 0.15,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
}

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (query: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  theme?: "slate" | "emerald" | "default";
  preserveLayoutSpace?: boolean;
  autoFocus?: boolean;
}

export function GooeyInput({
  placeholder = "Cari sesuatu...",
  className,
  classNames,
  collapsedWidth = 140,
  expandedWidth = 260,
  expandedOffset = 44,
  gooeyBlur = 4,
  value: valueProp,
  defaultValue = "",
  onChange,
  onValueChange,
  onOpenChange,
  onSubmit,
  onKeyDown,
  disabled = false,
  theme = "slate",
  preserveLayoutSpace = true,
  autoFocus = false,
}: GooeyInputProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-filter-${safeId}`;
  const iconLayoutId = `gooey-input-icon-${safeId}`;
  const inputLayoutId = `gooey-input-field-${safeId}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(Boolean(valueProp));
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (valueProp && !isExpanded) {
      setTimeout(() => setIsExpanded(true), 0);
    }
  }, [valueProp, isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current && !isControlled) {
      setSearchText("");
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, isControlled, setSearchText]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset],
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      onChange?.(e);
    },
    [setSearchText, onChange],
  );

  const handleBlur = useCallback(() => {
    if (!searchText) setExpanded(false);
  }, [searchText, setExpanded]);

  const handleKeyDownInternal = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.(searchText);
    }
    onKeyDown?.(e);
  };

  // Harmonized surface color tokens based on system typography and palette
  const surfaceClass = useMemo(() => {
    if (theme === "emerald") {
      return "bg-white text-slate-800 border border-slate-200/90 shadow-xs hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15";
    }
    // Default / slate theme (Admin & default components)
    return "bg-white text-slate-800 border border-slate-200 shadow-xs hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15";
  }, [theme]);

  const iconColor = theme === "emerald" ? "text-emerald-600" : "text-slate-500";

  // Total reserved width so it never shifts neighboring flex elements
  const containerWidth = preserveLayoutSpace ? expandedWidth + expandedOffset : undefined;

  return (
    <div
      className={cn(
        "relative flex items-center justify-start shrink-0",
        className,
        classNames?.root,
      )}
      style={containerWidth ? { width: containerWidth } : undefined}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      <div
        className={cn(
          "relative flex h-10 items-center justify-start",
          classNames?.filterWrap,
        )}
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className={cn("flex h-10 items-center justify-center", classNames?.buttonRow)}
          variants={buttonVariants}
          initial={isExpanded ? "expanded" : "collapsed"}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={handleExpand}
            className={cn(
              "flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-4 text-sm font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-50",
              surfaceClass,
              classNames?.trigger,
            )}
          >
            {!isExpanded ? (
              <SearchIcon layoutId={iconLayoutId} className={iconColor} />
            ) : null}
            <motion.input
              layoutId={inputLayoutId}
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoFocus={autoFocus}
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDownInternal}
              disabled={disabled || !isExpanded}
              placeholder={placeholder}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-normal",
                isExpanded
                  ? "pointer-events-auto"
                  : "pointer-events-none opacity-80",
                classNames?.input,
              )}
            />
          </button>
        </motion.div>

        <motion.div
          className={cn(
            "absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center",
            classNames?.bubble,
          )}
          variants={iconBubbleVariants}
          initial={isExpanded ? "expanded" : "collapsed"}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full cursor-pointer",
              surfaceClass,
              classNames?.bubbleSurface,
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {isExpanded ? <SearchIcon layoutId={iconLayoutId} className={iconColor} /> : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}