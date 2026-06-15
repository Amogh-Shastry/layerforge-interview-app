"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

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

// Split a (possibly partial) text into [completeSentences, remainder].
function extractSentences(buffer: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  const regex = /[^.!?]+[.!?]+(\s|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(buffer)) !== null) {
    sentences.push(match[0].trim());
    lastIndex = regex.lastIndex;
  }
  return { sentences, rest: buffer.slice(lastIndex) };
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

  const setPhaseSafe = useCallback((p: SessionPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const pushTurn = useCallback((speaker: "Nova" | "Candidate", text: string) => {
    setTranscript((prev) => [...prev, { speaker, text, timestamp: fmt(elapsedRef.current) }]);
  }, []);

  // Synthesize one chunk → returns a player function that resolves when done.
  const synthesize = useCallback(async (text: string): Promise<() => Promise<void>> => {
    if (!text.trim()) return async () => {};
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        return () =>
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
          });
      }
    } catch {
      /* fall through */
    }
    // Browser speechSynthesis fallback.
    return () =>
      new Promise<void>((resolve) => {
        if (endedRef.current) return resolve();
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          return setTimeout(resolve, Math.min(6000, 500 + text.length * 45));
        }
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.04;
        utter.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /female|samantha|jenny|aria|zira/i.test(v.name)) ??
          voices.find((v) => v.lang?.startsWith("en"));
        if (preferred) utter.voice = preferred;
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.speak(utter);
      });
  }, []);

  const processQueue = useCallback(async () => {
    if (queueActiveRef.current) return;
    queueActiveRef.current = true;
    if (!endedRef.current) setPhaseSafe("speaking");

    let prefetch: Promise<() => Promise<void>> | null = null;
    while (!endedRef.current) {
      let player: (() => Promise<void>) | null = null;
      if (prefetch) {
        player = await prefetch;
        prefetch = null;
      } else if (speechQueueRef.current.length) {
        player = await synthesize(speechQueueRef.current.shift()!);
      } else {
        break;
      }
      // Prefetch the next chunk's audio while this one plays.
      if (speechQueueRef.current.length) {
        prefetch = synthesize(speechQueueRef.current.shift()!);
      }
      await player();
    }
    if (prefetch && !endedRef.current) {
      const p = await prefetch;
      await p();
    }
    queueActiveRef.current = false;
  }, [synthesize, setPhaseSafe]);

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
        setAiCaption(text);
        extractSentences(text + " ").sentences.forEach(enqueueSpeech);
        return text;
      }

      try {
        const res = await fetch(`/api/interviews/${interviewId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesRef.current, start }),
        });

        if (!res.ok || !res.body) {
          scriptedRef.current = true;
          setScripted(true);
          const text = start ? SCRIPTED_INTRO : SCRIPTED_QUESTIONS[scriptIdxRef.current++ % SCRIPTED_QUESTIONS.length];
          setAiCaption(text);
          extractSentences(text + " ").sentences.forEach(enqueueSpeech);
          return text;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let buffer = "";
        setAiCaption("");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          buffer += chunk;
          if (!endedRef.current) setAiCaption(full);
          const { sentences, rest } = extractSentences(buffer);
          if (sentences.length) {
            sentences.forEach(enqueueSpeech);
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
        setAiCaption(text);
        extractSentences(text + " ").sentences.forEach(enqueueSpeech);
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

      const text = await generateReply(start);
      if (endedRef.current) return;

      messagesRef.current.push({ role: "assistant", content: text });
      pushTurn("Nova", text);
      setAiCaption(text);

      await waitForSpeechDrain();
      if (endedRef.current) return;

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

  const recognition = useSpeechRecognition({
    onUtterance: handleUtterance,
    onInterim: (t) => {
      if (!endedRef.current) setInterim(t);
    },
    silenceMs: 1800,
  });

  const startListening = useCallback(() => {
    if (endedRef.current) return;
    setPhaseSafe("listening");
    setInterim("");
    if (micEnabledRef.current && recognition.supported) {
      recognition.start();
    }
  }, [recognition, setPhaseSafe]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

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
    if (recognition.listening) {
      recognition.stop();
    } else if (interim.trim()) {
      handleUtterance(interim);
    }
  }, [recognition, interim, handleUtterance]);

  const submitText = useCallback(
    (text: string) => {
      if (phaseRef.current !== "listening") return;
      recognition.cancel();
      handleUtterance(text);
    },
    [recognition, handleUtterance]
  );

  const setMicEnabled = useCallback(
    (on: boolean) => {
      micEnabledRef.current = on;
      setMicEnabledState(on);
      if (!on) {
        recognition.cancel();
        setInterim("");
      } else if (phaseRef.current === "listening" && recognition.supported) {
        recognition.start();
      }
    },
    [recognition]
  );

  const end = useCallback((): TurnLine[] => {
    endedRef.current = true;
    setPhaseSafe("ended");
    speechQueueRef.current = [];
    recognition.cancel();
    try {
      audioRef.current?.pause();
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    return transcript;
  }, [recognition, transcript, setPhaseSafe]);

  useEffect(() => {
    return () => {
      endedRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    phase,
    transcript,
    aiCaption,
    interim,
    elapsed,
    error,
    voiceSupported: recognition.supported,
    micEnabled,
    scripted,
    begin,
    stopAndSubmit,
    submitText,
    setMicEnabled,
    end,
  };
}
