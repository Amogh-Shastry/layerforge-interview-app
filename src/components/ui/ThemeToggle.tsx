"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

interface ThemeToggleProps {
  className?: string;
  /** "chrome" = sits on the teal header/sidebar; "surface" = sits on a content surface. */
  variant?: "chrome" | "surface";
}

export function ThemeToggle({ className, variant = "chrome" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  const onChrome = variant === "chrome";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "flex items-center justify-center h-9 w-9 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        onChrome
          ? "text-on-chrome/70 hover:text-on-chrome hover:bg-white/10"
          : "text-ink-mute hover:text-ink hover:bg-surface-2",
        className
      )}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch */}
      <span className="material-symbols-outlined text-[20px]">
        {mounted && theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
