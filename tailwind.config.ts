import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 is configured CSS-first.
 *
 * The entire LayerForge design system — colour tokens, theme variables
 * (light/dark), typography, radius — lives in `src/app/globals.css` inside the
 * `@theme` block and the `:root` / `.light` theme definitions. See `design.md`.
 *
 * This file is intentionally minimal. v4 does not auto-load it (there is no
 * `@config` directive), so it carries no theme values — keep design tokens in
 * globals.css to avoid two competing sources of truth.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
