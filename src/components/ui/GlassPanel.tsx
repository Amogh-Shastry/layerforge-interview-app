"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export function GlassPanel({ className, hover = true, glow = false, children, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl",
        glow && "border-accent/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
