"use client";

import { useEffect, useState } from "react";
import { HRShell } from "@/components/hr/HRShell";

interface Position {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  requirements: string;
  expectations: string;
  requiredSkills: string[];
  softSkills: string[];
  customQuestions: string[];
  experienceMin: number;
  interviewCount: number;
  completedCount: number;
  avgScore: number | null;
}

function TagInput({ label, hint, items, setItems, placeholder }: { label: string; hint?: string; items: string[]; setItems: (s: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !items.includes(v)) setItems([...items, v]);
    setDraft("");
  }
  return (
    <div>
      <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-1">{label}</label>
      {hint && <p className="font-sans text-[11px] text-[#c2c6d6]/40 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded font-mono text-[11px] text-[#adc6ff] max-w-full">
            <span className="truncate">{s}</span>
            <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="material-symbols-outlined text-[14px] hover:text-[#ffb4ab] flex-shrink-0">close</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#0d1c2d] border border-white/10 rounded-lg py-2 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30"
        />
        <button onClick={add} className="px-3 bg-white/5 border border-white/10 rounded-lg text-[#adc6ff] hover:bg-white/10 transition-all"><span className="material-symbols-outlined text-sm">add</span></button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <div>
      <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30 resize-none" />
    </div>
  );
}

function PositionFormModal({ open, onClose, onSaved, initial }: { open: boolean; onClose: () => void; onSaved: () => void; initial: Position | null }) {
  const [title, setTitle] = useState("");
  const [companyIntro, setCompanyIntro] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [expectations, setExpectations] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [experienceMin, setExperienceMin] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setCompanyIntro(initial?.companyIntro ?? "");
    setDescription(initial?.description ?? "");
    setRequirements(initial?.requirements ?? "");
    setExpectations(initial?.expectations ?? "");
    setRequiredSkills(initial?.requiredSkills ?? []);
    setSoftSkills(initial?.softSkills ?? []);
    setCustomQuestions(initial?.customQuestions ?? []);
    setExperienceMin(initial?.experienceMin ?? 0);
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  async function submit() {
    if (!title.trim() || requiredSkills.length === 0) {
      setError("Add a title and at least one required skill.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = { title: title.trim(), companyIntro, description, requirements, expectations, requiredSkills, softSkills, customQuestions, experienceMin };
    try {
      const res = await fetch(initial ? `/api/positions/${initial.id}` : "/api/positions", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save position");
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#010f1f]/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-2xl p-6 md:p-8 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-[#d4e4fa] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#adc6ff]">work</span>
            {initial ? "Edit Position" : "New Position"}
          </h2>
          <button onClick={onClose} className="text-[#c2c6d6] hover:text-[#d4e4fa]"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Position Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" className="w-full bg-[#0d1c2d] border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-[#adc6ff] focus:outline-none placeholder:text-[#c2c6d6]/30" />
          </div>

          <Field label="Company Intro" value={companyIntro} onChange={setCompanyIntro} placeholder="A short intro to your company — Nova shares this with the candidate at the start." />
          <Field label="Role Description" value={description} onChange={setDescription} placeholder="One-line summary of the role." rows={2} />
          <Field label="Requirements" value={requirements} onChange={setRequirements} placeholder="What the role requires — Nova briefs the candidate on this." />
          <Field label="Expectations" value={expectations} onChange={setExpectations} placeholder="What success looks like in this role." />

          <TagInput label="Required Skills" hint="Nova assesses each of these." items={requiredSkills} setItems={setRequiredSkills} placeholder="Type a skill, Enter to add" />
          <TagInput label="Soft Skills" items={softSkills} setItems={setSoftSkills} placeholder="Type a soft skill, Enter to add" />
          <TagInput label="Custom Questions" hint="Nova will ask each of these (and adapt with follow-ups)." items={customQuestions} setItems={setCustomQuestions} placeholder="Type a question, Enter to add" />

          <div>
            <label className="font-mono text-[11px] text-[#c2c6d6]/70 uppercase block mb-2">Minimum Experience: {experienceMin} yrs</label>
            <input type="range" min={0} max={15} value={experienceMin} onChange={(e) => setExperienceMin(Number(e.target.value))} className="w-full accent-[#adc6ff]" />
          </div>

          {error && <p className="font-sans text-sm text-[#ffb4ab]">{error}</p>}
          <button onClick={submit} disabled={submitting} className="w-full px-4 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving…</> : <><span className="material-symbols-outlined text-sm">{initial ? "save" : "add"}</span> {initial ? "Save Changes" : "Create Position"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PoolsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/positions").then((r) => r.json()).then((d) => setPositions(d.positions ?? [])).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/interview/start/${id}`).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function remove(id: string) {
    if (!confirm("Deactivate this position? Existing interviews are kept.")) return;
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    load();
  }

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(p: Position) { setEditing(p); setFormOpen(true); }

  const headerRight = (
    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 border border-[#adc6ff]/30 text-[#adc6ff] font-mono text-[12px] rounded-lg hover:bg-[#adc6ff]/10 transition-all">
      <span className="material-symbols-outlined text-sm">add</span>
      New Position
    </button>
  );

  return (
    <HRShell title="Pools" subtitle="Positions, role details, and the questions Nova asks" headerRight={headerRight} onScheduled={load}>
      {loading ? (
        <div className="p-16 text-center"><span className="material-symbols-outlined text-[#adc6ff] text-3xl animate-spin">progress_activity</span></div>
      ) : positions.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[#c2c6d6]/30 text-5xl">work_off</span>
          <p className="font-display text-lg text-[#d4e4fa]">No positions yet</p>
          <p className="font-sans text-sm text-[#c2c6d6]/60 max-w-sm">Create a position with the company intro, requirements, skills, and the questions Nova should ask.</p>
          <button onClick={openCreate} className="mt-2 px-6 py-3 bg-[#adc6ff] text-[#002e6a] font-mono text-[13px] font-bold rounded-lg">Create your first position</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {positions.map((p) => (
            <div key={p.id} className="glass-panel rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#d4e4fa]">{p.title}</h3>
                  <p className="font-mono text-[11px] text-[#c2c6d6]/50 mt-0.5">{p.experienceMin}+ yrs experience</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} title="Edit" className="text-[#c2c6d6]/40 hover:text-[#adc6ff] transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button onClick={() => remove(p.id)} title="Deactivate" className="text-[#c2c6d6]/40 hover:text-[#ffb4ab] transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              </div>

              <p className="font-sans text-sm text-[#c2c6d6]/70 leading-relaxed line-clamp-2">{p.description}</p>

              <div>
                <span className="font-mono text-[10px] text-[#c2c6d6]/50 uppercase">Skills assessed</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {p.requiredSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded font-mono text-[10px] text-[#adc6ff]">{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-[11px] text-[#c2c6d6]/50">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">quiz</span>{p.customQuestions.length} questions</span>
                {p.companyIntro && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">business</span>Intro set</span>}
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-center">
                <div><div className="font-display text-xl font-bold text-[#d4e4fa]">{p.interviewCount}</div><div className="font-mono text-[9px] text-[#c2c6d6]/50 uppercase">Interviews</div></div>
                <div><div className="font-display text-xl font-bold text-[#d4e4fa]">{p.completedCount}</div><div className="font-mono text-[9px] text-[#c2c6d6]/50 uppercase">Completed</div></div>
                <div><div className="font-display text-xl font-bold text-[#4edea3]">{p.avgScore ?? "—"}</div><div className="font-mono text-[9px] text-[#c2c6d6]/50 uppercase">Avg Score</div></div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => copyLink(p.id)} className="flex-1 px-4 py-2.5 bg-[#adc6ff] text-[#002e6a] font-mono text-[12px] font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">{copiedId === p.id ? "check" : "link"}</span>
                  {copiedId === p.id ? "Link Copied!" : "Copy Interview Link"}
                </button>
                <a href={`/interview/start/${p.id}`} target="_blank" rel="noreferrer" title="Preview candidate view" className="px-3 py-2.5 border border-white/10 text-[#d4e4fa] rounded-lg hover:bg-white/5 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <PositionFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSaved={load} />
    </HRShell>
  );
}
