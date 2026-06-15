"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

const defaultItems: MobileNavItem[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/dashboard", icon: "event", label: "Meetings" },
  { href: "/candidates", icon: "person_search", label: "Candidates", active: true },
  { href: "/profile", icon: "account_circle", label: "Profile" },
];

interface MobileNavProps {
  items?: MobileNavItem[];
}

export function MobileNav({ items = defaultItems }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-[#1c2b3c]/90 backdrop-blur-lg border-t border-white/10 rounded-t-xl shadow-lg">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-90",
            item.active ? "text-[#adc6ff] scale-110" : "text-[#c2c6d6] hover:text-[#adc6ff]"
          )}
        >
          <span className={cn("material-symbols-outlined", item.active && "material-filled")}>
            {item.icon}
          </span>
          <span className="font-mono text-[11px]">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
