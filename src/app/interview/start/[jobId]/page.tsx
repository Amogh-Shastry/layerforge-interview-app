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
      <div className="min-h-screen flex items-center justify-center bg-[#051424]">
        <span className="material-symbols-outlined text-[#adc6ff] text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (notFound || !position) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#051424] text-center px-4 gap-3">
        <span className="material-symbols-outlined text-[#c2c6d6]/40 text-5xl">link_off</span>
        <h1 className="font-display text-xl text-[#d4e4fa]">This interview link is no longer active</h1>
        <p className="font-sans text-sm text-[#c2c6d6]/60">Please contact the hiring team for an updated link.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen overflow-x-hidden selection:bg-[#adc6ff]/30">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10">
        <div className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">AIEval Pro</div>
        <span className="font-mono text-[13px] text-[#c2c6d6]/60">Candidate Interview</span>
      </header>

      <main className="pt-24 pb-20 flex flex-col items-center px-4 md:px-12 relative">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#adc6ff]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="glass-panel w-full max-w-2xl rounded-xl p-8 flex flex-col relative z-10">
          <div className="text-center mb-6">
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-full">
              <span className="w-2 h-2 bg-[#adc6ff] rounded-full active-pulse" />
              <span className="font-mono text-[11px] text-[#adc6ff] uppercase tracking-widest">AI Interview</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-[#d4e4fa] mb-2 tracking-tight font-semibold">{position.title}</h1>
            <p className="font-sans text-base text-[#c2c6d6] max-w-md mx-auto leading-relaxed">{position.description}</p>
          </div>

          {/* Role info */}
          {(position.companyIntro || position.requirements || position.expectations) && (
            <div className="bg-[#adc6ff]/5 rounded-lg p-4 border border-[#adc6ff]/15 mb-6 space-y-3">
              {position.companyIntro && <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{position.companyIntro}</p>}
              {position.requirements && (
                <div>
                  <span className="font-mono text-[10px] text-[#c2c6d6]/50 uppercase">Requirements</span>
                  <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{position.requirements}</p>
                </div>
              )}
              {position.expectations && (
                <div>
                  <span className="font-mono text-[10px] text-[#c2c6d6]/50 uppercase">What success looks like</span>
                  <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{position.expectations}</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          <div className="mb-6">
            <h3 className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase mb-2">What you&apos;ll be asked about</h3>
            <div className="flex flex-wrap gap-2">
              {position.requiredSkills.map((s) => (
                <span key={s} className="px-3 py-1 bg-[#273647] border border-white/10 rounded-lg font-mono text-[13px] text-[#d4e4fa]">{s}</span>
              ))}
            </div>
          </div>

          {/* Candidate self-intake */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Your Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30" />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Email <span className="text-[#c2c6d6]/30">(optional)</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30" />
            </div>
          </div>

          <p className="font-sans text-xs text-[#c2c6d6]/50 italic mb-4">
            Nova, our AI interviewer, will greet you, learn about your background, brief you on the role, then run a {position.requiredSkills.length}-topic interview by voice. It takes about 20–30 minutes.
          </p>

          {/* Consent */}
          <div className="mb-6 flex items-start gap-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
            <div className="mt-1 w-4 h-4 rounded border border-white/20 bg-[#273647] flex items-center justify-center flex-shrink-0" style={{ borderColor: agreed ? "#adc6ff" : undefined }}>
              {agreed && <span className="material-symbols-outlined text-[#adc6ff] text-xs">check</span>}
            </div>
            <label className="font-sans text-sm text-[#c2c6d6] select-none cursor-pointer leading-relaxed">
              I consent to this interview being recorded and analyzed by AI for evaluation, and to my responses being shared with the hiring team.
            </label>
          </div>

          {error && <p className="font-sans text-sm text-[#ffb4ab] mb-3">{error}</p>}

          <button
            onClick={start}
            disabled={!name.trim() || !agreed || starting}
            className={`h-12 rounded-lg font-mono text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              name.trim() && agreed && !starting ? "bg-[#adc6ff] text-[#002e6a] hover:brightness-110" : "bg-[#adc6ff]/40 text-[#002e6a]/60 cursor-not-allowed"
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
