# Repo rules (binding for every change)

This file owns quality for model-tier-list. Each agent and each human must obey it.
If a task conflicts with a rule, stop and ask. Never bend a rule in silence.

## Hard gates (checked by `pnpm quality`, runs in `pnpm build`)

- No code file holds more than 800 lines. Scope: `src/**` and `scripts/*.mjs`,
  except generated data in `src/data/*.json`. The gate fails the build past 800.
- TypeScript must pass with zero errors (`tsc --noEmit`).
- The production build must pass (`vite build`).

## Shape rules (each change must hold these)

- One module owns one job. New behavior gets a new module or a named section.
  No grab-bag files, no dead exports, no duplicate helpers.
- Cyclomatic complexity stays under 21 per function. Split past that.
- Nesting depth stays at 3 or less. Pull a helper past that.
- Find things fast: components in `src/`, shared logic in `src/lib/`,
  fetch scripts in `scripts/`, generated data in `src/data/`.
- No new dependency without a clear need. Ask before you add one.

## Product rules (this app serves Majd)

- No explainer text, no onboarding copy, no help paragraphs. Zero yap.
- Each core answer (what wins, what is new, what is cheap and fast) stays
  within zero taps on first paint, or one tap at most.
- Never add taps, steps, or screens to those answers. Never split one board
  across pages.
- Mobile at 390 px must match desktop: same facts, same flow, native feel.
- Motion tracks change (FLIP, sliding pill). Zero flicker, zero blink, zero jank.
- Tooltips stay consistent: desktop hover and mobile tap show the same facts.

## Data rules

- Source is Artificial Analysis only: models page and coding-agents page.
- `node scripts/fetch-aa.mjs && node scripts/fetch-agents.mjs` refreshes data.
- Never hand-edit `src/data/*.json`. Fix the fetch script instead.
- Keep `added` dates true. NEW badge means first seen within 7 days.
- Daily job touches data files only. It never force-pushes and never edits code.
