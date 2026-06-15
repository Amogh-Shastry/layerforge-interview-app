"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Minimal Web Speech API typings (not in the DOM lib by default) ────────────

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionOptions {
  /** Called once the speaker goes quiet (or stop() is called) with the full utterance. */
  onUtterance?: (text: string) => void;
  /** Called continuously with the in-progress (interim + final) transcript. */
  onInterim?: (text: string) => void;
  /** Milliseconds of silence after speech before the utterance is considered complete. */
  silenceMs?: number;
  lang?: string;
}

export interface SpeechRecognitionController {
  supported: boolean;
  listening: boolean;
  /** Begin a fresh listening turn (clears any prior buffer). */
  start: () => void;
  /** End the current turn now and emit whatever was captured. */
  stop: () => void;
  /** Hard-stop without emitting. */
  cancel: () => void;
}

/**
 * Web Speech API wrapper tuned for interview turn-taking:
 *  - shows live interim text via onInterim
 *  - auto-completes a turn after `silenceMs` of quiet via onUtterance
 *  - resilient to the engine auto-ending (auto-restarts while a turn is active)
 */
export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): SpeechRecognitionController {
  const { onUtterance, onInterim, silenceMs = 2200, lang = "en-US" } = opts;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wantListeningRef = useRef(false);
  const finalTextRef = useRef("");
  const latestRef = useRef(""); // best-known transcript incl. interim (for manual submit)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emittedRef = useRef(false);

  // Keep latest callbacks without re-creating the recognition instance.
  const onUtteranceRef = useRef(onUtterance);
  const onInterimRef = useRef(onInterim);
  const silenceMsRef = useRef(silenceMs);
  useEffect(() => {
    onUtteranceRef.current = onUtterance;
    onInterimRef.current = onInterim;
    silenceMsRef.current = silenceMs;
  }, [onUtterance, onInterim, silenceMs]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const emit = useCallback(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    wantListeningRef.current = false;
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    // Prefer finalized text; fall back to the latest interim so a manual
    // "Done" press never loses what the candidate just said.
    const text = (finalTextRef.current.trim() || latestRef.current.trim()).trim();
    setListening(false);
    if (text) onUtteranceRef.current?.(text);
  }, [clearSilenceTimer]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let finalAppend = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0]?.transcript ?? "";
        if (res.isFinal) finalAppend += txt + " ";
        else interim += txt;
      }
      if (finalAppend) finalTextRef.current += finalAppend;
      const combined = (finalTextRef.current + interim).trim();
      if (combined) {
        latestRef.current = combined;
        onInterimRef.current?.(combined);
      }

      // Reset the silence countdown on any speech activity.
      clearSilenceTimer();
      if (combined) {
        silenceTimerRef.current = setTimeout(() => emit(), silenceMsRef.current);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // "no-speech" / "aborted" are routine; ignore. Others stop the turn.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      // The engine stops periodically; restart if the turn is still active.
      if (wantListeningRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantListeningRef.current = false;
      clearSilenceTimer();
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, [lang, clearSilenceTimer, emit]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    finalTextRef.current = "";
    latestRef.current = "";
    emittedRef.current = false;
    wantListeningRef.current = true;
    clearSilenceTimer();
    try {
      recognition.start();
      setListening(true);
    } catch {
      // Already running — restart cleanly.
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
      setTimeout(() => {
        try {
          recognition.start();
          setListening(true);
        } catch {
          /* noop */
        }
      }, 150);
    }
  }, [clearSilenceTimer]);

  const stop = useCallback(() => {
    emit();
  }, [emit]);

  const cancel = useCallback(() => {
    emittedRef.current = true;
    wantListeningRef.current = false;
    clearSilenceTimer();
    finalTextRef.current = "";
    setListening(false);
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
  }, [clearSilenceTimer]);

  return { supported, listening, start, stop, cancel };
}
