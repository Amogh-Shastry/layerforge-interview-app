# LayerForge Redesign — Design System

> Redesign spec for the Interview Platform (currently "AIEval Pro"), rebranded for
> **LayerForge™ — _Built with Precision_**.
>
> This document is the single source of truth for the visual redesign. It defines the
> dual-theme palette, type system, the mandatory colour ratio, component mappings, and a
> concrete migration checklist. Implementers should follow it exactly; deviations need
> sign-off.

---

## 0. Theming: Light + Dark as a Feature

The app ships with **two themes the user can toggle between**:

- **Light mode** — the brand's native canvas: Off-White `#F5F4F0`. This is the literal
  LayerForge brand sheet applied as-authored.
- **Dark mode** — the existing dark navy canvas `#051424` (what the app uses today).

The two themes are **not two different designs** — they are the same layout, type, and
component system with a flipped surface/text palette. One design, two skins.

### The unifying decision

**Structural chrome — the sidebar and header — is Teal Blue `#033B55` in _both_ themes**,
always carrying off-white text. Only the **content canvas** flips (navy ↔ off-white) and
the **content surfaces/text** invert with it. The **Blaze Orange accent is identical in
both themes.**

Why this matters:

1. It makes the brand's _"Teal Blue 30% — dominant structure"_ rule literally true in
   light mode (teal is the dominant structural colour), and keeps teal present in dark
   mode too.
2. The product looks unmistakably "LayerForge" regardless of mode — the orange + teal
   identity never disappears.
3. It minimises per-theme work: only the content area needs to invert.

The app currently hard-locks dark (`<html className="dark">`, `color-scheme: dark`). The
redesign drives everything from **semantic CSS variables** that flip on a theme class /
`data-theme` attribute. Default theme = **dark** (preserves current look); persist the
user's choice (localStorage) and respect `prefers-color-scheme` on first visit.

---

## 1. Brand Identity Reference (from LayerForge)

| Token | Name | HEX | RGB | Brand role | Ratio |
|---|---|---|---|---|---|
| Teal Blue | `teal` | `#033B55` | 3, 59, 85 | Dominant structure | **30%** |
| Off-White | `offwhite` | `#F5F4F0` | 245, 244, 240 | Breathing space | **25%** |
| Steel Grey | `steel` | `#2C3E50` | 44, 62, 80 | Body & text | **20%** |
| Blaze Orange | `orange` | `#F86400` | 248, 100, 0 | Action & energy | **15%** |
| Slate | `slate` | `#8FA3B1` | 143, 163, 177 | Quiet UI details | **10%** |

**Logo:** "Layer" in Blaze Orange, "Forge." in Teal Blue, tagline _BUILT WITH PRECISION_
in Teal Blue, tracked-out all-caps.
- On **light** surfaces → full-colour logo.
- On **dark/teal** surfaces (incl. the teal sidebar in light mode) → **off-white** single
  -colour lockup. Never place the full-colour logo on dark/teal — the teal "Forge." would
  vanish. See §7.

---

## 2. Design Principles

LayerForge is **"Built with Precision."** The visual language must feel _engineered_,
not decorative.

1. **Blueprint, not brochure.** Structure is visible. Crisp 1px borders, deliberate grid,
   tight alignment. Urbanist's constructed letterforms reinforce this.
2. **Precision over flash.** The current design leans heavily on glows, scanlines, and
   breathing animations. Dial these back. Motion should be functional and restrained
   (state changes, focus, progress), not ambient.
3. **One energy colour.** Blaze Orange is the _only_ high-energy accent, identical in both
   themes. It means "act / live / important." Never use it for decoration or large fills.
   Scarcity is what makes it read as energy.
4. **Calm structure, loud action.** Teal/steel chrome is quiet and dominant; orange CTAs
   pop precisely because everything around them is calm.
5. **Readable first.** Body text is Outfit at 14–16px with generous line-height. Both
   themes must clear WCAG AA for body text.
6. **Theme parity.** Every screen must be designed and QA'd in both light and dark. No
   component may hard-code a literal canvas/text hex — always go through tokens (§3).

---

## 3. Colour System — Semantic Tokens (theme-aware)

Implement **semantic tokens** that resolve differently per theme. Components reference the
semantic name only; they never know which theme is active.

### 3.1 Token table

| Semantic token | Job | **Dark** value | **Light** value |
|---|---|---|---|
| `--bg` | Content canvas | `#051424` navy | `#F5F4F0` off-white |
| `--surface-1` | Primary content panel / card | `#033B55` teal | `#FFFFFF` white |
| `--surface-2` | Nested panel / input / row | `#2C3E50` steel | `#ECEAE3` warm off-white |
| `--surface-1-hover` | Panel hover | `#0A4A68` | `#F3F2EE` |
| `--surface-2-hover` | Nested hover | `#38516B` | `#E3E1D9` |
| `--chrome` | **Sidebar + header (both themes)** | `#033B55` teal | `#033B55` teal |
| `--on-chrome` | Text/icons on chrome | `#F5F4F0` | `#F5F4F0` |
| `--text-primary` | Headings & key body | `#F5F4F0` off-white | `#16222E` steel-dark |
| `--text-secondary` | Standard body | `#C3CDD6` | `#2C3E50` steel |
| `--text-muted` | Captions, meta, placeholder | `#8FA3B1` slate | `#5E7081` slate-dark |
| `--border` | Default 1px line | `slate @ 18%` | `steel @ 14%` |
| `--border-strong` | Emphasis / hover line | `slate @ 32%` | `steel @ 26%` |
| `--accent` | **Action & energy (both themes)** | `#F86400` | `#F86400` |
| `--accent-hover` | CTA hover | `#FF7A1F` | `#FF7A1F` |
| `--accent-press` | CTA active | `#D85600` | `#D85600` |
| `--on-accent` | Text/icon on orange fill | `#051424` | `#051424` |
| `--focus-ring` | Focus outline | `#F86400` | `#F86400` |

> **`--on-accent` is dark in both themes.** Per the brand, button text on Blaze Orange is
> the dark canvas colour, never white — white on `#F86400` fails contrast.

### 3.2 Semantic status colours (theme-stable)

These keep the same hue across themes (tint the _background_ wash per theme, keep the hue
for text/icon). Kept distinct from the brand-orange "action" meaning.

```
--success: #2FBF8F   /* teal-leaning green */
--warning: #F5A623   /* amber — deliberately distinct from blaze orange */
--danger:  #E5484D   /* red */
--info:    var(--text-muted)
--live:    #F86400   /* live/recording reuses blaze orange */
```

### 3.3 The mandated ratio across both themes

The brand says _"every design must follow this proportion."_ Read it as proportion of
**visible UI surface area**, honoured per theme:

- **Teal 30%** → the chrome (sidebar + header) is teal in both themes → dominant structure ✔
- **Off-White 25%** → in light mode it's the literal canvas; in dark mode it's the text +
  breathing space (whitespace + off-white type). Either way ~25% of the visual field.
- **Steel 20%** → secondary surfaces + body-text blocks (steel _is_ the body text in light
  mode; steel _is_ the nested surface in dark mode).
- **Orange ≤15%** → **treat 15% as a ceiling, not a target.** In a dense product UI the
  honest figure is 5–10%. Orange marks action and live state only; a literal 15% would
  over-saturate. "≤15%, used precisely" satisfies the spirit.
- **Slate 10%** → borders, dividers, muted text, quiet icons.

> Rule of thumb: if a screen looks mostly orange, it's wrong. Calm teal/steel structure
> with a few decisive orange moments is right — in either theme.

### 3.4 Status-colour remap (replaces current `StatusChip` / `ScoreBadge`)

| State | Old | New |
|---|---|---|
| Strong Hire | tertiary green | `--success` |
| Hire | primary periwinkle | `--accent` (positive "go" action) |
| Borderline | `#f59e0b` | `--warning` |
| No Hire | error red | `--danger` |
| Score ≥80 | tertiary | `--success` |
| Score 60–79 | primary | `--text-secondary` (neutral) |
| Score <60 | error | `--danger` |

### 3.5 Accessibility

- Off-white on teal/steel (dark) and steel-dark on off-white/white (light) both clear AA
  for body text.
- Orange `#F86400` passes AA for large text and UI components in both themes; for orange
  **button text use dark `#051424`**, never white.
- `--text-muted` (slate) is for non-essential meta only — never primary reading content.
- Focus ring (orange, 2px, offset) must be visible on every interactive element in both
  themes.

---

## 4. Typography

Replace the current **Geist + Inter + JetBrains Mono** stack. Type is theme-agnostic —
only colour changes between modes.

| Role | Old | New | Notes |
|---|---|---|---|
| Headings / display | Geist | **Urbanist** | Constructed, "blueprint" letterforms — serious, structural, foundational. Fits "Built with Precision." |
| Body / UI | Inter | **Outfit** | Softer, more open counters; far more readable at 14–16px. Keeps the product from feeling stiff. |
| Mono / labels | JetBrains Mono | **JetBrains Mono** (keep) | Status chips, timestamps, IDs, "spec-sheet" data labels — reinforces the engineered feel. |

### 4.1 Weight & spacing as tools (per brand guidance)

- **Headlines (Urbanist):** heavier weights **(600–800)**, tight tracking **(-0.02em to
  -0.04em)**. Small eyebrow/section labels: all-caps + wide tracking **(0.08em–0.12em)**,
  echoing the logo's _BUILT WITH PRECISION_ lockup.
- **Body (Outfit):** **400–500** weight, normal tracking, **line-height 1.5–1.6**. Never
  below 14px for reading text.

### 4.2 Type scale (carry over existing sizes, swap families)

```
display-lg   48px / 1.1  / -0.04em / 700   Urbanist
headline-lg  32px / 1.2  / -0.02em / 600   Urbanist
headline-md  24px / 1.3  /  0      / 600   Urbanist
title        20px / 1.3  / -0.01em / 600   Urbanist
body-lg      18px / 1.6  /  0      / 400   Outfit
body-md      16px / 1.5  /  0      / 400   Outfit
body-sm      14px / 1.5  /  0      / 400   Outfit
label-md     13px / 1    /  0.02em / 500   JetBrains Mono
label-sm     11px / 1    /  0.05em / 500   JetBrains Mono
eyebrow      11–12px / 1 / 0.10em  / 600   Urbanist, UPPERCASE
```

### 4.3 Font loading

Swap the Google Fonts `@import` in `globals.css` and the `<link>` in `layout.tsx`:

```
https://fonts.googleapis.com/css2?family=Urbanist:wght@400..800&family=Outfit:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap
```

Remove Geist and Inter. (Keep Material Symbols — see §7.) Set `body` default to
`'Outfit', sans-serif`.

---

## 5. Component & Surface Mapping

Old → new translation, expressed in **semantic tokens** so each works in both themes.
Anywhere current code uses hard-coded hexes (`#051424`, `#adc6ff`, `#122131`, `#d4e4fa`,
`#c2c6d6`) or MD3-style tailwind tokens (`primary`, `surface-container`, `tertiary`),
remap to the token below.

| Element | Current | Redesign (token) |
|---|---|---|
| Content canvas | `#051424` | `--bg` |
| Primary panel / card (`.glass-panel`, `.glass-card`) | translucent glass | `--surface-1` (near-opaque); keep a light glass blur only on the header. Reduce inner glow. |
| Nested panel / input | `white/5` fills | `--surface-2` |
| Header bar | `#051424/80` blur + periwinkle wordmark | `--chrome` (teal) + light blur + 1px bottom border; off-white logo lockup |
| Sidebar | `#122131` | `--chrome` (teal), off-white labels |
| Active nav indicator | periwinkle bg + right-border | `--accent` right-border + accent text + faint `accent @ 12%` bg |
| Inactive nav | `#c2c6d6` | `--on-chrome @ 70%`, hover → full `--on-chrome` |
| Primary button / CTA | periwinkle fill + `#002e6a` text | `--accent` fill + `--on-accent` text; hover `--accent-hover`, active `--accent-press` |
| Secondary button | — | transparent + 1px `--border` + `--text-primary`; hover `--border-strong` |
| Wordmark "AIEval Pro" | periwinkle | **LayerForge logo** (variant per surface, §7) |
| Primary text | `#d4e4fa` | `--text-primary` |
| Secondary/body text | `#c2c6d6/60` | `--text-secondary` |
| Muted/meta text | `#c2c6d6/60` | `--text-muted` |
| Borders / dividers | `white/5–10` | `--border` |
| Focus ring | periwinkle | `--focus-ring` (orange, 2px, offset) |
| Progress fill (`.progress-fill`) | periwinkle + glow | `--accent`; drop the heavy box-shadow glow |
| Brand chip (`corporate_fare`) | `#4d8eff` | `--chrome` plate, or `--accent` for the user-initial chip |
| Live / recording indicator | — | `--live` dot + `LIVE` mono label |
| Scrollbar thumb | `white/10` | `--text-muted @ 40%` |
| Selection (`::selection`) | periwinkle @ 30% | `--accent @ 25%` |
| Border radius | `xl = 0.75rem` etc. | **keep existing radius scale** — reads as precise. Don't round more. |

### 5.1 Effects to retire or tone down (precision > flash)

- **Retire:** `.scanline-effect`, `.ai-glow` / `.ai-glow-pulse`, `.brain-glow`,
  ambient `.pulse-ring`, `.active-speaker-ring` glow → replace the speaker indicator with
  a crisp 2px **`--accent`** ring (no blur).
- **Keep (functional):** `.waveform-bar` (live audio), `.custom-scrollbar`,
  `.transcript-gradient` mask, progress bar (minus glow), `.face-outline` (recolour to
  `--text-muted`, `--accent` when locked-on).
- **General:** transitions 150–200ms ease-out for state/hover/focus. No infinite ambient
  animation except the live waveform and a single subtle "recording" pulse. Theme switch
  itself may use a ~200ms colour transition.

---

## 6. Layout & Spacing

Keep the existing spacing scale and grid — already on a clean 4px unit:

```
unit 4px · stack-sm 8px · stack-md 16px · stack-lg 32px
gutter 24px · margin-desktop 48px · margin-mobile 16px · container-max 1440px
```

Lean into the blueprint feel through **alignment and 1px structure**, not extra spacing:
visible `--border` dividers between sections, consistent card padding (24px desktop /
16px mobile), strict left-aligned grid.

---

## 7. Logo, Theme Toggle & Iconography

### Logo per surface
- **On light content surfaces** (light mode canvas/cards) → full-colour logo.
- **On teal chrome and dark canvas** (sidebar/header always; dark-mode content) →
  **off-white** single-colour lockup.
- Practically: the header/sidebar logo is **always off-white** (chrome is teal in both
  themes). Any logo placed in the light-mode content area uses full-colour.
- **Clear space:** ≥ the height of the "L" around the logo.
- **Don't:** recolour the orange, stretch, add glow, or put the full-colour version on
  dark/teal/busy surfaces.
- **Tagline** _BUILT WITH PRECISION_ — Urbanist, uppercase, tracked `0.10em+`. Use
  sparingly (login, footer, splash).

### Theme toggle
- Place a sun/moon toggle in the header (right cluster, near notifications/avatar).
- Persist to localStorage; initialise from saved value, else `prefers-color-scheme`.
- Toggle sets the theme class / `data-theme` on `<html>`; all colours resolve via the
  §3.1 variables.

### Icons
- Keep Google **Material Symbols** for v1 (clean, geometric, pair well with
  Urbanist/Outfit). Recolour via tokens: default `--text-muted`, active/important
  `--accent`, on-surface `--text-primary`, on-chrome `--on-chrome`.
- `lucide-react` is installed if a lighter set is wanted later — don't mix the two in one
  view.

---

## 8. Implementation / Migration Checklist

1. **Semantic tokens first.** Define the §3.1 variables as CSS custom properties in
   `globals.css` under `:root` (dark defaults) and a `.light` / `[data-theme="light"]`
   block (light overrides). In `tailwind.config.ts`, expose them as colours
   (`bg: 'var(--bg)'`, `surface-1: 'var(--surface-1)'`, `accent: 'var(--accent)'`, …).
   Keep old MD3 token names as **aliases** onto the new variables so existing class names
   don't all break at once, then migrate call-sites incrementally:
   - `primary` → `accent`
   - `surface-container` / `surface-container-*` → `surface-1` / `surface-2`
   - `on-surface` → `text-primary`
   - `on-surface-variant` / `outline` → `text-muted` / `border`
   - `tertiary` → `success`
2. **Fonts.** Update the Google Fonts URL in `globals.css` (line 1) and `layout.tsx`
   (lines 26–29) to Urbanist + Outfit + JetBrains Mono; drop Geist/Inter. In tailwind
   `fontFamily`: `display`/`headline-*` → Urbanist, `body-*`/`sans` → Outfit, `mono` →
   JetBrains Mono. `body { font-family: 'Outfit' }`.
3. **Theme plumbing.** Stop hard-locking dark: replace `<html className="dark">` /
   `color-scheme: dark` with a small inline script that sets the theme class before paint
   (avoids flash), reading localStorage → `prefers-color-scheme`. Add the header toggle
   (§7). Set `color-scheme` per theme.
4. **globals.css effects.** Recolour `::selection`, glass panels (`--surface-1`), progress
   fill (`--accent`, no glow), scrollbar (`--text-muted`). Remove/disable the retired
   effects in §5.1.
5. **Shell chrome.** `HRShell.tsx`, `TopNav.tsx`, `MobileNav.tsx`: chrome → `--chrome`
   teal (both themes), swap hard-coded hexes for tokens, replace the "AIEval Pro" wordmark
   with the off-white LayerForge logo, active-nav indicator → `--accent`.
6. **UI primitives.** `GlassPanel.tsx` (→ `--surface-1`, lighter glass), `StatusChip.tsx`
   / `ScoreBadge` (status remap §3.4), buttons → accent-fill / outline variants.
7. **Pages.** Dashboard, live, evaluation, pools, reports, and the candidate flow
   (`device-setup`, `ready`, `room`, `complete`, `report`): replace remaining hard-coded
   hexes with tokens. Grep for `#adc6ff`, `#d4e4fa`, `#c2c6d6`, `#122131`, `#4d8eff`,
   `#002e6a`, `#051424` and remap each.
8. **App metadata.** Update `layout.tsx` title/description ("AIEval Pro … DeepStation") to
   LayerForge branding once confirmed.
9. **QA pass — both themes.** For every screen: verify in light AND dark, check the orange
   ceiling (§3.3), AA contrast (§3.5), visible focus rings, no full-colour logo on
   dark/teal, and no flash-of-wrong-theme on load.

### Quick find-and-replace map (hex → token)

```
#051424  → --bg  (also the literal value of dark --bg and of --on-accent)
#d4e4fa  → --text-primary
#c2c6d6  → --text-muted / --text-secondary (by context)
#adc6ff  → --accent
#122131  → --surface-1 / --chrome (by context)
#1c2b3c  → --surface-1 / --surface-2
#4d8eff  → --chrome (teal)
#002e6a / #00285d → --on-accent (#051424)
#f59e0b  → --warning
```

---

## 9. Summary

The canvas is now a **theme toggle**: dark navy `#051424` and the brand's off-white
`#F5F4F0`, sharing one design. The **teal chrome (sidebar + header) and the blaze-orange
accent stay constant in both modes**, so LayerForge identity reads consistently and the
brand's "teal = dominant structure / orange = action" rules hold literally. Only the
content canvas, surfaces, and text invert between modes — all driven by semantic tokens,
never hard-coded hexes. Headings in **Urbanist** (heavy, tight, constructed), body in
**Outfit** (light, open, readable). Trade ambient glow for crisp 1px structure and
restrained, functional motion — _Built with Precision_, in any light.
