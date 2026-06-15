"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Evaluation {
  overallScore: number;
  technical: number;
  communication: number;
  leadership: number;
  problemSolving: number;
  teamwork: number;
  cultureFit: number;
  confidence: number;
  recommendation: "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE";
  summary: string;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  learningRoadmap: { title: string; source: string }[];
}

const recMeta: Record<string, { label: string; icon: string; color: string }> = {
  STRONG_HIRE: { label: "Strong Hire", icon: "star", color: "#4edea3" },
  HIRE: { label: "Hire", icon: "thumb_up", color: "#adc6ff" },
  BORDERLINE: { label: "Borderline", icon: "help", color: "#f59e0b" },
  NO_HIRE: { label: "Needs Development", icon: "trending_down", color: "#ffb4ab" },
};

const tips = [
  "Structure your answers using the STAR method for behavioral questions",
  "Always discuss failure modes and recovery in system-design answers",
  "Ask clarifying questions before diving into solutions",
  "Show your thinking process out loud, even while problem-solving",
];

function scoreColor(s: number) {
  return s >= 80 ? "bg-[#4edea3]" : s >= 60 ? "bg-[#adc6ff]" : "bg-[#ffb4ab]";
}

export default function CandidateReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [evalData, setEvalData] = useState<Evaluation | null>(null);
  const [meta, setMeta] = useState<{ name: string; role: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      // 1. Fresh result from a just-completed live interview.
      try {
        const raw = sessionStorage.getItem(`interview:${id}:result`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (active) {
            setEvalData(parsed);
            setLoading(false);
          }
        }
      } catch {
        /* ignore */
      }

      // 2. Persisted/demo data from the API (also fills candidate meta).
      try {
        const res = await fetch(`/api/candidates/${id}`);
        if (res.ok) {
          const { candidate } = await res.json();
          if (active && candidate) {
            setMeta({ name: candidate.name, role: candidate.role, date: candidate.completedDate });
            setEvalData((prev) => prev ?? candidate.evaluation);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const e = evalData;
  const rec = e ? recMeta[e.recommendation] ?? recMeta.BORDERLINE : recMeta.HIRE;
  const scores = e
    ? [
        { label: "Technical Skills", score: e.technical },
        { label: "Communication", score: e.communication },
        { label: "Problem Solving", score: e.problemSolving },
        { label: "Leadership", score: e.leadership },
        { label: "Culture Fit", score: e.cultureFit },
        { label: "Confidence", score: e.confidence },
      ]
    : [];

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen custom-scrollbar">
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10">
        <div className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">AIEval Pro</div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-white/10 rounded-lg font-mono text-[13px] hover:bg-white/5 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Download PDF
          </button>
        </div>
      </header>

      {loading && !e ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <span className="material-symbols-outlined text-[#adc6ff] text-4xl animate-spin">progress_activity</span>
          <p className="font-mono text-sm text-[#c2c6d6]/60">Loading your report…</p>
        </div>
      ) : !e ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-4">
          <span className="material-symbols-outlined text-[#c2c6d6]/40 text-5xl">description</span>
          <p className="font-display text-xl text-[#d4e4fa]">Report not available yet</p>
          <p className="font-sans text-sm text-[#c2c6d6]/60 max-w-md">
            Complete an interview to generate your personalized feedback report.
          </p>
          <Link href="/" className="mt-2 px-6 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <main className="px-4 md:px-12 py-8 max-w-5xl mx-auto space-y-8">
          {/* Hero */}
          <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-16 h-16 rounded-full bg-[#adc6ff]/10 border border-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff] font-display text-xl font-bold">
              {(meta?.name ?? "Candidate").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-semibold text-[#d4e4fa]">{meta?.name ?? "Your Interview"}</h1>
              <p className="font-sans text-[#c2c6d6]/70 text-sm">
                {(meta?.role ?? "Interview Report")}
                {meta?.date ? ` · ${meta.date}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl font-display font-bold" style={{ color: rec.color }}>{e.overallScore}</div>
              <span className="font-mono text-[11px] uppercase" style={{ color: rec.color }}>Overall Score</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: `${rec.color}1a`, borderColor: `${rec.color}33` }}>
                <span className="material-symbols-outlined text-[14px] material-filled" style={{ color: rec.color }}>{rec.icon}</span>
                <span className="status-chip" style={{ color: rec.color }}>{rec.label}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {e.summary && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#adc6ff]">summarize</span>
                Summary
              </h2>
              <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{e.summary}</p>
            </div>
          )}

          {/* Score breakdown */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-6">Score Breakdown</h2>
            <div className="space-y-4">
              {scores.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="font-mono text-[13px] text-[#c2c6d6] w-36 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${scoreColor(item.score)} rounded-full transition-all duration-1000`} style={{ width: `${item.score}%` }} />
                  </div>
                  <span className="font-mono text-[13px] text-[#d4e4fa] w-10 text-right">{item.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {e.strengths.length > 0 && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3]">verified</span>
                  Strengths
                </h2>
                <ul className="space-y-3">
                  {e.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="material-symbols-outlined text-[#4edea3] text-sm mt-0.5 flex-shrink-0">check_circle</span>
                      <span className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {e.improvements.length > 0 && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#adc6ff]">trending_up</span>
                  Areas of Improvement
                </h2>
                <ul className="space-y-3">
                  {e.improvements.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="material-symbols-outlined text-[#a4c9ff] text-sm mt-0.5 flex-shrink-0">arrow_forward</span>
                      <span className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {e.missingSkills.length > 0 && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab]">report_problem</span>
                Skills to Develop
              </h2>
              <div className="flex flex-wrap gap-2">
                {e.missingSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 rounded-lg font-mono text-[13px] text-[#ffb4ab]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {e.learningRoadmap.length > 0 && (
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#adc6ff]">school</span>
                Suggested Learning Roadmap
              </h2>
              <div className="space-y-3">
                {e.learningRoadmap.map((course, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#0d1c2d] rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#adc6ff]/10 flex items-center justify-center text-[#adc6ff] font-mono text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-sans text-sm text-[#d4e4fa] font-medium">{course.title}</p>
                      <p className="font-mono text-[11px] text-[#c2c6d6]/60">{course.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel rounded-xl p-6 bg-[#adc6ff]/5 border border-[#adc6ff]/20">
            <h2 className="font-display text-xl font-medium text-[#d4e4fa] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#adc6ff]">tips_and_updates</span>
              Interview Tips for Next Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 bg-[#0d1c2d] rounded-lg">
                  <span className="material-symbols-outlined text-[#adc6ff] text-sm mt-0.5">lightbulb</span>
                  <span className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pb-8">
            <Link href="/" className="px-6 py-3 border border-white/10 hover:bg-white/5 text-[#d4e4fa] font-mono text-[13px] rounded-lg transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">home</span>
              Dashboard
            </Link>
            <button className="px-6 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span>
              Download PDF Report
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
