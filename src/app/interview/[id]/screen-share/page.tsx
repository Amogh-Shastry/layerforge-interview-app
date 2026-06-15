"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

interface ScreenShareState {
  screenSharing: boolean;
  audioEnabled: boolean;
  loading: boolean;
  success: boolean;
}

export default function ScreenSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<ScreenShareState>({
    screenSharing: false,
    audioEnabled: false,
    loading: false,
    success: false,
  });

  async function handleShareScreen() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const isEntireScreen = videoTrack?.getSettings().displaySurface === "monitor";
      const hasAudio = stream.getAudioTracks().length > 0;

      if (!isEntireScreen) {
        stream.getTracks().forEach((t) => t.stop());
        alert("Please share your Entire Screen, not a window or tab.");
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      setState({
        screenSharing: true,
        audioEnabled: hasAudio,
        loading: false,
        success: true,
      });

      // Navigate after brief confirmation
      setTimeout(() => {
        router.push(`/interview/${id}/device-setup`);
      }, 1200);
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Background shaders */}
      <div className="fixed inset-0 -z-10 bg-canvas">
        <div className="absolute top-1/4 -right-1/4 w-[50vw] h-[50vw] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -left-1/4 w-[50vw] h-[50vw] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Modal */}
      <div className="glass-panel w-full max-w-3xl rounded-xl overflow-hidden flex flex-col relative">
        {/* Glow */}
        <div className="absolute -top-16 -left-16 w-[150px] h-[150px] bg-accent/10 blur-[40px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
              Share Your Entire Screen
            </h1>
            <p className="font-sans text-base text-ink-mute mt-2 max-w-xl">
              Please share your entire screen with system audio enabled to continue the interview.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-ink-soft hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-4 flex-1">
          {/* Illustration */}
          <div className="relative bg-surface rounded-lg border border-line aspect-video overflow-hidden flex items-center justify-center mb-4 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent" />

            {/* Faux screen share dialog */}
            <div className="relative z-10 w-3/4 max-w-md bg-surface shadow-2xl rounded-lg border border-line p-4 transition-transform group-hover:scale-[1.02] duration-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent material-filled">screen_share</span>
                <span className="font-mono text-[13px] uppercase tracking-wider text-ink-soft">Browser Request</span>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full mb-3" />
              <div className="h-2 w-2/3 bg-surface-2 rounded-full mb-6" />
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="aspect-video bg-accent/20 rounded border border-accent/40 flex items-center justify-center ring-2 ring-accent/50">
                  <span className="material-symbols-outlined text-accent text-xl">monitor</span>
                </div>
                <div className="aspect-video bg-surface-2 rounded border border-line" />
                <div className="aspect-video bg-surface-2 rounded border border-line" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 bg-accent/40 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-accent rounded-full" />
                  </div>
                  <span className="font-mono text-[11px] text-ink-soft">Share Audio</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-6 bg-surface-2 rounded" />
                  <div className="w-16 h-6 bg-accent/40 rounded" />
                </div>
              </div>
            </div>

            {/* Status chips */}
            <div className="absolute bottom-4 left-4 flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-2/80 backdrop-blur rounded-full border border-line">
                <span className="material-symbols-outlined text-success text-sm material-filled">check_circle</span>
                <span className="font-mono text-[11px] text-ink">Camera Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-2/80 backdrop-blur rounded-full border border-line">
                <span className="material-symbols-outlined text-success text-sm material-filled">check_circle</span>
                <span className="font-mono text-[11px] text-ink">Mic Verified</span>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-lg flex items-center gap-4 transition-all hover:bg-surface-2-hover group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${state.screenSharing ? "bg-success/20 text-success" : "bg-danger/20 text-danger"} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">
                  {state.screenSharing ? "screen_share" : "desktop_access_disabled"}
                </span>
              </div>
              <div>
                <div className="font-mono text-[13px] text-ink">Screen Permission</div>
                <div className="font-sans text-sm text-ink-mute">
                  {state.screenSharing ? "Entire screen shared" : "Not currently sharing"}
                </div>
              </div>
              <div className="ml-auto">
                <span className={`material-symbols-outlined ${state.screenSharing ? "text-success" : "text-danger"}`}>
                  {state.screenSharing ? "check_circle" : "pending"}
                </span>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-lg flex items-center gap-4 transition-all hover:bg-surface-2-hover group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${state.audioEnabled ? "bg-success/20 text-success" : "bg-surface-2 text-ink-soft"} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">volume_up</span>
              </div>
              <div>
                <div className="font-mono text-[13px] text-ink">System Audio</div>
                <div className="font-sans text-sm text-ink-mute">
                  {state.audioEnabled ? "Audio captured" : "Required for playbacks"}
                </div>
              </div>
              <div className="ml-auto">
                <span className={`material-symbols-outlined ${state.audioEnabled ? "text-success" : "text-ink-mute"}`}>
                  {state.audioEnabled ? "check_circle" : "remove_circle_outline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent rounded-full animate-ai-pulse" />
            <p className="font-mono text-[11px] text-ink-soft">AIEval Security Protocol: v2.4.0</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push(`/interview/${id}/device-setup`)}
              className="flex-1 sm:flex-none px-6 h-11 border border-line rounded-lg font-mono text-[13px] text-ink hover:bg-surface-2-hover transition-all"
            >
              Skip for now
            </button>
            <button
              onClick={handleShareScreen}
              disabled={state.loading || state.success}
              className="flex-1 sm:flex-none px-8 h-11 bg-accent text-on-accent rounded-lg font-mono text-[13px] font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {state.success ? (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  Success
                </>
              ) : state.loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">screen_share</span>
                  Share Screen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
