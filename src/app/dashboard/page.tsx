"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HRShell } from "@/components/hr/HRShell";
import { StatusChip } from "@/components/ui/StatusChip";

type RecSlug = "strong-hire" | "hire" | "borderline" | "no-hire";

interface InterviewRow {
  id: string;
  candidateName: string;
  initials: string;
  position: string;
  status: string;
  scheduledDate: string;
  completedDate: string;
  overallScore: number | null;
  recommendation: string | null;
}
interface Position {
  id: string;
  title: string;
  interviewCount: number;
  completedCount: number;
  avgScore: number | null;
}
interface Metrics {
  positions: number;
  totalInterviews: number;
  scheduled: number;
  live: number;
  completed: number;
  strongHire: number;
  avgScore: number | null;
  byRecommendation: { strongHire: number; hire: number; borderline: number; noHire: number };
}

function recToSlug(rec: string | null): RecSlug {
  if (rec === "STRONG_HIRE") return "strong-hire";
  if (rec === "HIRE") return "hire";
  if (rec === "NO_HIRE") return "no-hire";
  return "borderline";
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recent, setRecent] = useState<InterviewRow[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => {
        setMetrics(d.metrics ?? null);
        setRecent(d.recentInterviews ?? []);
        setPositions(d.positions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const cards = [
    { label: "Open Positions", value: metrics?.positions ?? 0, icon: "work", href: "/dashboard/pools" },
    { label: "Total Interviews", value: metrics?.totalInterviews ?? 0, icon: "groups", href: "/dashboard/evaluation" },
    { label: "Completed", value: metrics?.completed ?? 0, icon: "task_alt", href: "/dashboard/evaluation" },
    { label: "Strong Hire", value: metrics?.strongHire ?? 0, icon: "stars", href: "/dashboard/evaluation", highlight: true },
    { label: "Avg Score", value: metrics?.avgScore != null ? `${metrics.avgScore}` : "—", icon: "speed", href: "/dashboard/reports" },
  ];

  const rec = metrics?.byRecommendation;
  const recTotal = rec ? rec.strongHire + rec.hire + rec.borderline + rec.noHire : 0;
  const recBars = rec
    ? [
        { label: "Strong Hire", n: rec.strongHire, color: "bg-[#4edea3]" },
        { label: "Hire", n: rec.hire, color: "bg-[#adc6ff]" },
        { label: "Borderline", n: rec.borderline, color: "bg-[#f59e0b]" },
        { label: "No Hire", n: rec.noHire, color: "bg-[#ffb4ab]" },
      ]
    : [];

  return (
    <HRShell title="Overview" subtitle="Your hiring pipeline at a glance" onScheduled={load}>
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`glass-panel p-5 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-[#adc6ff]/30 transition-all ${c.highlight ? "border-l-4 border-l-[#4edea3]" : ""}`}>
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl material-filled">{c.icon}</span>
            </div>
            <span className="font-mono text-[11px] text-[#c2c6d6]/60">{c.label}</span>
            <h3 className="font-display text-3xl font-bold text-[#d4e4fa]">{loading ? "—" : c.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent interviews */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h4 className="font-display text-lg font-medium text-[#d4e4fa]">Recent Interviews</h4>
            <Link href="/dashboard/evaluation" className="font-mono text-[11px] text-[#adc6ff] hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-10 text-center"><span className="material-symbols-outlined text-[#adc6ff] animate-spin">progress_activity</span></div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[#c2c6d6]/30 text-4xl">inbox</span>
              <p className="font-sans text-sm text-[#c2c6d6]/60">No interviews yet. Schedule one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((i) => (
                <Link key={i.id} href={i.status === "Completed" ? `/dashboard/candidates/${i.id}` : "/dashboard/live"} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-full border border-[#adc6ff]/20 bg-[#adc6ff]/5 flex items-center justify-center text-[#adc6ff] font-bold text-xs">{i.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[13px] text-[#d4e4fa] truncate">{i.candidateName}</p>
                    <p className="font-sans text-xs text-[#c2c6d6]/60 truncate">{i.position}</p>
                  </div>
                  {i.overallScore != null ? (
                    <span className="font-display text-lg font-bold text-[#4edea3]">{i.overallScore}</span>
                  ) : (
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-[#c2c6d6] uppercase">{i.status}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recommendation breakdown */}
        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <h4 className="font-display text-lg font-medium text-[#d4e4fa] mb-4">AI Recommendations</h4>
          {recTotal === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
              <span className="material-symbols-outlined text-[#c2c6d6]/30 text-4xl">monitoring</span>
              <p className="font-sans text-xs text-[#c2c6d6]/60">Recommendations appear once interviews are evaluated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recBars.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between font-mono text-[11px] mb-1">
                    <span className="text-[#c2c6d6]">{b.label}</span>
                    <span className="text-[#d4e4fa]">{b.n}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${b.color} rounded-full`} style={{ width: `${recTotal ? (b.n / recTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5">
            <h5 className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase mb-3">Positions</h5>
            {positions.length === 0 ? (
              <p className="font-sans text-xs text-[#c2c6d6]/50">No positions yet.</p>
            ) : (
              <div className="space-y-2">
                {positions.slice(0, 4).map((p) => (
                  <Link key={p.id} href="/dashboard/pools" className="flex justify-between items-center text-sm hover:text-[#adc6ff] transition-colors">
                    <span className="font-sans text-[#c2c6d6] truncate">{p.title}</span>
                    <span className="font-mono text-[11px] text-[#c2c6d6]/50">{p.interviewCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest evaluated chips row */}
      {recent.some((i) => i.recommendation) && (
        <div className="glass-panel rounded-xl p-5 mt-6">
          <h4 className="font-display text-lg font-medium text-[#d4e4fa] mb-4">Latest Decisions</h4>
          <div className="flex flex-wrap gap-3">
            {recent.filter((i) => i.recommendation).map((i) => (
              <Link key={i.id} href={`/dashboard/candidates/${i.id}`} className="flex items-center gap-2">
                <StatusChip recommendation={recToSlug(i.recommendation)} />
                <span className="font-mono text-[11px] text-[#c2c6d6]/70">{i.candidateName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </HRShell>
  );
}
