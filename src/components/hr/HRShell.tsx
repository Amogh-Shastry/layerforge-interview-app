"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { GetLinkModal } from "./GetLinkModal";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/live", icon: "videocam", label: "Live Sessions" },
  { href: "/dashboard/evaluation", icon: "rate_review", label: "Evaluation" },
  { href: "/dashboard/pools", icon: "work", label: "Pools" },
  { href: "/dashboard/reports", icon: "analytics", label: "Reports" },
];

interface HRShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerRight?: ReactNode;
  onScheduled?: () => void;
}

export function HRShell({ title, subtitle, children, headerRight }: HRShellProps) {
  const pathname = usePathname();
  const [linkOpen, setLinkOpen] = useState(false);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="bg-canvas text-ink min-h-screen flex flex-col">
      {/* Header — teal chrome */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-chrome border-b border-line shadow-sm">
        <Link href="/dashboard" aria-label="LayerForge home">
          <Logo variant="mono" />
        </Link>
        <div className="flex-1 flex justify-center px-4">{headerRight}</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLinkOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent text-on-accent font-mono text-[12px] font-bold rounded-lg hover:bg-accent-hover active:bg-accent-press transition-colors">
            <span className="material-symbols-outlined text-sm">link</span>
            Get Link
          </button>
          <ThemeToggle variant="chrome" />
          <button aria-label="Notifications" className="material-symbols-outlined text-on-chrome/60 hover:text-on-chrome transition-colors">notifications</button>
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-on-accent font-bold text-sm">HR</div>
          <button onClick={logout} aria-label="Sign out" title="Sign out" className="material-symbols-outlined text-on-chrome/60 hover:text-on-chrome transition-colors">logout</button>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar — teal chrome */}
        <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-chrome border-r border-line flex-col py-8 z-40">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="material-symbols-outlined text-on-accent">corporate_fare</span>
              </div>
              <div>
                <p className="font-mono text-[13px] text-on-chrome font-bold">LayerForge</p>
                <p className="font-sans text-sm text-on-chrome/60">Technical Hiring</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    active ? "bg-accent/12 text-accent border-r-4 border-accent" : "text-on-chrome/70 hover:bg-white/5 hover:text-on-chrome"
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? "material-filled" : ""}`}>{item.icon}</span>
                  <span className="font-mono text-[13px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mt-auto">
            <button onClick={() => setLinkOpen(true)} className="w-full bg-accent text-on-accent font-mono text-[13px] py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-accent-hover active:bg-accent-press active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">link</span>
              Get Interview Link
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 md:ml-64 flex flex-col bg-canvas p-6 md:p-12 pb-28 min-h-[calc(100vh-64px)]">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="font-sans text-sm text-ink-mute mt-1">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>

      {/* Mobile nav — teal chrome */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-2 bg-chrome border-t border-line">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-0.5 ${active ? "text-accent" : "text-on-chrome/70"}`}>
              <span className={`material-symbols-outlined text-[20px] ${active ? "material-filled" : ""}`}>{item.icon}</span>
              <span className="font-mono text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <GetLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} />
    </div>
  );
}
