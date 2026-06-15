"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/dashboard", label: "Candidates" },
  { href: "/interview/demo", label: "Interviews", active: true },
  { href: "/dashboard", label: "Analytics" },
];

interface Ctx {
  job: {
    title: string;
    description: string;
    companyIntro: string;
    requirements: string;
    expectations: string;
    requiredSkills: string[];
    durationMin: number;
  };
  attemptNumber: number;
  maxAttempts: number;
  candidateName?: string;
}

export default function InterviewLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agreed, setAgreed] = useState(false);
  const [ctx, setCtx] = useState<Ctx | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/interviews/${id}/context`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.job) setCtx(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const title = ctx?.job.title ?? "Senior Python Developer Interview";
  const description =
    ctx?.job.description ??
    "Technical assessment focused on high-concurrency systems and architectural decision-making.";
  const skills = ctx?.job.requiredSkills ?? ["Python", "System Design", "Problem Solving", "Communication"];
  const durationMin = ctx?.job.durationMin ?? 30;
  const attemptsLeft = ctx ? Math.max(0, ctx.maxAttempts - (ctx.attemptNumber - 1)) : 5;
  const companyIntro = ctx?.job.companyIntro ?? "";
  const requirements = ctx?.job.requirements ?? "";
  const expectations = ctx?.job.expectations ?? "";

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen overflow-x-hidden selection:bg-[#adc6ff]/30">
      <TopNav
        links={navLinks}
        rightSlot={
          <div className="flex items-center gap-3">
            <button className="font-mono text-[13px] text-[#c2c6d6]/60 hover:text-[#adc6ff] transition-colors px-2 py-1">
              Support
            </button>
            <span className="material-symbols-outlined text-[#c2c6d6]/60 hover:text-[#adc6ff] cursor-pointer transition-colors">
              notifications
            </span>
            <span className="material-symbols-outlined text-[#c2c6d6]/60 hover:text-[#adc6ff] cursor-pointer transition-colors">
              settings
            </span>
            <div className="w-8 h-8 rounded-full bg-[#adc6ff]/20 border border-white/10 flex items-center justify-center text-[#adc6ff] text-sm font-bold">
              {ctx?.candidateName ? ctx.candidateName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "SC"}
            </div>
          </div>
        }
      />

      <main className="pt-24 pb-20 flex flex-col items-center justify-center min-h-screen px-4 md:px-12 relative">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#adc6ff]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#adc6ff]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="glass-panel w-full max-w-2xl rounded-xl p-8 flex flex-col relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-full">
              <span className="w-2 h-2 bg-[#adc6ff] rounded-full active-pulse" />
              <span className="font-mono text-[11px] text-[#adc6ff] uppercase tracking-widest">Active</span>
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-[#d4e4fa] mb-2 tracking-tight font-semibold">
              {title}
            </h1>
            <p className="font-sans text-base text-[#c2c6d6] max-w-md leading-relaxed">{description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 py-4 border-y border-white/5">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase">Duration</span>
              <div className="flex items-center gap-1 mt-1 text-[#d4e4fa]">
                <span className="material-symbols-outlined text-[#adc6ff] text-base">schedule</span>
                <span className="font-mono text-[13px]">{durationMin} mins</span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase">Attempts</span>
              <div className="flex items-center gap-1 mt-1 text-[#d4e4fa]">
                <span className="material-symbols-outlined text-[#adc6ff] text-base">replay</span>
                <span className="font-mono text-[13px]">{attemptsLeft}/{ctx?.maxAttempts ?? 5} Left</span>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase">Format</span>
              <div className="flex items-center gap-1 mt-1 text-[#d4e4fa]">
                <span className="material-symbols-outlined text-[#adc6ff] text-base">videocam</span>
                <span className="font-mono text-[13px]">Voice + AI</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase mb-2">Core Competencies</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-[#273647] border border-white/10 rounded-lg font-mono text-[13px] text-[#d4e4fa]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {(companyIntro || requirements || expectations) && (
            <div className="bg-[#adc6ff]/5 rounded-lg p-4 border border-[#adc6ff]/15 mb-8 space-y-3">
              <h3 className="font-mono text-[11px] text-[#adc6ff] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                About this role
              </h3>
              {companyIntro && <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{companyIntro}</p>}
              {requirements && (
                <div>
                  <span className="font-mono text-[10px] text-[#c2c6d6]/50 uppercase">Requirements</span>
                  <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{requirements}</p>
                </div>
              )}
              {expectations && (
                <div>
                  <span className="font-mono text-[10px] text-[#c2c6d6]/50 uppercase">What success looks like</span>
                  <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">{expectations}</p>
                </div>
              )}
              <p className="font-sans text-xs text-[#c2c6d6]/50 italic pt-1">
                Nova will introduce the company, learn about your background, brief you on the role, then begin the interview.
              </p>
            </div>
          )}

          <div className="bg-[#0d1c2d] rounded-lg p-4 border border-white/5 mb-8">
            <h3 className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Recommended Setup
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "browser_updated", label: "Chrome" },
                { icon: "volume_off", label: "Quiet Env" },
                { icon: "headphones", label: "Earphones" },
                { icon: "light_mode", label: "Lighting" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                  <span className="material-symbols-outlined text-[#a4c9ff] text-2xl">{item.icon}</span>
                  <span className="font-mono text-[11px] text-[#d4e4fa]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 flex items-start gap-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
            <div className="mt-1 w-4 h-4 rounded border border-white/20 bg-[#273647] flex items-center justify-center flex-shrink-0 transition-colors" style={{ borderColor: agreed ? "#adc6ff" : undefined }}>
              {agreed && <span className="material-symbols-outlined text-[#adc6ff] text-xs">check</span>}
            </div>
            <label className="font-sans text-sm text-[#c2c6d6] select-none cursor-pointer leading-relaxed">
              I acknowledge that this session will be recorded for evaluation purposes and I agree to the{" "}
              <a href="#" className="text-[#adc6ff] hover:underline underline-offset-4" onClick={(e) => e.stopPropagation()}>
                Terms &amp; Conditions
              </a>{" "}
              and Privacy Policy.
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Link
              href={agreed ? `/interview/${id}/screen-share` : "#"}
              className={`flex-1 h-12 rounded-lg font-mono text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 ${
                agreed
                  ? "bg-[#adc6ff] text-[#002e6a] hover:brightness-110"
                  : "bg-[#adc6ff]/40 text-[#002e6a]/60 cursor-not-allowed"
              }`}
            >
              Start Interview
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <button className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 font-mono text-[13px] text-[#d4e4fa] h-12 rounded-lg transition-all active:scale-95">
              View Past Attempts
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-8 opacity-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">AI Moderated</span>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
