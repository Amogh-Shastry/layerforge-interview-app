"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Position {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  requirements: string;
  expectations: string;
  requiredSkills: string[];
  experienceMin: number;
}

export default function StartInterviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();

  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/positions/${jobId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d?.position) setPosition(d.position);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [jobId]);

  async function start() {
    if (!name.trim() || !agreed) {
      setError("Enter your name and accept the consent to continue.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId: jobId, candidateName: name.trim(), candidateEmail: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the interview");
      router.push(`/interview/${data.interview.id}/screen-share`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <span className="material-symbols-outlined text-accent text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (notFound || !position) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-center px-4 gap-3">
        <span className="material-symbols-outlined text-ink-mute text-5xl">link_off</span>
        <h1 className="font-display text-xl text-ink">This interview link is no longer active</h1>
        <p className="font-sans text-sm text-ink-mute">Please contact the hiring team for an updated link.</p>
      </div>
    );
  }

  return (
    <div className="bg-canvas text-ink min-h-screen overflow-x-hidden selection:bg-accent/30">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-canvas/80 backdrop-blur-xl border-b border-line">
        <div className="font-display text-xl font-bold text-accent tracking-tight">AIEval Pro</div>
        <span className="font-mono text-[13px] text-ink-mute">Candidate Interview</span>
      </header>

      <main className="pt-24 pb-20 flex flex-col items-center px-4 md:px-12 relative">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="glass-panel w-full max-w-2xl rounded-xl p-8 flex flex-col relative z-10">
          <div className="text-center mb-6">
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
              <span className="w-2 h-2 bg-accent rounded-full active-pulse" />
              <span className="font-mono text-[11px] text-accent uppercase tracking-widest">AI Interview</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-ink mb-2 tracking-tight font-semibold">{position.title}</h1>
            <p className="font-sans text-base text-ink-soft max-w-md mx-auto leading-relaxed">{position.description}</p>
          </div>

          {/* Role info */}
          {(position.companyIntro || position.requirements || position.expectations) && (
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/15 mb-6 space-y-3">
              {position.companyIntro && <p className="font-sans text-sm text-ink-soft leading-relaxed">{position.companyIntro}</p>}
              {position.requirements && (
                <div>
                  <span className="font-mono text-[10px] text-ink-mute uppercase">Requirements</span>
                  <p className="font-sans text-sm text-ink-soft leading-relaxed">{position.requirements}</p>
                </div>
              )}
              {position.expectations && (
                <div>
                  <span className="font-mono text-[10px] text-ink-mute uppercase">What success looks like</span>
                  <p className="font-sans text-sm text-ink-soft leading-relaxed">{position.expectations}</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          <div className="mb-6">
            <h3 className="font-mono text-[11px] text-ink-mute uppercase mb-2">What you&apos;ll be asked about</h3>
            <div className="flex flex-wrap gap-2">
              {position.requiredSkills.map((s) => (
                <span key={s} className="px-3 py-1 bg-surface-2 border border-line rounded-lg font-mono text-[13px] text-ink">{s}</span>
              ))}
            </div>
          </div>

          {/* Candidate self-intake */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="font-mono text-[11px] text-ink-mute uppercase block mb-2">Your Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full bg-surface border border-line rounded-lg py-2.5 px-3 text-sm focus:border-accent focus:outline-none placeholder:text-ink-mute" />
            </div>
            <div>
              <label className="font-mono text-[11px] text-ink-mute uppercase block mb-2">Email <span className="text-ink-mute">(optional)</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-surface border border-line rounded-lg py-2.5 px-3 text-sm focus:border-accent focus:outline-none placeholder:text-ink-mute" />
            </div>
          </div>

          <p className="font-sans text-xs text-ink-mute italic mb-4">
            Nova, our AI interviewer, will greet you, learn about your background, brief you on the role, then run a {position.requiredSkills.length}-topic interview by voice. It takes about 20–30 minutes.
          </p>

          {/* Consent */}
          <div className="mb-6 flex items-start gap-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
            <div className="mt-1 w-4 h-4 rounded border border-line-strong bg-surface-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: agreed ? "var(--accent)" : undefined }}>
              {agreed && <span className="material-symbols-outlined text-accent text-xs">check</span>}
            </div>
            <label className="font-sans text-sm text-ink-soft select-none cursor-pointer leading-relaxed">
              I consent to this interview being recorded and analyzed by AI for evaluation, and to my responses being shared with the hiring team.
            </label>
          </div>

          {error && <p className="font-sans text-sm text-danger mb-3">{error}</p>}

          <button
            onClick={start}
            disabled={!name.trim() || !agreed || starting}
            className={`h-12 rounded-lg font-mono text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              name.trim() && agreed && !starting ? "bg-accent text-on-accent hover:bg-accent-hover" : "bg-accent/40 text-on-accent/60 cursor-not-allowed"
            }`}
          >
            {starting ? (
              <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Starting…</>
            ) : (
              <>Start Interview <span className="material-symbols-outlined text-base">arrow_forward</span></>
            )}
          </button>
        </div>

        <div className="mt-8 flex gap-8 opacity-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">mic</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">Voice Interview · Chrome recommended</span>
          </div>
        </div>
      </main>
    </div>
  );
}
