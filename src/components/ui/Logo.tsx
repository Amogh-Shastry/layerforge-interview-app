import { cn } from "@/lib/utils";

interface LogoProps {
  /** "mono" = single off-white lockup (use on teal chrome / dark surfaces).
   *  "full" = Layer(orange) + Forge(teal) (use only on light content surfaces). */
  variant?: "mono" | "full";
  /** Show the BUILT WITH PRECISION tagline beneath the wordmark. */
  tagline?: boolean;
  className?: string;
}

export function Logo({ variant = "mono", tagline = false, className }: LogoProps) {
  const isFull = variant === "full";
  return (
    // Logo keeps its own brand font (Urbanist) — exempt from the app-wide
    // Lufga/Outfit standard. Set inline so heading rules can't override it.
    <span
      className={cn("inline-flex flex-col leading-none select-none", className)}
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      <span className="font-extrabold tracking-tight text-xl">
        <span className={isFull ? "text-blaze" : "text-on-chrome"}>Layer</span>
        <span className={isFull ? "text-teal" : "text-on-chrome"}>Forge</span>
        {/* Full-stop stays white (matches the wordmark) — no orange. */}
        <span className={isFull ? "text-teal" : "text-on-chrome"}>.</span>
        <span
          className={cn(
            "align-super text-[0.4em] font-bold",
            isFull ? "text-teal" : "text-on-chrome"
          )}
          style={{ fontFamily: '"Poppins", sans-serif' }}
        >
          ™
        </span>
      </span>
      {tagline && (
        <span className="font-semibold uppercase tracking-[0.18em] text-[8px] mt-1 opacity-70">
          Built with Precision
        </span>
      )}
    </span>
  );
}
