"use client";

import { cn } from "@/lib/utils";

type Recommendation = "strong-hire" | "hire" | "borderline" | "no-hire";

const configs: Record<Recommendation, { label: string; icon: string; className: string }> = {
  "strong-hire": {
    label: "Strong Hire",
    icon: "star",
    className: "bg-tertiary/10 border border-tertiary/20 text-tertiary",
  },
  hire: {
    label: "Hire",
    icon: "thumb_up",
    className: "bg-primary/10 border border-primary/20 text-primary",
  },
  borderline: {
    label: "Borderline",
    icon: "help",
    className: "bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b]",
  },
  "no-hire": {
    label: "No Hire",
    icon: "thumb_down",
    className: "bg-error/10 border border-error/20 text-error",
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
    score >= 80 ? "text-tertiary" :
    score >= 60 ? "text-primary" :
    "text-error";

  const barColor =
    score >= 80 ? "bg-tertiary" :
    score >= 60 ? "bg-primary" :
    "bg-error";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("font-label-sm text-label-sm", color)}>{score}%</span>
    </div>
  );
}
