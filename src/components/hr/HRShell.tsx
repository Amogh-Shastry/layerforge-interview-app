"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { GetLinkModal } from "./GetLinkModal";

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

  return (
    <div className="dark bg-[#051424] text-[#d4e4fa] min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <Link href="/dashboard" className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">AIEval Pro</Link>
        <div className="flex-1 flex justify-center px-4">{headerRight}</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLinkOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#adc6ff] text-[#002e6a] font-mono text-[12px] font-bold rounded-lg hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-sm">link</span>
            Get Link
          </button>
          <button className="material-symbols-outlined text-[#c2c6d6]/60 hover:text-[#adc6ff] transition-colors">notifications</button>
          <div className="h-8 w-8 rounded-full border border-[#adc6ff]/30 bg-[#adc6ff]/10 flex items-center justify-center text-[#adc6ff] font-bold text-sm">HR</div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-[#122131] border-r border-white/5 flex-col py-8 z-40">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-[#4d8eff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#00285d]">corporate_fare</span>
              </div>
              <div>
                <p className="font-mono text-[13px] text-[#d4e4fa] font-bold">DeepStation AI</p>
                <p className="font-sans text-sm text-[#c2c6d6]/60">Technical Hiring</p>
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
                    active ? "bg-[#adc6ff]/10 text-[#adc6ff] border-r-4 border-[#adc6ff]" : "text-[#c2c6d6] hover:bg-white/5"
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? "material-filled" : "group-hover:text-[#adc6ff]"}`}>{item.icon}</span>
                  <span className="font-mono text-[13px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mt-auto">
            <button onClick={() => setLinkOpen(true)} className="w-full bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">link</span>
              Get Interview Link
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 md:ml-64 flex flex-col bg-[#051424] p-6 md:p-12 pb-28 min-h-[calc(100vh-64px)]">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-[#d4e4fa] tracking-tight">{title}</h1>
            {subtitle && <p className="font-sans text-sm text-[#c2c6d6]/60 mt-1">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-2 bg-[#1c2b3c]/95 backdrop-blur-lg border-t border-white/10">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-0.5 ${active ? "text-[#adc6ff]" : "text-[#c2c6d6]"}`}>
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
