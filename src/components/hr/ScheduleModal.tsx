"use client";

import { useEffect, useState } from "react";

interface Position {
  id: string;
  title: string;
  requiredSkills: string[];
}

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  presetPositionId?: string;
  onScheduled?: () => void;
}

export function ScheduleModal({ open, onClose, presetPositionId, onScheduled }: ScheduleModalProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionId, setPositionId] = useState(presetPositionId ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLink(null);
    setError(null);
    setCopied(false);
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => {
        setPositions(d.positions ?? []);
        if (!positionId && d.positions?.[0]) setPositionId(presetPositionId ?? d.positions[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const selected = positions.find((p) => p.id === positionId);

  async function submit() {
    if (!positionId || !name.trim()) {
      setError("Pick a position and enter the candidate's name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, candidateName: name.trim(), candidateEmail: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      const fullLink = `${window.location.origin}${data.link}`;
      setLink(fullLink);
      onScheduled?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#010f1f]/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-lg p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-[#d4e4fa] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#adc6ff]">event_available</span>
            Schedule Interview
          </h2>
          <button onClick={onClose} className="text-[#c2c6d6] hover:text-[#d4e4fa]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {link ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-[#4edea3]">
              <span className="material-symbols-outlined material-filled">check_circle</span>
              <span className="font-mono text-sm">Interview scheduled for {name}</span>
            </div>
            <p className="font-sans text-sm text-[#c2c6d6]/80">
              Share this link with the candidate. Nova will interview them on the{" "}
              <span className="text-[#adc6ff]">{selected?.title}</span> skills.
            </p>
            <div className="flex items-center gap-2 bg-[#0d1c2d] border border-white/10 rounded-lg p-2">
              <input readOnly value={link} className="flex-1 bg-transparent font-mono text-xs text-[#d4e4fa] outline-none px-2" />
              <button onClick={copy} className="px-3 py-1.5 bg-[#adc6ff] text-[#002e6a] font-mono text-[11px] font-bold rounded-md">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={link} target="_blank" rel="noreferrer" className="flex-1 text-center px-4 py-2.5 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold rounded-lg hover:brightness-110 transition-all">
                Open Interview
              </a>
              <button onClick={() => { setLink(null); setName(""); setEmail(""); }} className="flex-1 px-4 py-2.5 border border-white/10 text-[#d4e4fa] font-mono text-[13px] rounded-lg hover:bg-white/5 transition-all">
                Schedule Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Position</label>
              {positions.length === 0 ? (
                <p className="font-sans text-sm text-[#ffb4ab]/80">No positions yet — create one on the Pools page first.</p>
              ) : (
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none"
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              )}
              {selected && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.requiredSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded font-mono text-[10px] text-[#adc6ff]">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Candidate Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Rivera"
                className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Candidate Email <span className="text-[#c2c6d6]/30">(optional)</span></label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30"
              />
            </div>
            {error && <p className="font-sans text-sm text-[#ffb4ab]">{error}</p>}
            <button
              onClick={submit}
              disabled={submitting || positions.length === 0}
              className="w-full px-4 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Scheduling…</>
              ) : (
                <><span className="material-symbols-outlined text-sm">link</span> Generate Interview Link</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
