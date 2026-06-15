"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/utils";
import { useInterviewSession, type SessionPhase } from "@/hooks/useInterviewSession";

const phaseLabel: Record<SessionPhase, string> = {
  idle: "Ready",
  connecting: "Connecting…",
  speaking: "Nova is speaking",
  listening: "Listening to you",
  thinking: "Nova is thinking…",
  ended: "Interview ended",
};

export default function LiveInterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const session = useInterviewSession(id);
  const [started, setStarted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [typed, setTyped] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const aiSpeaking = session.phase === "speaking";
  const listening = session.phase === "listening";
  const thinking = session.phase === "thinking" || session.phase === "connecting";

  // Candidate camera feed.
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Auto-scroll the transcript log.
  useEffect(() => {
    transcriptScrollRef.current?.scrollTo({ top: transcriptScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session.transcript, session.interim, session.aiCaption]);

  const handleStart = useCallback(() => {
    setStarted(true);
    // Mark the interview in-progress (best-effort; appears under Live Sessions).
    fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS", startedAt: new Date().toISOString() }),
    }).catch(() => {});
    session.begin();
  }, [session, id]);

  const toggleCam = useCallback(() => {
    setCamOn((prev) => {
      const next = !prev;
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const endInterview = useCallback(() => {
    const turns = session.end();
    try {
      sessionStorage.setItem(`interview:${id}:transcript`, JSON.stringify(turns));
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/interview/${id}/processing`);
  }, [session, id, router]);

  return (
    <div className="bg-[#051424] text-[#d4e4fa] h-screen flex flex-col overflow-hidden selection:bg-[#adc6ff]/30">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">AIEval Pro</h1>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse" />
              <span className="font-mono text-[13px] text-[#c2c6d6] uppercase tracking-widest">Recording</span>
            </div>
            <span className="font-mono text-[13px] text-[#adc6ff] bg-[#adc6ff]/10 px-3 py-1 rounded-full">
              {formatDuration(session.elapsed)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#c2c6d6]/80">
            <span className={`w-2 h-2 rounded-full ${thinking ? "bg-[#adc6ff] animate-pulse" : listening ? "bg-[#4edea3] animate-pulse" : "bg-[#c2c6d6]/40"}`} />
            <span className="font-mono text-[11px] uppercase tracking-wider">{phaseLabel[session.phase]}</span>
          </div>
          {session.scripted && (
            <span className="hidden md:inline font-mono text-[10px] text-[#ffb4ab]/80 uppercase tracking-wider border border-[#ffb4ab]/20 rounded px-2 py-0.5">
              Offline demo mode
            </span>
          )}
        </div>
      </header>

      {/* Main Interview Canvas */}
      <main className="flex-1 relative mt-16 px-4 md:px-12 py-4 flex flex-col items-center justify-center overflow-hidden">
        {/* AI Recruiter — Primary View */}
        <div className={`relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden glass-panel transition-all duration-500 ${aiSpeaking ? "active-speaker-ring" : ""}`}>
          <div className="absolute inset-0 flex items-center justify-center bg-[#010f1f]/50">
            <div className={`absolute w-[300px] h-[300px] bg-[#adc6ff]/10 rounded-full blur-3xl ${aiSpeaking ? "ai-glow-pulse" : ""}`} />
            {aiSpeaking && (
              <div className="absolute w-[200px] h-[200px] border border-[#adc6ff]/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
            )}

            <div className="relative flex flex-col items-center">
              <div className={`w-48 h-48 rounded-full border-2 p-1 bg-[#1c2b3c] transition-all duration-300 ${aiSpeaking ? "border-[#adc6ff] shadow-[0_0_50px_rgba(173,198,255,0.35)]" : "border-[#adc6ff]/40 shadow-[0_0_30px_rgba(173,198,255,0.15)]"}`}>
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0267b8] to-[#010f1f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#adc6ff] text-8xl material-filled">smart_toy</span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h2 className="font-display text-xl text-[#adc6ff]">AI Associate &apos;Nova&apos;</h2>
                {aiSpeaking && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="w-1 h-3 bg-[#adc6ff]/80 rounded-full animate-bounce" />
                    <span className="w-1 h-5 bg-[#adc6ff] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 h-3 bg-[#adc6ff]/80 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="ml-2 font-mono text-[13px] text-[#c2c6d6]">Speaking…</span>
                  </div>
                )}
                {thinking && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[#adc6ff] animate-spin text-base">progress_activity</span>
                    <span className="font-mono text-[13px] text-[#c2c6d6]">{session.phase === "connecting" ? "Connecting…" : "Thinking…"}</span>
                  </div>
                )}
                {listening && (
                  <div className="flex items-center justify-center gap-1 mt-1 h-5">
                    {[0.1, 0.3, 0.2, 0.4, 0.15].map((d, i) => (
                      <span key={i} className="w-1 bg-[#4edea3] rounded-full waveform-bar" style={{ animationDelay: `${d}s`, height: "40%" }} />
                    ))}
                    <span className="ml-2 font-mono text-[13px] text-[#4edea3]">Listening…</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute top-5 left-5 flex items-center gap-2 bg-[#051424]/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">verified</span>
            <span className="font-mono text-[13px]">Technical Interviewer</span>
          </div>
        </div>

        {/* Candidate Inset View — top-right so it never overlaps the captions */}
        <div className="absolute top-20 right-4 md:right-12 w-40 md:w-60 aspect-video rounded-xl overflow-hidden glass-panel shadow-2xl z-30 transition-transform">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all duration-300 ${camOn ? "grayscale-[20%]" : "opacity-0"}`} />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d1c2d]">
              <span className="material-symbols-outlined text-[#c2c6d6]/40 text-4xl">videocam_off</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-[#adc6ff]/20 backdrop-blur-sm p-1 rounded">
            <span className="material-symbols-outlined text-[#adc6ff] text-[14px]">{session.micEnabled ? "mic" : "mic_off"}</span>
          </div>
          <div className="absolute bottom-3 left-3 bg-[#051424]/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono border border-white/5 uppercase tracking-wider">
            You
          </div>
        </div>

        {/* Live caption — a single clean panel pinned above the footer */}
        {captionsOn && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-20 pointer-events-none">
            {aiSpeaking || thinking ? (
              <div className="bg-[#051424]/85 backdrop-blur-md rounded-xl border border-[#adc6ff]/20 px-5 py-3 shadow-2xl">
                <span className="font-mono text-[10px] text-[#adc6ff] uppercase tracking-widest">Nova</span>
                <p className="font-sans text-base md:text-lg text-[#d4e4fa] leading-snug mt-1">
                  {session.aiCaption || "…"}
                </p>
              </div>
            ) : listening && session.voiceSupported ? (
              <div className="bg-[#051424]/85 backdrop-blur-md rounded-xl border border-[#4edea3]/20 px-5 py-3 shadow-2xl">
                <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-widest">You</span>
                <p className="font-sans text-base md:text-lg text-[#d4e4fa] leading-snug mt-1 min-h-[1.5rem]">
                  {session.interim || <span className="text-[#c2c6d6]/50 italic">Start speaking when you&apos;re ready…</span>}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Bottom Controls */}
      <footer className="w-full bg-[#1c2b3c]/90 backdrop-blur-lg border-t border-white/10 min-h-20 px-4 md:px-12 flex items-center justify-between z-50 py-3 gap-4">
        <div className="hidden lg:flex flex-col flex-shrink-0">
          <span className="font-mono text-[13px] text-[#d4e4fa] font-bold">Live Interview</span>
          <span className="font-mono text-[11px] text-[#c2c6d6]/60 uppercase">Session: {id}</span>
        </div>

        {/* Center: turn controls */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 justify-center">
          <button
            onClick={() => session.setMicEnabled(!session.micEnabled)}
            title={session.micEnabled ? "Mute microphone" : "Unmute microphone"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group active:scale-90 border ${
              session.micEnabled ? "bg-[#273647] border-white/10 hover:bg-[#2c3a4c]" : "bg-[#ffb4ab]/20 border-[#ffb4ab]/30"
            }`}
          >
            <span className={`material-symbols-outlined ${session.micEnabled ? "text-[#d4e4fa] group-hover:text-[#adc6ff]" : "text-[#ffb4ab]"} transition-colors`}>
              {session.micEnabled ? "mic" : "mic_off"}
            </span>
          </button>
          <button
            onClick={toggleCam}
            title={camOn ? "Turn camera off" : "Turn camera on"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group active:scale-90 border ${
              camOn ? "bg-[#273647] border-white/10 hover:bg-[#2c3a4c]" : "bg-[#ffb4ab]/20 border-[#ffb4ab]/30"
            }`}
          >
            <span className={`material-symbols-outlined ${camOn ? "text-[#d4e4fa] group-hover:text-[#adc6ff]" : "text-[#ffb4ab]"} transition-colors`}>
              {camOn ? "videocam" : "videocam_off"}
            </span>
          </button>
          <button
            onClick={() => setCaptionsOn((c) => !c)}
            title="Toggle captions"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group active:scale-90 border ${
              captionsOn ? "bg-[#adc6ff]/20 border-[#adc6ff]/30" : "bg-[#273647] border-white/10"
            }`}
          >
            <span className={`material-symbols-outlined ${captionsOn ? "text-[#adc6ff]" : "text-[#d4e4fa] group-hover:text-[#adc6ff]"} transition-colors`}>
              closed_caption
            </span>
          </button>

          {/* Done answering — only meaningful while listening */}
          <button
            onClick={session.stopAndSubmit}
            disabled={!listening}
            className="px-5 h-12 rounded-full bg-[#4edea3] text-[#003824] font-mono text-[13px] font-bold hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#4edea3]/20 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span className="hidden sm:inline">Done Answering</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={endInterview}
            className="px-6 h-12 rounded-full bg-[#ffb4ab] text-[#690005] font-mono text-[13px] font-bold hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#ffb4ab]/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span className="hidden sm:inline">End Interview</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {session.voiceSupported ? (
            <span className="font-mono text-[11px] text-[#c2c6d6]/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#4edea3]">graphic_eq</span>
              Voice ready
            </span>
          ) : (
            <span className="font-mono text-[11px] text-[#ffb4ab]/70 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">keyboard</span>
              Type to answer
            </span>
          )}
        </div>
      </footer>

      {/* Typed-answer fallback (no Web Speech API) */}
      {listening && !session.voiceSupported && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typed.trim()) {
                  session.submitText(typed.trim());
                  setTyped("");
                }
              }}
              placeholder="Type your answer and press Enter…"
              className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-[#d4e4fa] placeholder:text-[#c2c6d6]/40"
            />
            <button
              onClick={() => {
                if (typed.trim()) {
                  session.submitText(typed.trim());
                  setTyped("");
                }
              }}
              className="px-4 h-9 rounded-lg bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Start overlay — required for audio autoplay + clear entry point */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#010f1f]/80 backdrop-blur-md px-4">
          <div className="glass-panel rounded-2xl p-8 md:p-12 max-w-md text-center flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#adc6ff]/20 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#0267b8] to-[#010f1f] border-2 border-[#adc6ff]/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#adc6ff] text-5xl material-filled">smart_toy</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-[#d4e4fa]">Meet Nova</h2>
              <p className="font-sans text-sm text-[#c2c6d6] leading-relaxed">
                Nova will speak each question out loud. Answer naturally with your voice — when you pause, Nova listens and responds. Make sure your sound is on.
              </p>
            </div>
            <button
              onClick={handleStart}
              className="w-full px-8 py-4 bg-[#adc6ff] text-[#002e6a] font-display text-lg font-medium rounded-xl hover:shadow-[0_0_24px_rgba(173,198,255,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">graphic_eq</span>
              Start Interview
            </button>
            <p className="font-mono text-[10px] text-[#c2c6d6]/40 uppercase tracking-wider">Best experienced in Chrome with headphones</p>
          </div>
        </div>
      )}
    </div>
  );
}
