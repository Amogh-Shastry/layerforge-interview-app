"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

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
        "bg-chrome border-b border-line shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-8">
        <Link href="/" aria-label="LayerForge home">
          <Logo variant="mono" />
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
                    ? "text-accent border-b-2 border-accent pb-1"
                    : "text-on-chrome/70 hover:text-on-chrome"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        {label && (
          <span className="font-mono text-[13px] text-on-chrome/60">{label}</span>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-4">{rightSlot}</div>}
    </nav>
  );
}
