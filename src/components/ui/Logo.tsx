import { cn } from "@/lib/utils";

interface LogoProps {
  /** "mono" = single off-white lockup (use on teal chrome / dark surfaces).
   *  "full" = Layer(orange) + Forge.(teal) (use only on light content surfaces). */
  variant?: "mono" | "full";
  /** Show the BUILT WITH PRECISION tagline beneath the wordmark. */
  tagline?: boolean;
  className?: string;
}

export function Logo({ variant = "mono", tagline = false, className }: LogoProps) {
  const isFull = variant === "full";
  return (
    <span className={cn("inline-flex flex-col leading-none select-none", className)}>
      <span className="font-display font-extrabold tracking-tight text-xl">
        <span className={isFull ? "text-blaze" : "text-on-chrome"}>Layer</span>
        <span className={isFull ? "text-teal" : "text-on-chrome"}>Forge</span>
        <span className={isFull ? "text-teal" : "text-accent"}>.</span>
        <span className="align-super text-[0.5em] font-semibold opacity-70">™</span>
      </span>
      {tagline && (
        <span className="font-display font-semibold uppercase tracking-[0.18em] text-[8px] mt-1 opacity-70">
          Built with Precision
        </span>
      )}
    </span>
  );
}
