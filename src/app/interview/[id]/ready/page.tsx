"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function InterviewReadyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="bg-canvas text-ink min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-canvas/80 backdrop-blur-xl border-b border-line shadow-sm">
        <div className="font-display text-xl font-bold text-accent tracking-tight">AIEval Pro</div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[13px] text-ink-mute">Interviewer Setup</span>
          <button className="material-symbols-outlined text-ink-mute hover:text-accent transition-colors">
            settings
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 md:px-12 max-w-[1440px] mx-auto min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Left: Device preview and selectors */}
          <section className="flex flex-col gap-4">
            <div className="relative group aspect-video rounded-xl overflow-hidden glass-card">
              {/* Camera placeholder */}
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center opacity-60">
                  <span className="material-symbols-outlined text-accent text-6xl">videocam</span>
                  <span className="font-mono text-[13px] text-ink-soft">CAMERA PREVIEW</span>
                </div>
              </div>
              {/* Controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-accent/20 transition-all">
                    <span className="material-symbols-outlined text-accent">videocam</span>
                  </button>
                  <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-accent/20 transition-all">
                    <span className="material-symbols-outlined text-accent">mic</span>
                  </button>
                </div>
                <div className="px-3 py-1.5 rounded-full glass-panel flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                  <span className="font-mono text-[11px] text-ink">Signal Good</span>
                </div>
              </div>
            </div>

            {/* Device selectors */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[13px] text-ink-soft px-1">Hardware Setup</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { icon: "videocam", label: "FaceTime HD Cam" },
                  { icon: "mic", label: "Shure SM7B Mic" },
                  { icon: "volume_up", label: "External Speakers" },
                ].map((device) => (
                  <div
                    key={device.label}
                    className="flex items-center gap-2 px-3 py-2.5 glass-panel rounded-lg cursor-pointer hover:border-accent/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-accent text-[20px]">{device.icon}</span>
                    <span className="font-sans text-sm flex-1 truncate">{device.label}</span>
                    <span className="material-symbols-outlined text-ink-soft text-[18px]">expand_more</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Welcome & AI Profile */}
          <section className="flex flex-col justify-center space-y-8 lg:pl-8">
            <div className="space-y-3">
              <h1 className="font-display text-3xl md:text-4xl text-ink tracking-tight font-semibold leading-tight">
                You&apos;re all set for<br className="hidden md:block" /> the interview.
              </h1>
              <p className="font-sans text-lg text-ink-soft max-w-lg leading-relaxed">
                Our AI evaluator is ready to meet you. Please ensure you are in a quiet environment and have your ID ready.
              </p>
            </div>

            {/* AI Profile Card */}
            <div className="glass-card rounded-xl p-4 ai-glow border border-accent/20 bg-accent/5 relative">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/40">
                    <div className="w-full h-full bg-gradient-to-br from-accent to-canvas flex items-center justify-center">
                      <span className="material-symbols-outlined text-accent text-3xl material-filled">smart_toy</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-canvas rounded-full flex items-center justify-center border border-line">
                    <div className="w-2.5 h-2.5 bg-success rounded-full animate-ai-pulse" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-xl text-accent">Interviewer: Nova</h3>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-success bg-success/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      { icon: "psychology", text: "Human-like natural conversation" },
                      { icon: "query_stats", text: "Real-time technical evaluation" },
                      { icon: "rebase_edit", text: "Adaptive questioning based on your answers" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-2 text-ink-soft">
                        <span className="material-symbols-outlined text-[18px] text-accent">{item.icon}</span>
                        <span className="font-sans text-sm">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => router.push(`/interview/${id}/room`)}
                className="px-8 py-4 bg-accent text-on-accent font-display text-xl font-medium rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
              >
                Join Interview
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <button className="px-8 py-4 glass-panel text-ink font-sans text-base rounded-xl hover:bg-surface-2-hover transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">help_outline</span>
                Support
              </button>
            </div>

            <p className="font-mono text-[11px] text-ink-mute italic">
              By clicking Join Interview, you agree to the recording and AI-driven analysis of your session for evaluation purposes.
            </p>
          </section>
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-surface-2/90 backdrop-blur-lg border-t border-line rounded-t-xl shadow-lg">
        {[
          { icon: "home", label: "Home", href: "/" },
          { icon: "videocam", label: "Session", href: "#", active: true },
          { icon: "account_circle", label: "Profile", href: "#" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center ${item.active ? "text-accent scale-110" : "text-ink-soft hover:text-accent"} transition-all`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-mono text-[11px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
