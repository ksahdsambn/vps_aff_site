# AGENTS.md

Project-wide guidance for AI coding agents working on this repo.

## Design Context

Established via `teach-impeccable` on 2026-07-12. Synthesized from a full codebase
scan (Next.js frontend in `frontend-next/`, AntD 6 theme, `globals.css`, CSS modules)
plus confirmed product decisions. **Treat this as the source of truth for all UI/UX
work** — match it, and when you must deviate, update this section.

### Users

This is a bilingual (zh / en) **VPS affiliate / comparison site** that serves two
audiences in meaningful proportion:

- **Technical buyers** — developers, homelabers, SREs self-hosting. They read the
  CPU / RAM / disk / bandwidth columns closely and value **precise, trustworthy data**.
- **Value buyers** — SMB owners and indie makers. They scan **price, location, and
  brand reputation** more than raw specs.

The product job-to-be-done: **"help me quickly find and compare the right VPS deal,
then click through to order."** This means the design must serve *both* audiences at
once: data must be **detailed and precise** for the techies, while the layout stays
**scannable and uncluttered** for value buyers who skim. There is also an **admin
surface** (admins managing products / announcements / settings) — a separate, denser,
more utilitarian context that should *not* inherit the marketing-site playfulness.

### Brand Personality

**Modern · Trustworthy · Precise** — in that order of priority.

- *Modern*: clean editorial foundations, opaque surfaces with hairline borders,
  considered typography (Fraunces + Manrope), restrained radius.
- *Trustworthy*: precise data, warm slate text, credible layout — the buyer is making
  a spending decision, so the UI must never feel cheap, gimmicky, or misleading.
  One solid accent; no gradient theatre.
- *Precise*: tabular numerics, aligned spec columns, honest pricing — the data is the
  product. Calm, smooth ease-out motion (no bounce) reinforces that this is a serious
  tool, not a toy.

Tone of copy: **clear, helpful, no hype.** Bilingual zh/en must feel equally native
(Noto Sans SC for Chinese).

### Aesthetic Direction

- **Visual tone**: editorial, warm, precise. This is a **data instrument**, not a
  marketing landing page — the precision of a specs publication (think Stripe docs
  meets a comparison sheet) with the calm of a magazine layout. **Opaque surfaces
  with hairline borders. No glassmorphism. No gradients. No decorative blur.**
- **Palette**: warm tinted neutrals (paper `#faf9f7`, ink `#1a1d29`) — never pure
  white/black — with a **single solid deep-indigo accent** `#4338ca` used sparingly
  for CTAs, links, and active states only. No indigo→violet→pink washes.
- **Typography**: `Fraunces` (soft-serif display) for headings + the 404 numeral;
  `Manrope` (geometric humanist sans) for body/UI (replaces the overused `Inter`);
  `Noto Sans SC` for Chinese. Spec numerics use `font-variant-numeric: tabular-nums`
  (the `.num` utility) so CPU/RAM/disk/bandwidth/price columns align cleanly — no
  monospace-as-vibe.
- **Motion**: smooth `ease-out-quart` (`cubic-bezier(0.22,1,0.36,1)`) only. **No
  bounce/elastic easing anywhere** — it reads as dated and undermines credibility on
  a spending-decision site. Hover changes `background`/`border-color`/`color`, never
  `translateY`/`scale`. One staggered list entrance on product items; single opacity
  page fade. `prefers-reduced-motion` is gated (disables transforms/animations).
- **Theme**: **light + dark.** Currently **light-only** and fully tuned. A dark theme
  is a **planned future phase** — because the whole system runs through CSS variables
  (in `globals.css`) and AntD `cssVar` mode (in `theme.ts`), the dark pass is one
  `[data-theme="dark"]` variable block, not a rebuild. Never hardcode light-mode hex
  inline; use the tokens so the eventual dark pass stays cheap.
- **References**: editorial specs publications, calm SaaS docs, precise financial
  data tables.
- **Anti-references**: generic AI-generated "centered hero + 3 feature cards" landing
  pages; glassmorphic blur-everywhere SaaS dashboards; bouncy/elastic micro-
  interactions; indigo→violet→pink gradient buttons; data-dense/ugly table-heavy host
  comparison sites; aggressive neon or high-contrast "hacker" aesthetics.

### Design Tokens (current source of truth)

Defined in `frontend-next/src/lib/theme.ts` (AntD `ThemeConfig`, `cssVar` mode) and
`frontend-next/src/app/globals.css` (`:root` CSS variables). Keep them in sync. Both
layers are dark-mode-ready: a future `[data-theme="dark"]` block overrides the
`--*` variables and the whole site (AntD + custom) re-themes without code changes.

| Token (CSS var) | Value | AntD token |
|---|---|---|
| `--accent` / `--accent-hover` | `#4338ca` / `#3730a3` (solid, no gradient) | `colorPrimary` |
| `--accent-soft` | `#eef0fc` (hover/active fills, badges) | `rowHoverBg`, `itemSelectedBg` |
| `--ink` | `#1a1d29` (headings, tinted near-black) | `colorTextHeading` |
| `--text` / `--muted` | `#3a3f4f` / `#71778a` (warm slate) | `colorText` / `colorTextSecondary` |
| `--paper` / `--surface` / `--surface-alt` | `#faf9f7` / `#ffffff` / `#f4f2ee` | `colorBgLayout` / `colorBgContainer` |
| `--rule` / `--rule-strong` | `#e8e3dc` / `#d8d2c8` (warm hairline) | `colorBorder` |
| Success / Warning / Error / Info | `#10906a` / `#b45309` / `#c2410c` / `#2563eb` | `colorSuccess`/… |
| Radius | control `8px` (`borderRadiusSM`); base/card `10px` (`borderRadius`); container `12px` (`borderRadiusLG`); table header `10px` | `borderRadius` / `borderRadiusLG` / `borderRadiusSM` |
| Font display | `var(--font-fraunces), var(--font-noto), Georgia, serif` | — (headings via `var(--font-display)`) |
| Font body | `var(--font-manrope), var(--font-noto), system-ui, sans-serif` | `fontFamily` |
| Control height | base `40px` (`controlHeight`); LG `44px` (`controlHeightLG`) — buttons/inputs/selects inherit these (AntD 6 has no per-component height token) | `controlHeight` |
| Min tap target | `44×44px` (enforced on action buttons) | — |
| Motion easing | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) | — |
| Durations | fast `160ms`; default `240ms` | — |
| Scrollbar | 8px, `#cfc9bf` thumb (warm), transparent track | — |

Shared UI primitives live in `frontend-next/src/components/ui/`:
- `Button` — token-driven CTA (variants: `primary` solid accent / `ghost` / `text`),
  44px min tap target. **Use this instead of inline gradient buttons.**
- `SpecStat` — label (`.eyebrow`, muted uppercase tracked) + value (`.num`, tabular),
  for the repeated CPU/RAM/disk/bandwidth spec blocks.

### Design Principles

Apply these to every design decision; when in conflict, earlier ones win.

1. **Detail without clutter.** Serve technical and value buyers simultaneously —
   show full precise specs (CPU/RAM/disk/bandwidth/price), but keep the layout
   scannable. Density is fine; noise is not. Use `tabular-nums` (`.num`) so numeric
   columns align for fast scanning.
2. **Match the existing system; extend, don't fork.** Reuse the warm palette, the
   `Fraunces`/`Manrope` pairing, the hairline-border opaque surfaces, the ease-out-
   quart motion, and the AntD token + CSS-variable layer. Add new design decisions
   deliberately, never as one-off hex values, gradients, blur, or arbitrary radii.
   Prefer `theme.ts` tokens / `globals.css` CSS variables over inline magic numbers.
3. **Opaque, calm, no bounce.** Surfaces are opaque with hairline borders — **no
   glassmorphism, no `backdrop-filter`, no decorative gradients.** Motion is smooth
   ease-out only — **no bounce/elastic easing, no `translateY`/`scale` hover lifts.**
   The marketing/product surfaces and the admin share this calm; the admin is simply
   denser and more utilitarian (no staggered list entrances there).
4. **Bilingual equality.** zh and en must both feel native and never break layout.
   Design for variable text length (Chinese is compact, English is wide); test both.
5. **Trust over flash.** This site drives real spending decisions. Precision of
   data, clear pricing, and honest presentation always beat visual cleverness. Never
   sacrifice legibility of specs/price for an effect. One restrained accent beats a
   gradient.
6. **Design for the coming dark theme.** Favor themable tokens and CSS variables
   over hardcoded light-mode values, so the planned dark-mode pass (a single
   `[data-theme="dark"]` variable block) stays cheap.

### Motion Policy (concrete)

- **Easing** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) for all interactive
  elements (buttons, pagination, cards, inputs, selects). Durations: `160ms` (fast)
  / `240ms` (default).
- **Hover**: interactive elements shift `background`/`border-color`/`color` only —
  **no `translateY`/`scale` transforms, no glow shadows.** Product cards go
  `border → var(--accent)` + subtle `background → var(--accent-soft)` tint.
- **Entrances**: staggered `slideUpFade` (`0.5s` ease-out-quart, 8px translate) with
  `.stagger-delay-1..10` for product list items; `.page-enter` (0.4s opacity fade)
  for page entrances. No `springFadeIn` (removed).
- **Admin**: omit staggered list entrances; use simple, short transitions only.
- **Accessibility**: `prefers-reduced-motion: reduce` is gated in `globals.css` — it
  collapses all animations/transitions to ~instant and forces stagger/page-enter
  elements to their final state. Never add un-gated motion.
