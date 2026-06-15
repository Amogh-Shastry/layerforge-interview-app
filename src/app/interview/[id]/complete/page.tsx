"use client";

import Link from "next/link";
import { use, useEffect, useRef } from "react";

export default function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const xAxis = (rect.left + rect.width / 2 - e.pageX) / 50;
      const yAxis = (rect.top + rect.height / 2 - e.pageY) / 50;
      cardRef.current.style.transform = `rotateY(${-xAxis}deg) rotateX(${yAxis}deg)`;
    }
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink bg-canvas selection:bg-accent/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-canvas" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] animate-ai-pulse" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-12">
        <div
          ref={cardRef}
          className="glass-card w-full max-w-2xl rounded-xl p-8 flex flex-col items-center text-center space-y-8 transition-transform duration-100"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Success illustration */}
          <div className="relative group">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 transition-opacity duration-700 opacity-60 group-hover:opacity-100" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-surface rounded-full border border-line">
              <span className="material-symbols-outlined text-accent material-filled" style={{ fontSize: "80px" }}>
                check_circle
              </span>
              {/* Floating accents */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-success rounded-full blur-sm opacity-50 animate-bounce" />
              <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-accent rounded-full blur-sm opacity-40 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 max-w-md">
            <h1 className="font-display text-2xl md:text-3xl text-ink tracking-tight font-semibold">
              Interview Completed Successfully
            </h1>
            <p className="font-sans text-base text-ink-mute leading-relaxed">
              Thank you for participating. Your feedback report has been generated and sent to your registered email address.
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 py-4 px-6 bg-surface rounded-full border border-line">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-mute">Status:</span>
            <span className="flex items-center gap-2 font-mono text-[13px] text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Verified
            </span>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col md:flex-row gap-6 pt-4 justify-center">
            <Link
              href={`/interview/${id}/report`}
              className="px-8 py-4 bg-accent text-on-accent font-mono text-[13px] rounded-lg flex items-center justify-center gap-2 transition-all duration-150 hover:scale-[1.02] hover:bg-accent-hover active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
              View Report
            </Link>
            <Link
              href="/"
              className="px-8 py-4 border border-line hover:bg-surface-2-hover text-ink font-mono text-[13px] rounded-lg flex items-center justify-center gap-2 transition-all duration-150 hover:border-line-strong active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 max-w-lg text-center opacity-60">
          <p className="font-sans text-sm text-ink-soft italic">
            Experience technical precision. AIEval Pro utilizes secure LLM evaluation frameworks.
          </p>
        </div>
      </main>

      <footer className="relative z-10 w-full h-16 flex items-center justify-center border-t border-line bg-canvas/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-display text-accent font-bold tracking-tight text-sm">AIEval Pro</span>
          <span className="h-1 w-1 rounded-full bg-line-strong" />
          <span className="font-mono text-ink-mute text-[11px]">V.2.4.0-CORE</span>
        </div>
      </footer>
    </div>
  );
}
