"use client";

import { cn } from "@/lib/utils";

type Recommendation = "strong-hire" | "hire" | "borderline" | "no-hire";

const configs: Record<Recommendation, { label: string; icon: string; className: string }> = {
  "strong-hire": {
    label: "Strong Hire",
    icon: "star",
    className: "bg-success/10 border border-success/20 text-success",
  },
  hire: {
    label: "Hire",
    icon: "thumb_up",
    className: "bg-accent/10 border border-accent/20 text-accent",
  },
  borderline: {
    label: "Borderline",
    icon: "help",
    className: "bg-warning/10 border border-warning/20 text-warning",
  },
  "no-hire": {
    label: "No Hire",
    icon: "thumb_down",
    className: "bg-danger/10 border border-danger/20 text-danger",
  },
};

interface StatusChipProps {
  recommendation: Recommendation;
  className?: string;
}

export function StatusChip({ recommendation, className }: StatusChipProps) {
  const config = configs[recommendation];
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full w-fit", config.className, className)}>
      <span className="material-symbols-outlined text-[14px] material-filled">{config.icon}</span>
      <span className="status-chip">{config.label}</span>
    </div>
  );
}

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const color =
    score >= 80 ? "text-success" :
    score >= 60 ? "text-ink-soft" :
    "text-danger";

  const barColor =
    score >= 80 ? "bg-success" :
    score >= 60 ? "bg-ink-soft" :
    "bg-danger";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 bg-line rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("font-label-sm text-label-sm", color)}>{score}%</span>
    </div>
  );
}
