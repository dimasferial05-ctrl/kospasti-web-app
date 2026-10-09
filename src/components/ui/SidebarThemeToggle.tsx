"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { SidebarLink } from "@/components/ui/sidebar";

export function SidebarThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="px-3 py-2 flex items-center gap-3 text-slate-500">
        <div className="size-5 rounded-full bg-slate-800/80 animate-pulse shrink-0" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <SidebarLink
      link={{
        label: isDark ? "Tema: Gelap" : "Tema: Terang",
        href: "#",
        icon: isDark ? (
          <Moon size={20} className="text-indigo-400 shrink-0 transition-transform hover:rotate-12" />
        ) : (
          <Sun size={20} className="text-amber-400 shrink-0 transition-transform hover:rotate-45" />
        ),
        onClick: handleToggle,
      }}
      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/90 transition-colors"
    />
  );
}
