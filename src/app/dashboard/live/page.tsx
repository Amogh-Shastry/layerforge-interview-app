"use client";

import { useEffect, useState } from "react";
import { HRShell } from "@/components/hr/HRShell";

interface InterviewRow {
  id: string;
  candidateName: string;
  initials: string;
  position: string;
  status: string;
  scheduledDate: string;
}

export default function LiveSessionsPage() {
  const [rows, setRows] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/interviews")
      .then((r) => r.json())
      .then((d) => setRows(d.interviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const live = rows.filter((r) => r.status === "Live");
  const scheduled = rows.filter((r) => r.status === "Scheduled");

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${id}`).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function Row({ r }: { r: InterviewRow }) {
    return (
      <div className="flex items-center gap-4 p-4 hover:bg-surface-2-hover transition-colors">
        <div className="w-10 h-10 rounded-full border border-accent/20 bg-accent/5 flex items-center justify-center text-accent font-bold text-sm">{r.initials}</div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[13px] text-ink truncate">{r.candidateName}</p>
          <p className="font-sans text-xs text-ink-mute truncate">{r.position}</p>
        </div>
        {r.status === "Live" ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-danger/10 border border-danger/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            <span className="font-mono text-[10px] text-danger uppercase">Live</span>
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-mute hidden sm:block">{r.scheduledDate}</span>
        )}
        <button onClick={() => copyLink(r.id)} className="px-3 py-1.5 border border-line rounded-lg font-mono text-[11px] text-ink hover:bg-surface-2-hover transition-all flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">{copiedId === r.id ? "check" : "link"}</span>
          {copiedId === r.id ? "Copied" : "Link"}
        </button>
        <a href={`/interview/${r.id}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-accent text-on-accent rounded-lg font-mono text-[11px] font-bold hover:brightness-110 hover:bg-accent-hover transition-all flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Open
        </a>
      </div>
    );
  }

  return (
    <HRShell title="Live Sessions" subtitle="Scheduled and in-progress interviews" onScheduled={load}>
      {loading ? (
        <div className="p-16 text-center"><span className="material-symbols-outlined text-accent text-3xl animate-spin">progress_activity</span></div>
      ) : (
        <div className="space-y-6">
          {/* Live now */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-5 border-b border-line flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <h4 className="font-display text-lg font-medium text-ink">In Progress</h4>
              <span className="font-mono text-[11px] text-ink-mute">({live.length})</span>
            </div>
            {live.length === 0 ? (
              <p className="p-8 text-center font-sans text-sm text-ink-mute">No interviews in progress right now.</p>
            ) : (
              <div className="divide-y divide-line">{live.map((r) => <Row key={r.id} r={r} />)}</div>
            )}
          </div>

          {/* Scheduled */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-5 border-b border-line flex items-center gap-2">
              <span className="material-symbols-outlined text-accent text-lg">event</span>
              <h4 className="font-display text-lg font-medium text-ink">Scheduled</h4>
              <span className="font-mono text-[11px] text-ink-mute">({scheduled.length})</span>
            </div>
            {scheduled.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-ink-mute text-4xl">event_busy</span>
                <p className="font-sans text-sm text-ink-mute">No scheduled interviews. Use “Schedule” to create one and share the link.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">{scheduled.map((r) => <Row key={r.id} r={r} />)}</div>
            )}
          </div>
        </div>
      )}
    </HRShell>
  );
}
