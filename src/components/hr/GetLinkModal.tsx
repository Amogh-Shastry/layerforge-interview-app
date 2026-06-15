"use client";

import { useEffect, useState } from "react";

interface Position {
  id: string;
  title: string;
  requiredSkills: string[];
}

interface GetLinkModalProps {
  open: boolean;
  onClose: () => void;
  presetPositionId?: string;
}

// HR picks a position and gets ONE public interview link to share with any number
// of candidates. Candidates identify themselves when they open it — no per-candidate
// scheduling needed.
export function GetLinkModal({ open, onClose, presetPositionId }: GetLinkModalProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionId, setPositionId] = useState(presetPositionId ?? "");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setOrigin(window.location.origin);
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => {
        setPositions(d.positions ?? []);
        setPositionId(presetPositionId ?? d.positions?.[0]?.id ?? "");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const selected = positions.find((p) => p.id === positionId);
  const link = positionId ? `${origin}/interview/start/${positionId}` : "";

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
            <span className="material-symbols-outlined text-[#adc6ff]">link</span>
            Share Interview Link
          </h2>
          <button onClick={onClose} className="text-[#c2c6d6] hover:text-[#d4e4fa]"><span className="material-symbols-outlined">close</span></button>
        </div>

        {positions.length === 0 ? (
          <p className="font-sans text-sm text-[#ffb4ab]/80">No positions yet — create one on the Pools page first.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Position</label>
              <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none">
                {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              {selected && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.requiredSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded font-mono text-[10px] text-[#adc6ff]">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Public interview link</label>
              <div className="flex items-center gap-2 bg-[#0d1c2d] border border-white/10 rounded-lg p-2">
                <input readOnly value={link} className="flex-1 bg-transparent font-mono text-xs text-[#d4e4fa] outline-none px-2" />
                <button onClick={copy} className="px-3 py-1.5 bg-[#adc6ff] text-[#002e6a] font-mono text-[11px] font-bold rounded-md">{copied ? "Copied!" : "Copy"}</button>
              </div>
              <p className="font-sans text-xs text-[#c2c6d6]/50 mt-2">Share this with any candidate. They enter their own details and start — results appear automatically on your dashboard.</p>
            </div>

            <a href={link} target="_blank" rel="noreferrer" className="block text-center px-4 py-2.5 border border-white/10 text-[#d4e4fa] font-mono text-[13px] rounded-lg hover:bg-white/5 transition-all">
              Preview candidate view
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
