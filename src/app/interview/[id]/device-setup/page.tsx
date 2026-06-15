"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "camera" | "microphone" | "speaker";

const steps: { key: Step; icon: string; label: string }[] = [
  { key: "camera", icon: "videocam", label: "Camera Test" },
  { key: "microphone", icon: "mic", label: "Microphone Test" },
  { key: "speaker", icon: "volume_up", label: "Speaker Test" },
];

const waveformDelays = [0.1, 0.3, 0.2, 0.5, 0.4, 0.1, 0.6, 0.3, 0.2, 0.5, 0.4, 0.1, 0.6, 0.3, 0.2, 0.5, 0.4, 0.1, 0.6, 0.3];

export default function DeviceSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [speakerConfirmed, setSpeakerConfirmed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const stepKey = steps[currentStep].key;

  useEffect(() => {
    if (stepKey === "camera" || stepKey === "microphone") {
      navigator.mediaDevices
        .getUserMedia({ video: stepKey === "camera", audio: stepKey === "microphone" })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
          if (stepKey === "microphone") setMicActive(true);
        })
        .catch(() => {});
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [currentStep, stepKey]);

  function playTestAudio() {
    setIsPlayingAudio(true);
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 2);
    setTimeout(() => setIsPlayingAudio(false), 2500);
  }

  function goNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push(`/interview/${id}/ready`);
    }
  }

  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="bg-[#050816] text-[#d4e4fa] min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10">
        <div className="font-display text-xl font-bold text-[#adc6ff] tracking-tight">AIEval Pro</div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[13px] text-[#c2c6d6]/60">Candidate Setup</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-32 px-4 md:px-12 mx-auto w-full max-w-6xl">
        {/* Progress indicator */}
        <div className="w-full max-w-4xl mb-8">
          <div className="flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute top-5 left-0 w-full h-[1px] bg-white/10 -z-10" />
            {/* Active line */}
            <div
              className="absolute top-5 left-0 h-[1px] bg-[#adc6ff] transition-all duration-500 -z-10"
              style={{ width: `${progressPercent}%` }}
            />
            {steps.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      done
                        ? "bg-[#4edea3]/20 border border-[#4edea3] text-[#4edea3]"
                        : active
                        ? "bg-[#adc6ff] text-[#002e6a] ring-4 ring-[#adc6ff]/20"
                        : "bg-[#1c2b3c] border border-white/10 text-[#c2c6d6]/40"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {done ? "check" : step.icon}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[13px] ${
                      done ? "text-[#4edea3]" : active ? "text-[#adc6ff]" : "text-[#c2c6d6]/40"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Visual Feed */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Camera / preview */}
            <div className="glass-panel rounded-xl overflow-hidden relative aspect-video">
              {stepKey === "camera" || stepKey === "microphone" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover grayscale-[0.3]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0d1c2d]">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <span className="material-symbols-outlined text-[#adc6ff] text-6xl">hearing</span>
                    <p className="font-sans text-[#c2c6d6] text-sm">Speaker Test</p>
                  </div>
                </div>
              )}

              {/* Face detection overlay (camera step) */}
              {stepKey === "camera" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 face-outline pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#adc6ff] glow-pulse absolute top-10" />
                </div>
              )}

              {/* HUD */}
              <div className="absolute top-4 left-4">
                <div className="bg-[#051424]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                  <span className="font-mono text-[11px] text-[#d4e4fa]">LIVE FEED</span>
                </div>
              </div>

              {stepKey === "camera" && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="bg-[#051424]/60 backdrop-blur-md p-3 rounded-lg border border-white/10 flex flex-col gap-2 min-w-[140px]">
                    <span className="font-mono text-[11px] text-[#c2c6d6]">LIGHTING QUALITY</span>
                    <div className="flex gap-1 h-1.5 w-full">
                      <div className="flex-grow bg-[#4edea3] rounded-full" />
                      <div className="flex-grow bg-[#4edea3] rounded-full" />
                      <div className="flex-grow bg-[#4edea3] rounded-full" />
                      <div className="flex-grow bg-white/10 rounded-full" />
                    </div>
                    <span className="font-mono text-[11px] text-[#4edea3]">Optimal</span>
                  </div>
                  <div className="bg-[#051424]/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                    <span className="font-mono text-[11px] text-[#c2c6d6] block mb-1">STABILITY</span>
                    <span className="font-mono text-[13px] text-[#adc6ff]">98.4%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mic visualizer (microphone step) */}
            {stepKey === "microphone" && (
              <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#adc6ff]/10 flex items-center justify-center text-[#adc6ff] border border-[#adc6ff]/20">
                  <span className="material-symbols-outlined material-filled">mic</span>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-mono text-[13px]">Microphone Detection</span>
                    <span className="font-mono text-[11px] text-[#4edea3] uppercase">
                      {micActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-end gap-0.5 h-8">
                    {waveformDelays.map((delay, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#adc6ff] rounded-full waveform-bar"
                        style={{ animationDelay: `${delay}s`, height: "60%" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 h-full">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-xl font-medium text-[#d4e4fa]">Audio &amp; Video Setup</h2>
                <p className="font-sans text-base text-[#c2c6d6]/80">
                  Ensure your hardware is correctly configured for the proctored interview environment.
                </p>
              </div>
              <div className="h-[1px] bg-white/5 w-full" />

              {/* Device selectors */}
              {(stepKey === "camera" || stepKey === "microphone") && (
                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[13px] text-[#c2c6d6] px-1">Hardware Setup</label>
                  {[
                    { icon: "videocam", label: "FaceTime HD Camera" },
                    { icon: "mic", label: "Built-in Microphone" },
                    { icon: "volume_up", label: "External Speakers" },
                  ].map((device) => (
                    <div
                      key={device.label}
                      className="flex items-center gap-2 px-3 py-2.5 glass-panel rounded-lg cursor-pointer hover:border-[#adc6ff]/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[#adc6ff] text-[20px]">{device.icon}</span>
                      <span className="font-sans text-sm flex-1 truncate">{device.label}</span>
                      <span className="material-symbols-outlined text-[#c2c6d6] text-[18px]">expand_more</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Speaker test */}
              {stepKey === "speaker" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#adc6ff]">hearing</span>
                    <h3 className="font-mono text-[13px] text-[#d4e4fa] uppercase tracking-wider">Speaker Test</h3>
                  </div>
                  <div className="bg-[#0d1c2d] border border-white/5 p-4 rounded-lg flex flex-col gap-4">
                    <p className="font-sans text-sm text-[#c2c6d6]">
                      Click the button below to play a short chime. Confirm you can hear it clearly.
                    </p>
                    <button
                      onClick={playTestAudio}
                      disabled={isPlayingAudio}
                      className="group flex items-center justify-center gap-3 py-3 px-6 bg-[#273647] hover:bg-[#2c3a4c] border border-white/10 rounded-lg transition-all duration-200"
                    >
                      <span className="material-symbols-outlined text-[#adc6ff] group-active:scale-90 transition-transform">
                        {isPlayingAudio ? "graphic_eq" : "play_circle"}
                      </span>
                      <span className="font-mono text-[13px] text-[#d4e4fa]">
                        {isPlayingAudio ? "Playing..." : "Play Sample Audio"}
                      </span>
                    </button>
                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSpeakerConfirmed(!speakerConfirmed)}>
                      <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-colors" style={{ borderColor: speakerConfirmed ? "#adc6ff" : undefined }}>
                        {speakerConfirmed && <span className="material-symbols-outlined text-[#adc6ff] text-xs">check</span>}
                      </div>
                      <span className="font-sans text-base text-[#d4e4fa] group-hover:text-[#adc6ff] transition-colors">
                        I heard the sound clearly
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-4">
                <div className="bg-[#adc6ff]/5 border border-[#adc6ff]/20 p-4 rounded-lg flex gap-3">
                  <span className="material-symbols-outlined text-[#adc6ff] text-xl">info</span>
                  <p className="font-sans text-sm text-[#c2c6d6]/90 leading-relaxed">
                    AI-driven proctoring requires a stable 2Mbps connection. Face must remain within the detection outline at all times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 left-0 w-full z-50 px-6 md:px-12 py-4 bg-[#051424]/60 backdrop-blur-2xl border-t border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep((s) => s - 1) : router.back()}
            className="px-8 py-3 rounded-lg border border-white/10 text-[#c2c6d6] font-mono text-[13px] hover:bg-white/5 transition-all active:scale-95"
          >
            Back
          </button>
          <div className="flex items-center gap-4">
            <span className="hidden md:block font-mono text-[11px] text-[#c2c6d6]/40">Ready to proceed to assessment</span>
            <button
              onClick={goNext}
              disabled={stepKey === "speaker" && !speakerConfirmed}
              className="px-10 py-3 rounded-lg bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold shadow-lg shadow-[#adc6ff]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
