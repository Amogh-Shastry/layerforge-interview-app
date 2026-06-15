"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface TopNavProps {
  brand?: string;
  links?: NavLink[];
  rightSlot?: React.ReactNode;
  className?: string;
  minimal?: boolean;
  label?: string;
}

export function TopNav({
  brand = "AIEval Pro",
  links = [],
  rightSlot,
  className,
  minimal = false,
  label,
}: TopNavProps) {
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16",
        "bg-[#051424]/80 backdrop-blur-xl border-b border-white/10 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">
          {brand}
        </Link>
        {!minimal && links.length > 0 && (
          <nav className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-mono text-[13px] tracking-[0.02em] transition-colors duration-200",
                  link.active
                    ? "text-[#adc6ff] border-b-2 border-[#adc6ff] pb-1"
                    : "text-[#c2c6d6]/60 hover:text-[#adc6ff]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        {label && (
          <span className="font-mono text-[13px] text-[#c2c6d6]/60">{label}</span>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-4">{rightSlot}</div>}
    </nav>
  );
}
