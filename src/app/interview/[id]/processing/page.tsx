"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface TurnLine {
  speaker: "Nova" | "Candidate";
  text: string;
}

const baseStages = [
  { key: "transcript", icon: "transcribe", label: "Transcript", desc: "Processing voice-to-text" },
  { key: "technical", icon: "code", label: "Tech Skills", desc: "Evaluating technical depth" },
  { key: "communication", icon: "forum", label: "Communication", desc: "Sentiment & clarity analysis" },
  { key: "score", icon: "insights", label: "Final Score", desc: "Synthesizing report" },
];

const logEntries = [
  "Aligning transcript turns with role rubric…",
  "Scoring technical depth against required skills…",
  "Extracting soft-skill behavioral markers…",
  "Analyzing tone, clarity, and confidence…",
  "Identifying gaps and risk flags…",
  "Drafting next-round recommendations…",
  "Generating candidate report…",
  "Finalizing evaluation…",
];

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState(8);
  const [logs, setLogs] = useState<string[]>([logEntries[0]]);
  const [stageIndex, setStageIndex] = useState(0);
  const doneRef = useRef(false);
  const logIndex = useRef(1);

  // Kick off the real evaluation.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      let turns: TurnLine[] = [];
      try {
        const raw = sessionStorage.getItem(`interview:${id}:transcript`);
        if (raw) turns = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      const transcript = turns.map((t) => ({
        role: t.speaker === "Nova" ? "assistant" : "user",
        content: t.text,
      }));

      if (transcript.length >= 2) {
        try {
          const res = await fetch(`/api/interviews/${id}/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.result) {
              sessionStorage.setItem(`interview:${id}:result`, JSON.stringify(data.result));
            }
          }
        } catch {
          /* evaluation unavailable — report falls back to stored/demo data */
        }
      }

      if (!cancelled) doneRef.current = true;
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Progress + log animation; completes only once the evaluation resolves.
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (doneRef.current) return Math.min(100, p + 6);
        // Climb toward 92% while waiting on the model.
        if (p < 92) return p + Math.random() * 4;
        return p;
      });
    }, 320);

    const logTimer = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, logEntries[logIndex.current % logEntries.length]];
        logIndex.current++;
        return next.slice(-6);
      });
    }, 1600);

    return () => {
      clearInterval(progressTimer);
      clearInterval(logTimer);
    };
  }, []);

  // Advance stage highlight + navigate at 100%.
  useEffect(() => {
    setStageIndex(Math.min(baseStages.length - 1, Math.floor((progress / 100) * baseStages.length)));
    if (progress >= 100) {
      const t = setTimeout(() => router.push(`/interview/${id}/complete`), 700);
      return () => clearTimeout(t);
    }
  }, [progress, id, router]);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-[#050816] text-[#d4e4fa]">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050816]" />
        <div className="scanline-effect" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#adc6ff]/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center flex-grow px-4 md:px-12 py-8">
        <div className="relative flex flex-col items-center mb-12">
          <div className="relative w-[280px] h-[280px]">
            <div className="pulse-ring" style={{ width: "200px", height: "200px", animationDelay: "0s" }} />
            <div className="pulse-ring" style={{ width: "200px", height: "200px", animationDelay: "1s" }} />
            <div className="pulse-ring" style={{ width: "200px", height: "200px", animationDelay: "2s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="brain-glow bg-[#122131] border border-white/10 rounded-full p-8">
                <span className="material-symbols-outlined text-[#adc6ff] text-[80px] material-filled">psychology</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#d4e4fa]">Analyzing Your Interview…</h1>
            <p className="font-sans text-[#c2c6d6]/70 max-w-md">
              Nova is evaluating your responses across technical depth, communication, and problem-solving. This usually takes under a minute.
            </p>
          </div>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {baseStages.map((stage, i) => {
            const done = i < stageIndex || progress >= 100;
            const active = i === stageIndex && progress < 100;
            const pending = i > stageIndex && progress < 100;
            return (
              <div
                key={stage.key}
                className={`glass-panel p-5 rounded-xl flex items-center gap-4 transition-all duration-300 ${active ? "border-[#adc6ff]/30 ring-1 ring-[#adc6ff]/20" : ""} ${pending ? "opacity-50" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-[#4edea3]/20" : active ? "bg-[#adc6ff]/10 animate-pulse" : "bg-white/5"}`}>
                  <span className={`material-symbols-outlined text-xl ${done ? "text-[#4edea3] material-filled" : active ? "text-[#adc6ff]" : "text-[#c2c6d6]/40"}`}>
                    {done ? "check_circle" : stage.icon}
                  </span>
                </div>
                <div>
                  <p className={`font-mono text-sm uppercase ${done ? "text-[#d4e4fa]" : active ? "text-[#adc6ff]" : "text-[#c2c6d6]/60"}`}>{stage.label}</p>
                  <p className="font-sans text-xs text-[#c2c6d6]/60">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 w-full max-w-2xl bg-black/40 rounded-lg p-4 font-mono border border-white/5 h-32 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/40 to-transparent z-10" />
          <div className="flex flex-col space-y-1 text-[#c2c6d6]/60 text-[11px]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className={i >= logs.length - 1 && progress < 100 ? "text-[#adc6ff] animate-pulse" : "text-[#4edea3]"}>
                  {i >= logs.length - 1 && progress < 100 ? "[RUNNING]" : "[DONE]"}
                </span>
                <span>{log}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/40 to-transparent z-10" />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-8 md:px-12 z-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="font-mono text-[#adc6ff] text-sm tracking-widest">SYSTEM_STATUS: ANALYZING_REPORT</span>
            <span className="font-mono text-[#d4e4fa] text-sm">{Math.floor(progress)}%</span>
          </div>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
