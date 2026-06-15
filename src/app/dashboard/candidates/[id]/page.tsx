"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";

type RecSlug = "strong-hire" | "hire" | "borderline" | "no-hire";

interface ScoredNote {
  label: string;
  score: number;
  note?: string;
}
interface TranscriptLine {
  timestamp: string;
  speaker: "Nova" | "Candidate";
  text: string;
}
interface Evaluation {
  candidateBackground: string;
  technical: number;
  communication: number;
  leadership: number;
  problemSolving: number;
  teamwork: number;
  cultureFit: number;
  confidence: number;
  overallScore: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  riskFlags: string[];
  nextRoundQuestions: string[];
  technicalBreakdown: ScoredNote[];
  communicationBreakdown: ScoredNote[];
}
interface Candidate {
  id: string;
  name: string;
  role: string;
  initials: string;
  completedDate: string;
  durationMin: number;
  status: string;
  evaluation: Evaluation | null;
  transcript: TranscriptLine[];
}

function recToSlug(rec: string | undefined): RecSlug {
  switch (rec) {
    case "STRONG_HIRE":
      return "strong-hire";
    case "HIRE":
      return "hire";
    case "NO_HIRE":
      return "no-hire";
    default:
      return "borderline";
  }
}
function scoreColor(s: number) {
  return s >= 80 ? "text-success" : s >= 60 ? "text-accent" : "text-danger";
}
function barColor(s: number) {
  return s >= 80 ? "bg-success" : s >= 60 ? "bg-accent" : "bg-danger";
}

export default function HRCandidateReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/candidates/${id}`)
      .then((r) => (r.ok ? r.json() : { candidate: null }))
      .then((data) => {
        if (active) setCandidate(data.candidate ?? null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const e = candidate?.evaluation ?? null;
  const competencies = e
    ? [
        { label: "Technical", score: e.technical },
        { label: "Communication", score: e.communication },
        { label: "Leadership", score: e.leadership },
        { label: "Problem Solving", score: e.problemSolving },
        { label: "Teamwork", score: e.teamwork },
        { label: "Culture Fit", score: e.cultureFit },
      ]
    : [];
  const techBreakdown =
    e && e.technicalBreakdown?.length
      ? e.technicalBreakdown
      : e
      ? [
          { label: "Technical Skill", score: e.technical, note: "Overall technical competency" },
          { label: "Problem Solving", score: e.problemSolving, note: "Approach to ambiguous problems" },
        ]
      : [];
  const commBreakdown =
    e && e.communicationBreakdown?.length
      ? e.communicationBreakdown
      : e
      ? [
          { label: "Clarity", score: e.communication },
          { label: "Confidence", score: e.confidence },
        ]
      : [];

  return (
    <div className="bg-canvas text-ink min-h-screen custom-scrollbar">
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-canvas/80 backdrop-blur-xl border-b border-line">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-ink-soft hover:text-accent transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <span className="font-display text-xl font-bold text-accent tracking-tight">AIEval Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-line rounded-lg font-mono text-[13px] hover:bg-surface-2-hover transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">email</span>
            Send to HR
          </button>
          <button className="px-4 py-2 bg-accent text-on-accent rounded-lg font-mono text-[13px] font-bold hover:bg-accent-hover hover:brightness-110 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Download PDF
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <span className="material-symbols-outlined text-accent text-4xl animate-spin">progress_activity</span>
          <p className="font-mono text-sm text-ink-mute">Loading candidate report…</p>
        </div>
      ) : !candidate || !e ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-4">
          <span className="material-symbols-outlined text-ink-mute text-5xl">person_off</span>
          <p className="font-display text-xl text-ink">Candidate not found</p>
          <Link href="/dashboard" className="mt-2 px-6 py-3 bg-accent text-on-accent font-mono text-[13px] rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <main className="px-4 md:px-12 py-8 max-w-6xl mx-auto space-y-8">
          {/* Hero */}
          <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent font-display text-2xl font-bold">
              {candidate.initials}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-semibold text-ink">{candidate.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="font-mono text-[13px] text-ink-mute flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">work</span>
                  {candidate.role}
                </span>
                <span className="font-mono text-[13px] text-ink-mute flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {candidate.completedDate} · {candidate.durationMin} min
                </span>
                <span className="font-mono text-[13px] text-ink-mute flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  {candidate.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-3">
              <div className={`text-5xl font-display font-bold ${scoreColor(e.overallScore)}`}>{e.overallScore}</div>
              <span className={`font-mono text-[11px] uppercase ${scoreColor(e.overallScore)}`}>Overall Score</span>
              <StatusChip recommendation={recToSlug(e.recommendation)} />
            </div>
          </div>

          {/* Candidate background (captured during intake) */}
          {e.candidateBackground && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-ink mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">badge</span>
                Candidate Background
              </h2>
              <p className="font-sans text-sm text-ink-soft leading-relaxed">{e.candidateBackground}</p>
            </div>
          )}

          {/* Summary */}
          {e.summary && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-ink mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">summarize</span>
                Executive Summary
              </h2>
              <p className="font-sans text-sm text-ink-soft leading-relaxed">{e.summary}</p>
            </div>
          )}

          {/* Scores + technical analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-ink mb-6">Competency Scores</h2>
              <div className="space-y-4">
                {competencies.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="font-mono text-[13px] text-ink-soft w-36 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor(item.score)} rounded-full`} style={{ width: `${item.score}%` }} />
                    </div>
                    <span className={`font-mono text-[13px] w-10 text-right ${scoreColor(item.score)}`}>{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">analytics</span>
                Technical Analysis
              </h2>
              <div className="space-y-4">
                {techBreakdown.map((item) => (
                  <div key={item.label} className="p-3 bg-surface-2 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[13px] text-ink">{item.label}</span>
                      <span className="font-mono text-[13px] text-accent">{item.score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${item.score}%` }} />
                    </div>
                    {item.note && <p className="font-sans text-xs text-ink-mute">{item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-success">record_voice_over</span>
              Communication Analysis
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {commBreakdown.map((item) => (
                <div key={item.label} className="text-center p-4 bg-surface-2 rounded-lg">
                  <div className="font-display text-3xl font-bold text-success mb-1">{item.score}</div>
                  <div className="font-mono text-[11px] text-ink-mute uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths / improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {e.strengths.length > 0 && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-success">verified</span>
                  Key Strengths
                </h2>
                <ul className="space-y-3">
                  {e.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="material-symbols-outlined text-success text-sm mt-0.5 flex-shrink-0">check_circle</span>
                      <span className="font-sans text-sm text-ink-soft leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {e.improvements.length > 0 && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">trending_up</span>
                  Development Areas
                </h2>
                <ul className="space-y-3">
                  {e.improvements.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="material-symbols-outlined text-accent text-sm mt-0.5 flex-shrink-0">arrow_forward</span>
                      <span className="font-sans text-sm text-ink-soft leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Transcript */}
          {candidate.transcript.length > 0 && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">forum</span>
                Interview Transcript
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {candidate.transcript.map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="font-mono text-[11px] text-ink-mute mt-1 w-12 flex-shrink-0">{line.timestamp}</span>
                    <div className={`flex-1 p-3 rounded-lg ${line.speaker === "Nova" ? "bg-accent/5 border border-accent/10" : "bg-surface-2"}`}>
                      <span className={`font-mono text-[11px] uppercase mb-1 block ${line.speaker === "Nova" ? "text-accent" : "text-success"}`}>
                        {line.speaker}
                      </span>
                      <p className="font-sans text-sm text-ink-soft leading-relaxed">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {e.riskFlags.length > 0 && (
            <div className="glass-panel rounded-xl p-6 border border-danger/10">
              <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-danger">warning</span>
                Risk Flags
              </h2>
              <ul className="space-y-3">
                {e.riskFlags.map((risk, i) => (
                  <li key={i} className="flex gap-3 p-3 bg-danger/5 rounded-lg">
                    <span className="material-symbols-outlined text-danger text-sm mt-0.5 flex-shrink-0">error_outline</span>
                    <span className="font-sans text-sm text-ink-soft leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next-round questions */}
          {e.nextRoundQuestions.length > 0 && (
            <div className="glass-panel rounded-xl p-6 bg-accent/5 border border-accent/20">
              <h2 className="font-display text-xl font-medium text-ink mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">quiz</span>
                Suggested Next-Round Questions
              </h2>
              <ul className="space-y-3">
                {e.nextRoundQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3 p-3 bg-surface-2 rounded-lg">
                    <span className="font-mono text-accent text-sm font-bold flex-shrink-0">Q{i + 1}</span>
                    <span className="font-sans text-sm text-ink-soft leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pb-8">
            <button className="px-6 py-3 bg-success/10 border border-success/20 text-success font-mono text-[13px] rounded-lg hover:bg-success/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">thumb_up</span>
              Advance to Next Round
            </button>
            <button className="px-6 py-3 bg-danger/10 border border-danger/20 text-danger font-mono text-[13px] rounded-lg hover:bg-danger/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">thumb_down</span>
              Reject Candidate
            </button>
            <button className="px-6 py-3 border border-line hover:bg-surface-2-hover text-ink font-mono text-[13px] rounded-lg transition-all flex items-center gap-2 ml-auto">
              <span className="material-symbols-outlined text-sm">share</span>
              Share Report
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
