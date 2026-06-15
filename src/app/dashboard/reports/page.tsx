"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HRShell } from "@/components/hr/HRShell";

interface InterviewRow {
  id: string;
  candidateName: string;
  initials: string;
  position: string;
  status: string;
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

export default function ReportsPage() {
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/interviews").then((r) => r.json()),
      fetch("/api/positions").then((r) => r.json()),
    ])
      .then(([i, p]) => {
        setInterviews(i.interviews ?? []);
        setPositions(p.positions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(() => interviews.filter((i) => i.status === "Completed" && i.overallScore != null), [interviews]);

  const recDist = useMemo(() => {
    const d = { STRONG_HIRE: 0, HIRE: 0, BORDERLINE: 0, NO_HIRE: 0 };
    completed.forEach((i) => { if (i.recommendation && i.recommendation in d) d[i.recommendation as keyof typeof d]++; });
    return d;
  }, [completed]);

  const scoreBuckets = useMemo(() => {
    const b = [
      { label: "80–100", min: 80, n: 0, color: "bg-[#4edea3]" },
      { label: "60–79", min: 60, n: 0, color: "bg-[#adc6ff]" },
      { label: "40–59", min: 40, n: 0, color: "bg-[#f59e0b]" },
      { label: "0–39", min: 0, n: 0, color: "bg-[#ffb4ab]" },
    ];
    completed.forEach((i) => {
      const s = i.overallScore!;
      const bucket = b.find((x) => s >= x.min)!;
      bucket.n++;
    });
    return b;
  }, [completed]);

  const avgScore = completed.length ? Math.round(completed.reduce((a, b) => a + (b.overallScore ?? 0), 0) / completed.length) : null;
  const completionRate = interviews.length ? Math.round((completed.length / interviews.length) * 100) : 0;
  const topCandidates = useMemo(() => [...completed].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)).slice(0, 5), [completed]);

  const recBars = [
    { label: "Strong Hire", n: recDist.STRONG_HIRE, color: "bg-[#4edea3]" },
    { label: "Hire", n: recDist.HIRE, color: "bg-[#adc6ff]" },
    { label: "Borderline", n: recDist.BORDERLINE, color: "bg-[#f59e0b]" },
    { label: "No Hire", n: recDist.NO_HIRE, color: "bg-[#ffb4ab]" },
  ];
  const recTotal = recBars.reduce((a, b) => a + b.n, 0);
  const maxBucket = Math.max(1, ...scoreBuckets.map((b) => b.n));

  return (
    <HRShell title="Reports" subtitle="Hiring analytics from completed interviews">
      {loading ? (
        <div className="p-16 text-center"><span className="material-symbols-outlined text-[#adc6ff] text-3xl animate-spin">progress_activity</span></div>
      ) : completed.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[#c2c6d6]/30 text-5xl">monitoring</span>
          <p className="font-display text-lg text-[#d4e4fa]">No data to report yet</p>
          <p className="font-sans text-sm text-[#c2c6d6]/60 max-w-sm">Analytics populate automatically once candidates complete interviews.</p>
          <Link href="/dashboard/pools" className="mt-2 px-6 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold rounded-lg">Set up a position</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Evaluated", value: completed.length, icon: "fact_check" },
              { label: "Avg Score", value: avgScore ?? "—", icon: "speed" },
              { label: "Completion Rate", value: `${completionRate}%`, icon: "donut_large" },
              { label: "Strong Hires", value: recDist.STRONG_HIRE, icon: "stars" },
            ].map((k) => (
              <div key={k.label} className="glass-panel p-5 rounded-xl">
                <span className="material-symbols-outlined text-[#adc6ff] text-xl">{k.icon}</span>
                <h3 className="font-display text-3xl font-bold text-[#d4e4fa] mt-1">{k.value}</h3>
                <span className="font-mono text-[11px] text-[#c2c6d6]/60">{k.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendation distribution */}
            <div className="glass-panel rounded-xl p-6">
              <h4 className="font-display text-lg font-medium text-[#d4e4fa] mb-5">Recommendation Distribution</h4>
              <div className="space-y-4">
                {recBars.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-[#c2c6d6]">{b.label}</span>
                      <span className="text-[#d4e4fa]">{b.n} · {recTotal ? Math.round((b.n / recTotal) * 100) : 0}%</span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full transition-all duration-700`} style={{ width: `${recTotal ? (b.n / recTotal) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score distribution */}
            <div className="glass-panel rounded-xl p-6">
              <h4 className="font-display text-lg font-medium text-[#d4e4fa] mb-5">Score Distribution</h4>
              <div className="flex items-end justify-around gap-3 h-44">
                {scoreBuckets.slice().reverse().map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-2 flex-1">
                    <span className="font-mono text-[13px] text-[#d4e4fa]">{b.n}</span>
                    <div className="w-full flex items-end" style={{ height: "120px" }}>
                      <div className={`w-full ${b.color} rounded-t-lg transition-all duration-700`} style={{ height: `${(b.n / maxBucket) * 100}%`, minHeight: b.n > 0 ? "6px" : "0" }} />
                    </div>
                    <span className="font-mono text-[10px] text-[#c2c6d6]/60">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-position performance */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/10"><h4 className="font-display text-lg font-medium text-[#d4e4fa]">Performance by Position</h4></div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead><tr className="bg-white/5">{["Position", "Interviews", "Completed", "Avg Score"].map((h) => <th key={h} className="px-6 py-3 font-mono text-[12px] text-[#c2c6d6]/60">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-3 font-mono text-[13px] text-[#d4e4fa]">{p.title}</td>
                      <td className="px-6 py-3 font-sans text-sm text-[#c2c6d6]/70">{p.interviewCount}</td>
                      <td className="px-6 py-3 font-sans text-sm text-[#c2c6d6]/70">{p.completedCount}</td>
                      <td className="px-6 py-3 font-mono text-[13px] text-[#4edea3]">{p.avgScore ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top candidates */}
          {topCandidates.length > 0 && (
            <div className="glass-panel rounded-xl p-6">
              <h4 className="font-display text-lg font-medium text-[#d4e4fa] mb-4">Top Candidates</h4>
              <div className="space-y-2">
                {topCandidates.map((c, idx) => (
                  <Link key={c.id} href={`/dashboard/candidates/${c.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="font-mono text-sm text-[#c2c6d6]/40 w-5">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full border border-[#adc6ff]/20 bg-[#adc6ff]/5 flex items-center justify-center text-[#adc6ff] font-bold text-xs">{c.initials}</div>
                    <span className="flex-1 font-mono text-[13px] text-[#d4e4fa]">{c.candidateName}</span>
                    <span className="font-sans text-xs text-[#c2c6d6]/60">{c.position}</span>
                    <span className="font-display text-lg font-bold text-[#4edea3]">{c.overallScore}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </HRShell>
  );
}
