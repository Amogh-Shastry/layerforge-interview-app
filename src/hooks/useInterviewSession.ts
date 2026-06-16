"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SessionPhase = "idle" | "connecting" | "speaking" | "listening" | "thinking" | "ended";

export interface TurnLine {
  speaker: "Nova" | "Candidate";
  text: string;
  timestamp: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Fallback used only when the AI endpoint is unavailable (no OPENAI_API_KEY).
const SCRIPTED_INTRO =
  "Hi, I'm Nova, your AI interviewer for today. This will be a relaxed conversation — just think out loud and take your time. To start, could you briefly introduce yourself and what you're currently working on?";
const SCRIPTED_QUESTIONS = [
  "Thanks for that. Can you walk me through a technically challenging project you led, and what made it difficult?",
  "How did you approach designing that for scale and reliability?",
  "What would you do differently if you rebuilt it today?",
  "Tell me about a production issue that surprised you. How did you diagnose and resolve it?",
  "How do you decide between adding a cache, an index, or restructuring a query when something is slow?",
  "Last one — what kind of team and problems do you most want to work on next, and why?",
];

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Detect Nova's closing remarks so the meeting can auto-end. The interview
// system prompt has Nova thank the candidate and say the interview is complete
// and the report will be shared — these phrases are specific to that close.
function isClosingStatement(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\binterview is (now |all )?(complete|completed|over|finished|concluded|done)\b/.test(t) ||
    /\b(this|that) (concludes|wraps up|brings us to the end of|is the end of)\b/.test(t) ||
    /\breport will be (shared|sent|provided|passed)\b/.test(t) ||
    /\b(shared?|sent) (it )?(with|to) (the|our) (hiring|recruit|interview)/.test(t) ||
    /\bwe'?ll be in touch\b/.test(t)
  );
}

// Split a (possibly partial) text into speakable chunks + remainder. Breaks on
// sentence enders, and also on a clause break (, ; : —) once the clause is long
// enough — so Nova can start talking a clause sooner and pacing stays smooth,
// without chopping up short phrases.
function extractSpeakable(buffer: string): { chunks: string[]; rest: string } {
  const chunks: string[] = [];
  let start = 0;
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i];
    const next = buffer[i + 1];
    const atBoundary = next === undefined || /\s/.test(next);
    if (!atBoundary) continue;
    const seg = buffer.slice(start, i + 1).trim();
    if (!seg) continue;
    const isSentenceEnd = /[.!?]/.test(ch);
    const isClause = /[,;:—–]/.test(ch) && seg.length >= 60;
    if (isSentenceEnd || isClause) {
      chunks.push(seg);
      start = i + 1;
    }
  }
  return { chunks, rest: buffer.slice(start) };
}

export interface InterviewSession {
  phase: SessionPhase;
  transcript: TurnLine[];
  aiCaption: string;
  interim: string;
  elapsed: number;
  error: string | null;
  voiceSupported: boolean;
  micEnabled: boolean;
  scripted: boolean;
  /** True once Nova has delivered the closing remarks — the meeting can auto-end. */
  complete: boolean;
  begin: () => void;
  stopAndSubmit: () => void;
  submitText: (text: string) => void;
  setMicEnabled: (on: boolean) => void;
  end: () => TurnLine[];
}

export function useInterviewSession(interviewId: string): InterviewSession {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [transcript, setTranscript] = useState<TurnLine[]>([]);
  const [aiCaption, setAiCaption] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error] = useState<string | null>(null);
  const [micEnabled, setMicEnabledState] = useState(true);
  const [scripted, setScripted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [complete, setComplete] = useState(false);

  const messagesRef = useRef<ChatMessage[]>([]);
  const endedRef = useRef(false);
  const startedRef = useRef(false);
  const elapsedRef = useRef(0);
  const micEnabledRef = useRef(true);
  const scriptedRef = useRef(false);
  const scriptIdxRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef<SessionPhase>("idle");

  // Speech pipeline: a queue of sentences fetched + played in order, with the
  // next chunk prefetched while the current one plays for near-gapless audio.
  const speechQueueRef = useRef<string[]>([]);
  const queueActiveRef = useRef(false);
  // Caption text revealed so far for the current Nova turn (kept in sync with audio).
  const spokenRef = useRef("");

  // ── Voice capture (MediaRecorder → /api/stt Whisper, with silence auto-submit) ──
  const voiceSupportedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const capturingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const setPhaseSafe = useCallback((p: SessionPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const pushTurn = useCallback((speaker: "Nova" | "Candidate", text: string) => {
    setTranscript((prev) => [...prev, { speaker, text, timestamp: fmt(elapsedRef.current) }]);
  }, []);

  // Reveal a spoken chunk in the caption, in sync with its audio starting.
  const revealCaption = useCallback((text: string) => {
    if (endedRef.current) return;
    spokenRef.current = spokenRef.current ? `${spokenRef.current} ${text}` : text;
    setAiCaption(spokenRef.current);
  }, []);

  // Speak a chunk with the browser's on-device synthesizer — instant, no
  // network, no cold start.
  const speakBrowser = useCallback((text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (endedRef.current) return resolve();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setTimeout(resolve, Math.min(5000, 350 + text.length * 35));
        return;
      }
      try {
        window.speechSynthesis.resume();
      } catch {
        /* noop */
      }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /natural|female|samantha|jenny|aria|zira/i.test(v.name)) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
      if (preferred) u.voice = preferred;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  // Synthesize one chunk → returns { text, play }. Default voice is the instant
  // on-device synthesizer. Set NEXT_PUBLIC_USE_OPENAI_TTS=true to use OpenAI TTS
  // (higher quality, but a network round-trip per chunk).
  const synthesize = useCallback(
    async (text: string): Promise<{ text: string; play: () => Promise<void> }> => {
      const t = text.trim();
      if (!t) return { text, play: async () => {} };

      if (process.env.NEXT_PUBLIC_USE_OPENAI_TTS === "true") {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: t }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            return {
              text,
              play: () =>
                new Promise<void>((resolve) => {
                  if (endedRef.current) return resolve();
                  const audio = new Audio(url);
                  audioRef.current = audio;
                  audio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                  };
                  audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                  };
                  audio.play().catch(() => resolve());
                }),
            };
          }
        } catch {
          /* fall back to browser speech */
        }
      }

      return { text, play: () => speakBrowser(t) };
    },
    [speakBrowser]
  );

  const processQueue = useCallback(async () => {
    if (queueActiveRef.current) return;
    queueActiveRef.current = true;
    if (!endedRef.current) setPhaseSafe("speaking");

    let prefetch: Promise<{ text: string; play: () => Promise<void> }> | null = null;
    while (!endedRef.current) {
      let item: { text: string; play: () => Promise<void> } | null = null;
      if (prefetch) {
        item = await prefetch;
        prefetch = null;
      } else if (speechQueueRef.current.length) {
        item = await synthesize(speechQueueRef.current.shift()!);
      } else {
        break;
      }
      // Prefetch the next chunk's audio while this one plays (gapless).
      if (speechQueueRef.current.length) {
        prefetch = synthesize(speechQueueRef.current.shift()!);
      }
      // Caption is revealed exactly when this chunk's audio starts → in sync.
      revealCaption(item.text);
      await item.play();
    }
    if (prefetch && !endedRef.current) {
      const p = await prefetch;
      revealCaption(p.text);
      await p.play();
    }
    queueActiveRef.current = false;
  }, [synthesize, setPhaseSafe, revealCaption]);

  const enqueueSpeech = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      speechQueueRef.current.push(t);
      void processQueue();
    },
    [processQueue]
  );

  const waitForSpeechDrain = useCallback(async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (endedRef.current) return resolve();
        if (!queueActiveRef.current && speechQueueRef.current.length === 0) return resolve();
        setTimeout(check, 120);
      };
      check();
    });
  }, []);

  // Stream a reply from the AI, enqueuing each complete sentence for speech as
  // it arrives (so Nova starts talking before the full reply is generated).
  const generateReply = useCallback(
    async (start: boolean): Promise<string> => {
      if (scriptedRef.current) {
        const text = start ? SCRIPTED_INTRO : SCRIPTED_QUESTIONS[scriptIdxRef.current++ % SCRIPTED_QUESTIONS.length];
        extractSpeakable(text + " ").chunks.forEach(enqueueSpeech);
        return text;
      }

      try {
        // Don't let a cold/slow API hang the interview — fall back to scripted.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(`/api/interviews/${interviewId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesRef.current, start }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok || !res.body) {
          scriptedRef.current = true;
          setScripted(true);
          const text = start ? SCRIPTED_INTRO : SCRIPTED_QUESTIONS[scriptIdxRef.current++ % SCRIPTED_QUESTIONS.length];
          extractSpeakable(text + " ").chunks.forEach(enqueueSpeech);
          return text;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          buffer += chunk;
          const { chunks, rest } = extractSpeakable(buffer);
          if (chunks.length) {
            chunks.forEach(enqueueSpeech);
            buffer = rest;
          }
        }
        const tail = buffer.trim();
        if (tail) enqueueSpeech(tail);
        return full.trim();
      } catch {
        scriptedRef.current = true;
        setScripted(true);
        const text = start ? SCRIPTED_INTRO : SCRIPTED_QUESTIONS[scriptIdxRef.current++ % SCRIPTED_QUESTIONS.length];
        extractSpeakable(text + " ").chunks.forEach(enqueueSpeech);
        return text;
      }
    },
    [interviewId, enqueueSpeech]
  );

  const startListeningRef = useRef<() => void>(() => {});

  const aiTurn = useCallback(
    async (start: boolean) => {
      if (endedRef.current) return;
      setPhaseSafe(start ? "connecting" : "thinking");
      setInterim("");
      spokenRef.current = "";
      setAiCaption("");

      const text = await generateReply(start);
      if (endedRef.current) return;

      messagesRef.current.push({ role: "assistant", content: text });
      pushTurn("Nova", text);

      await waitForSpeechDrain();
      if (endedRef.current) return;

      // If Nova just delivered the closing remarks, end the meeting instead of
      // listening for another answer. (Never on the opening turn.)
      if (!start && messagesRef.current.length >= 4 && isClosingStatement(text)) {
        setComplete(true);
        return;
      }

      startListeningRef.current();
    },
    [generateReply, pushTurn, waitForSpeechDrain, setPhaseSafe]
  );

  const handleUtterance = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (endedRef.current) return;
      if (!clean) {
        startListeningRef.current();
        return;
      }
      messagesRef.current.push({ role: "user", content: clean });
      pushTurn("Candidate", clean);
      setInterim("");
      void aiTurn(false);
    },
    [aiTurn, pushTurn]
  );

  // ── Capture engine ───────────────────────────────────────────────────────────

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      typeof MediaRecorder !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    voiceSupportedRef.current = ok;
    setVoiceSupported(ok);
  }, []);

  const pickMime = useCallback((): string => {
    if (typeof MediaRecorder === "undefined") return "";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
    return "";
  }, []);

  const teardownMonitor = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      void audioCtxRef.current?.close();
    } catch {
      /* noop */
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  // Stop recording, transcribe via Whisper, return the text.
  const transcribeCurrent = useCallback(async (): Promise<string> => {
    const rec = recorderRef.current;
    if (!rec) return "";
    const mime = rec.mimeType || "audio/webm";
    const done = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    try {
      rec.stop();
    } catch {
      /* noop */
    }
    await done;
    recorderRef.current = null;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (!chunks.length) return "";
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
    const blob = new Blob(chunks, { type: mime });
    if (blob.size < 1200) return ""; // effectively silence
    const form = new FormData();
    form.append("audio", blob, `answer.${ext}`);
    try {
      const res = await fetch("/api/stt", { method: "POST", body: form });
      if (!res.ok) return "";
      const data = await res.json();
      return typeof data.text === "string" ? data.text.trim() : "";
    } catch {
      return "";
    }
  }, []);

  const finishAndSubmit = useCallback(() => {
    if (!capturingRef.current) return;
    capturingRef.current = false;
    teardownMonitor();
    setPhaseSafe("thinking");
    void (async () => {
      const text = await transcribeCurrent();
      if (endedRef.current) return;
      if (text) handleUtterance(text);
      else startListeningRef.current(); // heard nothing — listen again
    })();
  }, [teardownMonitor, transcribeCurrent, handleUtterance, setPhaseSafe]);

  const finishAndSubmitRef = useRef(finishAndSubmit);
  useEffect(() => {
    finishAndSubmitRef.current = finishAndSubmit;
  }, [finishAndSubmit]);

  const startCapture = useCallback(async () => {
    if (!voiceSupportedRef.current || !micEnabledRef.current) return;
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      }
      if (endedRef.current || phaseRef.current !== "listening") return;
      const stream = streamRef.current;

      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      recorderRef.current = rec;
      capturingRef.current = true;

      // Silence detection → auto-submit when the candidate stops talking.
      try {
        const Ctor: typeof AudioContext =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor();
        audioCtxRef.current = ctx;
        void ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const SPEAK = 16; // avg byte level that counts as speech
        const SILENCE_MS = 1900; // quiet time after speech → end of turn
        const MIN_SPEAK_MS = 350;
        let spoke = false;
        let speakStart = 0;
        let lastVoice = performance.now();

        const tick = () => {
          if (!analyserRef.current || phaseRef.current !== "listening" || !capturingRef.current) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;
          const now = performance.now();
          if (avg > SPEAK) {
            if (!spoke) {
              spoke = true;
              speakStart = now;
            }
            lastVoice = now;
          } else if (spoke && now - lastVoice > SILENCE_MS && now - speakStart > MIN_SPEAK_MS) {
            finishAndSubmitRef.current();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        /* no silence detection — the "Done Answering" button still submits */
      }
    } catch {
      // Mic blocked/denied — typed input remains the guaranteed fallback.
      capturingRef.current = false;
    }
  }, [pickMime]);

  const stopCapture = useCallback(() => {
    capturingRef.current = false;
    teardownMonitor();
    try {
      recorderRef.current?.stop();
    } catch {
      /* noop */
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, [teardownMonitor]);

  const startListening = useCallback(() => {
    if (endedRef.current) return;
    setPhaseSafe("listening");
    setInterim("");
    void startCapture();
  }, [startCapture, setPhaseSafe]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Warm up the speech-synthesis voice list (it loads asynchronously).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
  }, []);

  // Elapsed timer.
  useEffect(() => {
    if (phase === "idle" || phase === "ended") return;
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const begin = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    endedRef.current = false;
    void aiTurn(true);
  }, [aiTurn]);

  const stopAndSubmit = useCallback(() => {
    if (phaseRef.current !== "listening") return;
    finishAndSubmit();
  }, [finishAndSubmit]);

  const submitText = useCallback(
    (text: string) => {
      if (phaseRef.current !== "listening") return;
      stopCapture();
      handleUtterance(text);
    },
    [stopCapture, handleUtterance]
  );

  const setMicEnabled = useCallback(
    (on: boolean) => {
      micEnabledRef.current = on;
      setMicEnabledState(on);
      if (!on) {
        stopCapture();
        setInterim("");
      } else if (phaseRef.current === "listening") {
        void startCapture();
      }
    },
    [stopCapture, startCapture]
  );

  const end = useCallback((): TurnLine[] => {
    endedRef.current = true;
    setPhaseSafe("ended");
    speechQueueRef.current = [];
    stopCapture();
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    streamRef.current = null;
    try {
      audioRef.current?.pause();
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    return transcript;
  }, [transcript, setPhaseSafe, stopCapture]);

  useEffect(() => {
    return () => {
      endedRef.current = true;
      stopCapture();
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopCapture]);

  return {
    phase,
    transcript,
    aiCaption,
    interim,
    elapsed,
    error,
    voiceSupported,
    micEnabled,
    scripted,
    complete,
    begin,
    stopAndSubmit,
    submitText,
    setMicEnabled,
    end,
  };
}
