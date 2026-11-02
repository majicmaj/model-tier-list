---
name: Model Tier List
description: Artificial Analysis model ranks as a dated season-annual tier board.
colors:
  paper: "#fcfcfc"
  ink: "#202020"
  ink-soft: "#646464"
  hairline: "#d9d9d9"
  rowwash: "#f0f0f0"
  chip-border: "#cecece"
  chip-border-hover: "#bbbbbb"
  logo-miss-bg: "#e0e0e0"
  action: "#0d74ce"
  action-deep: "#113264"
  selection: "#d5efff"
  focus: "#5eb1ef"
  white: "#ffffff"
  tip-text: "#fcfcfc"
  tip-soft: "#d9d9d9"
  tip-tag: "#e8e8e8"
  tip-tag-border: "#838383"
  tip-link: "#d5efff"
  tier-s-bg: "#feebec"
  tier-s-ink: "#ce2c31"
  tier-a-bg: "#ffefd6"
  tier-a-ink: "#cc4e00"
  tier-b-bg: "#fff7c2"
  tier-b-ink: "#ab6400"
  tier-c-bg: "#e6f6eb"
  tier-c-ink: "#218358"
  tier-d-bg: "#e0f8f3"
  tier-d-ink: "#008573"
  tier-e-bg: "#e6f4fe"
  tier-e-ink: "#0d74ce"
  tier-f-bg: "#e8e8e8"
  tier-f-ink: "#646464"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "'Barlow Condensed', 'Barlow', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  title-sm:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  body-sm:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
  micro:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  micro-sm:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
  micro-xs:
    fontFamily: "'Barlow', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
rounded:
  tag: "4px"
  plate: "5px"
  logo-miss: "6px"
  tier-label: "8px"
  tile: "10px"
  tip: "10px"
  pill: "999px"
spacing:
  chip-gap: "8px"
  tile-gap: "8px"
  tier-gap: "10px"
  tier-padding: "8px"
  page-gutter: "20px"
components:
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-hover:
    backgroundColor: "{colors.rowwash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-active:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-active-hover:
    backgroundColor: "{colors.action-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  tier-plate-s:
    backgroundColor: "{colors.tier-s-bg}"
    textColor: "{colors.tier-s-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-a:
    backgroundColor: "{colors.tier-a-bg}"
    textColor: "{colors.tier-a-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-b:
    backgroundColor: "{colors.tier-b-bg}"
    textColor: "{colors.tier-b-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-c:
    backgroundColor: "{colors.tier-c-bg}"
    textColor: "{colors.tier-c-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-d:
    backgroundColor: "{colors.tier-d-bg}"
    textColor: "{colors.tier-d-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-e:
    backgroundColor: "{colors.tier-e-bg}"
    textColor: "{colors.tier-e-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-plate-f:
    backgroundColor: "{colors.tier-f-bg}"
    textColor: "{colors.tier-f-ink}"
    rounded: "{rounded.plate}"
    padding: "0 0.3rem"
    height: "1.6rem"
  tier-label-s:
    backgroundColor: "{colors.tier-s-bg}"
    textColor: "{colors.tier-s-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-a:
    backgroundColor: "{colors.tier-a-bg}"
    textColor: "{colors.tier-a-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-b:
    backgroundColor: "{colors.tier-b-bg}"
    textColor: "{colors.tier-b-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-c:
    backgroundColor: "{colors.tier-c-bg}"
    textColor: "{colors.tier-c-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-d:
    backgroundColor: "{colors.tier-d-bg}"
    textColor: "{colors.tier-d-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-e:
    backgroundColor: "{colors.tier-e-bg}"
    textColor: "{colors.tier-e-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-f:
    backgroundColor: "{colors.tier-f-bg}"
    textColor: "{colors.tier-f-ink}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tier-label-flat:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.tier-label}"
    padding: "8px 10px"
  tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "6px"
    size: "78px"
  tile-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "6px"
    size: "78px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tip-text}"
    rounded: "{rounded.tip}"
    padding: "12px 14px"
    width: "248px"
  tip-tag:
    textColor: "{colors.tip-tag}"
    rounded: "{rounded.tag}"
    padding: "1px 5px"
  logo-fallback:
    backgroundColor: "{colors.logo-miss-bg}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.logo-miss}"
    size: "24px"
---

# Design System: Model Tier List

## Overview

**Creative North Star: "The Season Annual"**

The board is a printed season annual, not a dashboard. Each data refresh prints a dated edition: the masthead stamps the edition date beside the tier legend, seven ruled tier sections follow with S first, and a colophon closes the page with the snapshot date and the refresh command. Fog-paper ground, ink hairline rules, and condensed grotesk heads do the work; nothing glows or floats, and only the tooltip card casts a shadow.

Density serves the glance. Each tier is a classic tier row: a tinted label cell (letter, score-band range, model count) beside a field of model squares, each square a logo over a two-line name on a faint maker tint. Hover or tap opens one ink tooltip card with rank, value, gap, tier, badges, and the source link. Every numeral sets in tabular figures so cells hold still while lenses change. Lens chips are the only controls on the page, and tapping one ripples the tiles top to bottom into the new lens. The system refuses the dense sortable grid and the neon card wall; both were rejected in the direction contract and neither appears in the build.

**Key Characteristics:**

- Ruled tier rows: label cells plus model tiles, divided by weight-carrying rules (4px / 2px / 1px).
- Fixed seven-plate tier legend, identical on every lens.
- One action color, owned by the lens chips.
- Tabular numerals everywhere a number appears.
- Edition honesty: snapshot date on the masthead, source and method in the colophon.

## Colors

Fog-paper neutrals carry the page, one blue carries every action, seven fixed plate inks name the tiers, and an ink card with light-on-dark text carries the one tooltip. All values are Radix light-scale steps; prose cites the step and the frontmatter holds the hex.

### Primary

- **Annual Blue** ({colors.action}, Radix blue-11): the sole action color. It fills the active lens chip behind white text, deepens to action-deep (blue-12) on hover, and rings the open tile with a 2px outline. Its only other appearance is the E plate's letterpress ink.

### Neutral

- **Fog Paper** ({colors.paper}, gray-1): the page ground and the base under every tile tint.
- **Annual Ink** ({colors.ink}, gray-12): body text, the masthead title, every annual and section rule, and the tooltip card ground.
- **Soft Ink** ({colors.ink-soft}, gray-11): secondary text only — edition line, tier counts, lens hint, colophon, the logo-fallback letter, and the flat unranked label cell.
- **Hairline** ({colors.hairline}, gray-6): tier-row dividers and the legend underline.
- **Row Wash** ({colors.rowwash}, gray-3): the hover wash for idle chips.
- **Chip Border** ({colors.chip-border}, gray-7, hover gray-8): the idle chip's 1px ring and the flat label cell's dashed ring.
- **Miss Block** ({colors.logo-miss-bg}, gray-5): the logo-fallback tile behind the company initial.
- **Tooltip Text** ({colors.tip-text}, gray-1): name and values on the ink card.
- **Tooltip Soft** ({colors.tip-soft}, gray-6): maker line, grid terms, flat notice, and release date on the ink card.
- **Tooltip Tag** ({colors.tip-tag}, gray-4): badge text on the ink card, ringed in gray-10 ({colors.tip-tag-border}).
- **Tooltip Link** ({colors.tip-link}, blue-4): the one Artificial Analysis link, on ink only.
- **Selection Wash** ({colors.selection}, blue-4, with blue-12 text): text selection.
- **Focus Ring** ({colors.focus}, blue-8): the 2px visible focus outline.

### Tier Legend

Seven plates, fixed across all six lenses. Each pairs a step-3 tint ground with a step-11 letterpress ink: S red, A orange, B amber, C green, D teal, E blue, F gray-4 ground with gray-11 ink. The same pair inks the masthead legend plates and the tier label cells; only the per-tier model count beside them changes. The unranked foot takes a flat cell instead: transparent ground, dashed gray-7 ring, Soft Ink text, an en dash for its letter.

### Company Data Tints

Tile grounds take one tint per company from the Artificial Analysis snapshot (`src/data/snapshot.json`, e.g. OpenAI near-black, Meta signal blue, NVIDIA lime): `color-mix` 10% brand ink over Fog Paper at rest, 18% on hover. Companies with no ink fall back to plain paper (transparent tint). These are content, not palette: they never appear as text, chips, or plates, and the system adds no company color of its own. The old green leader mark is gone with the score rows; a leading gap now reads "lead" in plain tooltip text.

### Named Rules

**The One Action Color Rule.** Annual Blue as a solid fill appears only on the active lens chip, and as an outline only on the open tile. Blue anywhere else is letterpress (E plate), the tooltip link (blue-4 on ink), selection, or focus — never a second button, link, or badge color.

**The Fixed Legend Rule.** Tier plate inks never change across lenses. A lens re-sorts tiles and recounts plates; it never restyles them.

**The Company Tint Rule.** Tile grounds take the snapshot's per-company tint at 10% (18% hover) or plain paper. The palette never assigns tile grounds, so new companies arrive pre-tinted.

## Typography

**Display Font:** Barlow Condensed (with Barlow, sans-serif)
**Body Font:** Barlow (with system-ui, sans-serif)

Both faces are self-hosted from `public/fonts`: Barlow in 400/500/600/700 for tiles and text, Barlow Condensed in 500/600 for heads, plates, and tier letters. No system display face and no monospace appear anywhere.

**Character:** Condensed grotesk heads with the volume of a yearbook title page, set over a workhorse grotesk whose tabular figures keep every cell pinned.

### Hierarchy

- **Display** (600, clamp(1.75rem, 5vw, 2.5rem), line-height 1, uppercase, 0.01em): the masthead title "Model Tier List" only.
- **Headline** (600, Condensed, line-height 1, uppercase): tier letters at 1.5rem in the label cells, legend plates at 1rem. One voice at two sizes; no other section heads exist.
- **Body** (400/500/600, 16px base, line-height 1.45): tiles, hint, and colophon. The microcopy steps below the base are fixed: 0.9375rem tooltip names; 0.875rem chips and tooltip values (semibold); 0.8125rem edition, hint, tier-empty, tooltip maker, flat notice, link, and logo-fallback letters; 0.75rem legend counts, release dates, and colophon; 0.6875rem tier ranges and counts; 0.625rem tile names, tooltip terms, and tags (semibold).
- **Label** (600, 0.625rem, uppercase, 0.04em): the tooltip's reasoning/open tags — the smallest voice on the page. Grid terms match it at 0.05em tracking.

### Named Rules

**The Tabular Figures Rule.** Every numeral on the board — rank, value, gap, count, range, edition — sets in tabular figures. Cells must hold still while lenses change; proportional figures are a defect.

## Layout

One ruled column, centered, max-width 940px, page gutters 20px with 22px above and 56px below. The masthead opens the page (4px annual rule, 10px padding, title left with the edition line right ruled off at 8px, tier legend beneath at 8px margins), the six lens chips follow as index tabs at 12px with one hint line at 8px, then the tier rows stack under a 2px board rule at 6px, then the unranked foot, then the colophon behind a closing 4px rule at 20px with 8px padding. Spacing rhythm is tight groups with ruled separation: 8px between chips and tiles, 10px inside tier grids, rules — not air — between sections.

Tier rows grid two columns — a 118px label cell beside the wrapping tile field — with 10px gap, 8px vertical padding, and a 1px hairline under each. Label cells and tile fields both stand at least 78px tall. At the 640px breakpoint the label narrows to 84px, tiles shrink to 68px with 22px logos, gutters tighten to 14px, and the legend wraps, so the full board stays usable at 390px.

### Named Rules

**The One-Column Annual Rule.** The board is a single ruled column at every width. Narrow screens shrink cells, never the page: no sidebars, no multi-column grids, no cards.

## Elevation & Depth

The system is flat except for one structural shadow: the tooltip card floats above the board on `3px 6px 24px rgba(0, 0, 0, 0.28)`. Everything else carries depth by tonal tint (tile grounds), the weight of the rules, and the tint grounds of the tier plates. Tiles lift 1px on hover; nothing else moves off the page.

### Shadow Vocabulary

- **Tooltip card** (`box-shadow: 3px 6px 24px rgba(0, 0, 0, 0.28)`): the ink detail card only, above or below its tile.

### Named Rules

**The One Shadow Rule.** Only the tooltip casts. If a new element seems to need a shadow, it needs a rule, a wash, or a tint instead.

## Shapes

Corners step with the component's weight: lens chips full pills (999px), tiles and the tooltip comfortably round (10px), tier label cells softly squared (8px), logo fallbacks small tiles (6px), legend plates crisp (5px), tooltip tags and the focus outline sharp (4px). Hierarchy still lives in the rules: 4px annual rules open and close the page, a 2px rule opens the board, 1px hairlines divide tier rows and underline the legend. Borders above 1px exist only as these horizontal rules, plus the chip rings and the open tile's action outline.

### Named Rules

**The Ruled Page Rule.** Weight carries hierarchy. When a new section needs emphasis, give it a heavier rule, never a heavier radius, border, or shadow.

## Components

### Chips

The only controls on the page: six pill tabs that re-cut the whole board with one tap.

- **Shape:** full pill (999px radius), 6px 14px padding, Barlow 500 at 0.875rem.
- **Idle:** transparent ground, 1px Chip Border ring, ink text.
- **Hover:** Row Wash ground, darker ring (gray-8).
- **Active:** Annual Blue solid fill with white text; hover deepens to Action Deep. State changes crossfade over 150ms on the standard ease.
- **Rationale (off-guidance, deliberate):** Radix assigns step 9 to solid fills and step 11 to text on light grounds; the build fills the active chip with blue-11 instead. Blue-9 (#0090ff) is too bright to hold white text at AA contrast (~3.3:1), while blue-11 carries it at ~4.8:1. Contrast won over step semantics, and the chip is the one place the system spends that deviation.

### Tier Plates

Letterpress legend markers, 1.6rem tall with 5px corners, Condensed 600 at 1rem. Tinted step-3 grounds with step-11 inks per the Tier Legend. Plates never take hover, focus, or motion — they are landmarks, not controls.

### Tier Label Cells

The tinted plate that opens each tier row: 8px corners, 8px 10px padding, at least 78px tall, stacked letter (Headline 1.5rem), band range (0.6875rem tabular), and model count (0.6875rem tabular at 85% opacity). Grounds and inks follow the Tier Legend per tier. The unranked foot's flat cell swaps the tint for a transparent ground with a dashed gray-7 ring.

### Model Tiles

Borderless 78px squares (68px below 640px) with 10px corners: a 24px company logo (22px narrow) over the short name in semibold 0.625rem Body copy clamped to two lines. Grounds are company tints at 10% over paper, deepening to 18% with a 1px lift on hover. The open tile takes a 2px Annual Blue outline. On a lens change, tiles enter in a top-down stagger (180ms scale-from-94% fade on the standard ease, 12ms per rank capped at 330ms). Tiles with no logo file show a 24px Miss Block with the company initial. Under `prefers-reduced-motion`, entrance and hover collapse to near-instant.

### Tooltip Card

One fixed 248px ink card with light-on-dark text, 10px corners, 12px 14px padding, and the system's only shadow. It carries the model name (0.9375rem semibold), the maker line, a two-column grid of rank ("#01 of N"), lens value, gap, and tier-plus-band, reasoning/open badges with the release date, and one AA link in Tooltip Link blue. It flips above or below its tile with an 8px viewport margin, opens on hover or focus, pins on tap, and closes on Escape, scroll, or an outside press. Motion is enter-only: a 160ms rise from 5px (from below when the card sits above, mirrored when below), near-instant under reduced motion.

### Tier Bands

Score bands, not head counts. Band width is a nice step near max / 7, each boundary snaps to the largest score gap within 40% of the width, wild spreads (context) band in log space, and trailing empty tiers drop while middle gaps render as slim empty rows. Ranges set in the label cells in tabular figures ("upper – lower", or ≤ / ≥ on the open end, mirrored for lower-wins lenses).

### Tier Legend

The fixed index under the masthead title: seven plates in S–F order at 10px gaps, each with its live per-tier model count in tabular Soft Ink at 0.75rem. Counts re-render per lens; plates never change.

### Masthead & Colophon

The annual frame, tightened for one-screen density. The masthead opens with a 4px rule, sets the Display title left against the edition line right ("Edition {date} · {n} models · Data: Artificial Analysis" at 0.8125rem tabular Soft Ink), and rules the legend off with a hairline. The colophon closes with a 4px rule and two 0.75rem Soft Ink lines: snapshot date, source, the max/7 tiering method, and the refresh command.

### Unranked Foot

Models with no score for the active lens gather in a final tier row with the flat dashed label cell ("–" / "No score"), their tiles wrapping in the field beside it — present but out of the ranked order. Their tooltips swap the grid for a flat "No score this edition" notice.

### Focus & Selection

Browser surfaces ship themed: 2px Focus Ring outlines with 2px offset (4px corners) on visible focus, Selection Wash ground with deep blue text on selection, and link underlines offset 3px. The open tile's 2px Annual Blue outline doubles as its place marker.

## Do's and Don'ts

Concrete guardrails from the shipped build. New screens inherit them as stated.

### Do:

- **Do** set every numeral in tabular figures — ranks, values, gaps, counts, ranges, dates.
- **Do** reuse the plate tokens for any new tier marker, and keep S red through F gray in fixed order.
- **Do** tint tile grounds from the snapshot's company ink at 10% over paper (18% hover), falling back to plain paper.
- **Do** size tiles 78px desktop / 68px narrow with 10px corners, borderless, names clamped to two lines.
- **Do** keep the tooltip a fixed 248px ink card with enter-only motion and the one recorded shadow.
- **Do** ripple lens changes top-down (180ms entrance, 12ms per rank capped at 330ms) on the standard ease, with the reduced-motion path intact.
- **Do** keep the full board usable at 390px: legend wraps, labels narrow to 84px, tiles shrink to 68px.
- **Do** theme focus, selection, and underline offset from the palette on every new surface.

### Don't:

- **Don't** restyle, reorder, or recolor tier plates per lens — the legend is fixed.
- **Don't** spend Annual Blue outside the active chip, the open tile's outline, the E plate's letterpress ink, selection, and focus.
- **Don't** add a second shadow or any glow; only the tooltip casts.
- **Don't** set numerals in proportional figures or let names push past two lines — names clamp.
- **Don't** draw vertical accent borders or borders above 1px except the horizontal annual and section rules, the chip rings, and the open tile's outline.
- **Don't** invent company colors; un-inked companies take plain paper until the snapshot inks them.
