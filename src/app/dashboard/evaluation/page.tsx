"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HRShell } from "@/components/hr/HRShell";
import { StatusChip, ScoreBadge } from "@/components/ui/StatusChip";

type RecSlug = "strong-hire" | "hire" | "borderline" | "no-hire";

interface InterviewRow {
  id: string;
  candidateName: string;
  initials: string;
  position: string;
  status: string;
  completedDate: string;
  scheduledDate: string;
  overallScore: number | null;
  recommendation: string | null;
}

function recToSlug(rec: string | null): RecSlug {
  if (rec === "STRONG_HIRE") return "strong-hire";
  if (rec === "HIRE") return "hire";
  if (rec === "NO_HIRE") return "no-hire";
  return "borderline";
}

export default function EvaluationPage() {
  const [rows, setRows] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [onlyCompleted, setOnlyCompleted] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/interviews")
      .then((r) => r.json())
      .then((d) => setRows(d.interviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const positionOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.position)))], [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (onlyCompleted && r.status !== "Completed") return false;
        if (position !== "All" && r.position !== position) return false;
        const q = search.toLowerCase();
        return !q || r.candidateName.toLowerCase().includes(q) || r.position.toLowerCase().includes(q);
      }),
    [rows, search, position, onlyCompleted]
  );

  const headerRight = (
    <div className="relative w-full max-w-md">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute text-sm">search</span>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search candidates or positions…"
        className="w-full bg-surface border border-line rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-all placeholder:text-ink-mute"
      />
    </div>
  );

  return (
    <HRShell title="Evaluation" subtitle="Completed interviews scored by Nova" headerRight={headerRight} onScheduled={load}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={position} onChange={(e) => setPosition(e.target.value)} className="bg-surface border border-line rounded-lg py-2 px-3 text-sm focus:border-accent focus:outline-none">
          {positionOptions.map((p) => <option key={p}>{p}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
          <input type="checkbox" checked={onlyCompleted} onChange={(e) => setOnlyCompleted(e.target.checked)} className="rounded border-line bg-surface-2 text-accent focus:ring-0" />
          Completed only
        </label>
        <span className="font-mono text-[11px] text-ink-mute ml-auto">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2">
                {["Candidate", "Position", "Score", "AI Recommendation", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-6 py-4 font-mono text-[13px] text-ink-mute whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><span className="material-symbols-outlined text-accent text-3xl animate-spin">progress_activity</span></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-ink-mute text-4xl">assignment</span>
                    <p className="font-sans text-sm text-ink-mute">No evaluations yet. Schedule interviews and they’ll appear here once completed.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-accent/20 bg-accent/5 flex items-center justify-center text-accent font-bold text-sm">{r.initials}</div>
                        <span className="font-mono text-[13px] text-ink whitespace-nowrap">{r.candidateName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm text-ink-soft whitespace-nowrap">{r.position}</td>
                    <td className="px-6 py-4">{r.overallScore != null ? <ScoreBadge score={r.overallScore} /> : <span className="font-mono text-xs text-ink-mute">—</span>}</td>
                    <td className="px-6 py-4">{r.recommendation ? <StatusChip recommendation={recToSlug(r.recommendation)} /> : <span className="font-mono text-xs text-ink-mute">Pending</span>}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-surface-2 border border-line rounded font-mono text-[10px] text-ink-soft uppercase">{r.status}</span></td>
                    <td className="px-6 py-4 font-sans text-sm text-ink-mute whitespace-nowrap">{r.status === "Completed" ? r.completedDate : r.scheduledDate}</td>
                    <td className="px-6 py-4 text-right">
                      {r.status === "Completed" ? (
                        <Link href={`/dashboard/candidates/${r.id}`} title="View report"><span className="material-symbols-outlined text-ink-mute hover:text-accent transition-all cursor-pointer">open_in_new</span></Link>
                      ) : (
                        <span className="material-symbols-outlined text-ink-mute">open_in_new</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HRShell>
  );
}
