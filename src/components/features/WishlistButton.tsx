"use client";

import React, { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface WishlistButtonProps {
  propertyId: string;
  initialIsSaved?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "floating" | "icon" | "button";
  className?: string;
  onToggle?: (isSaved: boolean) => void;
  showText?: boolean;
}

export function WishlistButton({
  propertyId,
  initialIsSaved = false,
  size = "md",
  variant = "floating",
  className = "",
  onToggle,
  showText = false,
}: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState<boolean>(initialIsSaved);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    // Optimistic UI Update
    const previousState = isSaved;
    const nextState = !previousState;
    setIsSaved(nextState);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 450);

    setIsPending(true);

    try {
      const response = await fetch("/api/user/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          action: nextState ? "add" : "remove",
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        // Rollback state jika belum login
        setIsSaved(previousState);
        const confirmLogin = window.confirm(
          "Anda harus login untuk menyimpan kos ke favorit. Apakah Anda ingin login sekarang?"
        );
        if (confirmLogin) {
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
          router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        }
        return;
      }

      if (!response.ok || !data.success) {
        // Rollback state jika error server
        setIsSaved(previousState);
        console.error("Gagal memperbarui wishlist:", data.error);
        return;
      }

      // Pastikan sync dengan respons server
      setIsSaved(data.isSaved);
      if (onToggle) {
        onToggle(data.isSaved);
      }
    } catch (err) {
      console.error("Gagal melakukan toggle wishlist:", err);
      // Rollback jika terjadi masalah jaringan
      setIsSaved(previousState);
    } finally {
      setIsPending(false);
    }
  };

  // Icon sizing
  const iconSizeClass = (() => {
    switch (size) {
      case "sm":
        return "w-3.5 h-3.5";
      case "lg":
        return "w-6 h-6";
      case "md":
      default:
        return "w-4.5 h-4.5";
    }
  })();

  // Variant styling
  const variantClass = (() => {
    switch (variant) {
      case "button":
        return `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${
          isSaved
            ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/80 shadow-xs"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
        }`;
      case "icon":
        return `inline-flex items-center justify-center p-2 rounded-full transition-all duration-200 ${
          isSaved
            ? "text-rose-500 hover:bg-rose-50"
            : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
        }`;
      case "floating":
      default:
        return `inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-md transition-all duration-200 shadow-md ${
          size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-8.5 h-8.5"
        } ${
          isSaved
            ? "text-rose-500 shadow-rose-500/10 hover:scale-105"
            : "text-slate-600 hover:text-rose-500 hover:scale-105"
        }`;
    }
  })();

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSaved ? "Hapus dari favorit" : "Simpan ke favorit"}
      title={isSaved ? "Hapus dari favorit" : "Simpan ke favorit"}
      disabled={isPending}
      className={`relative cursor-pointer select-none active:scale-90 transition-transform ${variantClass} ${className}`}
    >
      <Heart
        className={`${iconSizeClass} transition-all duration-300 ${
          isSaved
            ? "fill-rose-500 text-rose-500 scale-100"
            : "fill-transparent stroke-[2] group-hover:scale-110"
        } ${isAnimating ? "animate-bounce" : ""}`}
      />
      {showText && variant === "button" && (
        <span className="truncate">{isSaved ? "Tersimpan di Favorit" : "Simpan Favorit"}</span>
      )}
      {isPending && (
        <span className="sr-only">
          <Loader2 className="w-3 h-3 animate-spin" />
        </span>
      )}
    </button>
  );
}

export default WishlistButton;
