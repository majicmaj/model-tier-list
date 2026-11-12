import snapshot from '../data/snapshot.json'
import agentSnapshot from '../data/agents.json'

export type LensId =
  | 'intelligence'
  | 'speed'
  | 'price'
  | 'latency'
  | 'context'
  | 'value'
  | 'compound'

export interface Lens {
  id: LensId
  label: string
  hint: string
  higherBetter: boolean
  format: (v: number) => string
  /** Raw score for one entry; compound blends bypass this via a values map. */
  get: (m: Model) => number | null
}

export interface PrevScores {
  intelligence: number | null
  speed: number | null
  price: number | null
  latency: number | null
  context: number | null
  value: number | null
}

export interface Model {
  slug: string
  name: string
  shortName: string
  added?: string | null
  prev?: PrevScores | null
  version?: string | null
  modelLabel?: string | null
  modelMakers?: string[]
  company: string
  url: string
  releaseDate: string | null
  reasoning: boolean
  openWeights: boolean
  intelligence: number | null
  speed: number | null
  price: number | null
  latency: number | null
  context: number | null
  value: number | null
}

export interface Company {
  name: string
  logo: string | null
  color: string | null
}

export interface Snapshot {
  edition: string
  fetchedAt: string
  source: string
  priceField: string
  models: Model[]
  companies: Record<string, Company>
}

export const data = snapshot as Snapshot

/** A harness run: harness maker in `company`, model side in `modelLabel`. */
export type HarnessRun = Model & { modelLabel: string | null; modelMakers: string[] }

export interface HarnessSnapshot extends Snapshot {
  models: HarnessRun[]
}

export const agentData = agentSnapshot as HarnessSnapshot

/** True when the entry first appeared within 7 days of the edition date. */
export const isNew = (edition: string, added?: string | null): boolean => {
  if (!added) return false
  const ms = Date.parse(edition) - Date.parse(added)
  return ms >= 0 && ms <= 7 * 86400000
}

const compact = (v: number): string => {
  if (v >= 1_000_000) {
    const m = v / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`
  }
  if (v >= 1_000) {
    const k = v / 1_000
    return `${Number.isInteger(k) ? k : k.toFixed(0)}K`
  }
  return String(Math.round(v))
}

export const LENSES: Lens[] = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    hint: 'AA Intelligence Index · higher wins',
    higherBetter: true,
    format: (v) => v.toFixed(1),
    get: (m) => m.intelligence,
  },
  {
    id: 'speed',
    label: 'Speed',
    hint: 'Median output tokens per second · higher wins',
    higherBetter: true,
    format: (v) => `${Math.round(v)} t/s`,
    get: (m) => m.speed,
  },
  {
    id: 'price',
    label: 'Price',
    hint: 'Blended USD per 1M tokens · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
    get: (m) => m.price,
  },
  {
    id: 'latency',
    label: 'Latency',
    hint: 'Median seconds to first chunk · lower wins',
    higherBetter: false,
    format: (v) => `${v.toFixed(2)}s`,
    get: (m) => m.latency,
  },
  {
    id: 'context',
    label: 'Context',
    hint: 'Context window tokens · higher wins',
    higherBetter: true,
    format: (v) => compact(v),
    get: (m) => m.context,
  },
  {
    id: 'value',
    label: 'Value',
    hint: 'Weighted USD per index task · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
    get: (m) => m.value,
  },
  {
    id: 'compound',
    label: 'Compound',
    hint: '60% intelligence · 25% value · 15% speed · higher wins',
    higherBetter: true,
    format: (v) => v.toFixed(1),
    get: () => null,
  },
]

const duration = (s: number): string => {
  if (s >= 3600) {
    const h = Math.floor(s / 3600)
    const m = Math.round((s % 3600) / 60)
    return m ? `${h}h ${m}m` : `${h}h`
  }
  if (s >= 90) return `${Math.round(s / 60)}m`
  return `${Math.round(s)}s`
}

/**
 * Harness lenses reuse the shared score fields: intelligence holds the AA
 * index score, price the mean USD per task, latency the mean wall time per
 * task, and speed the mean step count per task.
 */
export const HLENSES: Lens[] = [
  {
    id: 'intelligence',
    label: 'Score',
    hint: 'Share of eval tasks done well · higher wins',
    higherBetter: true,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    get: (m) => m.intelligence,
  },
  {
    id: 'price',
    label: 'Cost',
    hint: 'Mean USD per task · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
    get: (m) => m.price,
  },
  {
    id: 'latency',
    label: 'Time',
    hint: 'Mean wall time per task · lower wins',
    higherBetter: false,
    format: (v) => duration(v),
    get: (m) => m.latency,
  },
  {
    id: 'speed',
    label: 'Steps',
    hint: 'Mean steps per task · lower wins',
    higherBetter: false,
    format: (v) => String(Math.round(v)),
    get: (m) => m.speed,
  },
  {
    id: 'compound',
    label: 'Compound',
    hint: '60% score · 25% cost · 15% time · higher wins',
    higherBetter: true,
    format: (v) => v.toFixed(1),
    get: () => null,
  },
]

export const TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const
export type Tier = (typeof TIERS)[number]

export interface Ranked {
  model: Model
  value: number
  rank: number
  gap: number
}

export interface Band {
  tier: Tier
  rows: Ranked[]
  label: string
  empty: boolean
}

/** Sort best first for the lens; nulls drop to the unranked foot. */
export function rank(
  lens: Lens,
  models: Model[],
  values?: Map<string, number | null>,
): { ranked: Ranked[]; unranked: Model[] } {
  const get = (m: Model): number | null =>
    values ? (values.get(m.slug) ?? null) : lens.get(m)
  const scored = models.filter((m) => get(m) !== null)
  scored.sort((a, b) => {
    const [x, y] = [get(a)!, get(b)!]
    return lens.higherBetter ? y - x : x - y
  })
  const best = scored.length ? get(scored[0])! : 0
  const ranked: Ranked[] = scored.map((model, i) => {
    const value = get(model)!
    return {
      model,
      value,
      rank: i + 1,
      gap: lens.higherBetter ? best - value : value - best,
    }
  })
  const unranked = models.filter((m) => get(m) === null)
  return { ranked, unranked }
}

export type StarIcon = 'crown' | 'dollar' | 'bolt'

export interface CompoundPart {
  field: LensField
  weight: number
  higherBetter: boolean
  star: string
  icon: StarIcon
}

export interface StarMark {
  label: string
  icon: StarIcon
}

export interface CompoundDef {
  parts: CompoundPart[]
}

export const MODEL_COMPOUND: CompoundDef = {
  parts: [
    { field: 'intelligence', weight: 0.6, higherBetter: true, star: 'Smartest', icon: 'crown' },
    { field: 'value', weight: 0.25, higherBetter: false, star: 'Best value', icon: 'dollar' },
    { field: 'speed', weight: 0.15, higherBetter: true, star: 'Fastest', icon: 'bolt' },
  ],
}

export const HARNESS_COMPOUND: CompoundDef = {
  parts: [
    { field: 'intelligence', weight: 0.6, higherBetter: true, star: 'Top score', icon: 'crown' },
    { field: 'price', weight: 0.25, higherBetter: false, star: 'Cheapest', icon: 'dollar' },
    { field: 'latency', weight: 0.15, higherBetter: false, star: 'Quickest', icon: 'bolt' },
  ],
}

/**
 * Percentile rank per slug, 0 to 100, best first. Ties share the mid rank,
 * so one wild outlier cannot squash the rest of the board.
 */
function percentiles(
  models: Model[],
  field: CompoundPart['field'],
  higherBetter: boolean,
): Map<string, number> {
  const rows = models
    .filter((m) => m[field] !== null)
    .sort((a, b) => {
      const [x, y] = [a[field]!, b[field]!]
      return higherBetter ? y - x : x - y
    })
  const out = new Map<string, number>()
  if (rows.length < 2) {
    for (const m of rows) out.set(m.slug, 100)
    return out
  }
  let i = 0
  while (i < rows.length) {
    let j = i
    while (j + 1 < rows.length && rows[j + 1][field] === rows[i][field]) j++
    const mid = (i + j) / 2
    const pct = ((rows.length - 1 - mid) / (rows.length - 1)) * 100
    for (let k = i; k <= j; k++) out.set(rows[k].slug, pct)
    i = j + 1
  }
  return out
}

/**
 * Weighted blend, 0 to 100. Each part ranks by board percentile, so a
 * dollar never outshouts an index point and outliers cannot squash the
 * scale. A missing part fills with the median (50); entries with no real
 * part stay unranked.
 */
export function compoundValues(def: CompoundDef, models: Model[]): Map<string, number | null> {
  const parts = def.parts.map((p) => percentiles(models, p.field, p.higherBetter))
  const out = new Map<string, number | null>()
  for (const m of models) {
    let sum = 0
    let real = 0
    def.parts.forEach((p, i) => {
      const pct = parts[i].get(m.slug)
      if (pct === undefined) {
        sum += p.weight * 50
      } else {
        sum += p.weight * pct
        real++
      }
    })
    out.set(m.slug, real > 0 ? sum : null)
  }
  return out
}

/** Slugs whose blend fills at least one part with the median. */
export function compoundPartial(def: CompoundDef, models: Model[]): Set<string> {
  const out = new Set<string>()
  for (const m of models) {
    if (def.parts.some((p) => m[p.field] === null)) out.add(m.slug)
  }
  return out
}

/**
 * Last edition rank per slug for this lens, over entries held in both
 * editions. Fresh entries have no move; removed entries do not count.
 */
export function prevRanks(lens: Lens, def: CompoundDef, models: Model[]): Map<string, number> {
  const held = models.filter((m) => m.prev)
  const then = held.map((m) => ({ ...m, ...m.prev }))
  const { ranked } =
    lens.id === 'compound'
      ? rank(lens, then, compoundValues(def, then))
      : rank(lens, then)
  return new Map(ranked.map((r) => [r.model.slug, r.rank]))
}

/** Signed move copy: positive climbs read ▲n, drops read ▼n. */
export function deltaCopy(delta: number): string {
  return `${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}`
}

/** First tokens that restate the maker logo, per company key. */
const BRAND_TOKENS: Record<string, string[]> = {
  openai: ['gpt'],
  google: ['gemini'],
  anthropic: ['Claude'],
  meta: ['muse'],
  xai: ['grok'],
  deepseek: ['deepseek'],
  alibaba: ['qwen'],
  mistral: ['mistral'],
  kimi: ['kimi'],
  tencent: ['tencent'],
  nvidia: ['nemotron'],
  ifm: ['k2'],
  microsoft: ['copilot'],
}

/** Split "Terra (Max)" into base plus effort; labels without parens hold none. */
export function splitEffort(label: string): { base: string; effort: string | null } {
  const m = label.match(/^(.*)\(([^()]*)\)\s*$/)
  if (!m) return { base: label.trim(), effort: null }
  return { base: m[1].trim(), effort: m[2].trim() || null }
}

/** Drop the brand token the logo already shows; keep the rest untouched. */
export function shortBase(base: string, company: string): string {
  const tokens = BRAND_TOKENS[company] ?? []
  const [first, ...rest] = base.split(/\s+/)
  if (!first || !rest.length) return base
  const low = first.toLowerCase()
  const hit = tokens.some((t) => low.startsWith(t.toLowerCase()))
  if (!hit) return base
  // A lone version or trim word ("4.7", "Max") says nothing; keep the brand.
  if (rest.length === 1 && /^([0-9]|max|pro|plus|mini|ultra)/i.test(rest[0])) return base
  return rest.join(' ')
}

/** "Devin Fusion CLI" reads "Devin Fusion"; product names stay whole. */
export function shortHarness(name: string): string {
  return name
    .replace(/\s+(cli|sdk\b.*|harness)$/i, '')
    .replace(/^(github|microsoft)\s+/i, '')
}

export interface DisplayName {
  primary: string
  secondary: string | null
}

/**
 * Tile copy. Runs lead with the harness, then the model. The effort tag
 * shows only when the board holds two or more efforts for that base.
 */
export function displayName(model: Model, multiEffort: Set<string>): DisplayName {
  const label = model.modelMakers ? model.modelLabel || model.shortName : model.shortName
  const { base, effort } = splitEffort(label)
  const company = model.modelMakers ? model.modelMakers[0] : model.company
  const short = shortBase(base, company)
  const key = short.toLowerCase()
  const tag = effort && multiEffort.has(key) ? effort : null
  if (!model.modelMakers) return { primary: short, secondary: tag }
  return { primary: shortHarness(model.name), secondary: tag ? `${short} · ${tag}` : short }
}

/** Bases on this board that carry more than one effort. */
export function multiEffortBases(entries: Model[]): Set<string> {
  const seen = new Map<string, Set<string>>()
  for (const m of entries) {
    const label = m.modelMakers ? m.modelLabel || m.shortName : m.shortName
    const { base, effort } = splitEffort(label)
    if (!effort) continue
    const company = m.modelMakers ? m.modelMakers[0] : m.company
    const key = shortBase(base, company).toLowerCase()
    const set = seen.get(key) ?? new Set<string>()
    set.add(effort.toLowerCase())
    seen.set(key, set)
  }
  const out = new Set<string>()
  for (const [key, set] of seen) {
    if (set.size > 1) out.add(key)
  }
  return out
}

/**
 * Component winners. The primary part crowns its outright best; value and
 * speed crown the best among entries at or above median smarts, so a weak
 * but cheap model cannot take the dollar.
 */
export function compoundStars(def: CompoundDef, models: Model[]): Map<string, StarMark[]> {
  const out = new Map<string, StarMark[]>()
  const give = (slug: string, mark: StarMark) => {
    out.set(slug, [...(out.get(slug) ?? []), mark])
  }
  const best = (rows: Model[], p: CompoundPart): Model | null => {
    if (!rows.length) return null
    return rows.reduce((a, b) => {
      const [x, y] = [a[p.field]!, b[p.field]!]
      return (p.higherBetter ? y - x : x - y) > 0 ? b : a
    })
  }
  const [first, ...rest] = def.parts
  const primary = models.filter((m) => m[first.field] !== null)
  const win = best(primary, first)
  if (win) give(win.slug, { label: first.star, icon: first.icon })
  const ranked = primary.map((m) => m[first.field]!).sort((a, b) => a - b)
  const median = ranked.length % 2
    ? ranked[(ranked.length - 1) / 2]
    : (ranked[ranked.length / 2 - 1] + ranked[ranked.length / 2]) / 2
  for (const p of rest) {
    const pool = primary.filter((m) => m[first.field]! >= median && m[p.field] !== null)
    const w = best(pool, p)
    if (w) give(w.slug, { label: p.star, icon: p.icon })
  }
  return out
}

function niceStep(x: number): number {
  if (!(x > 0)) return 1
  const p = 10 ** Math.floor(Math.log10(x))
  const f = x / p
  const m = f < 1.5 ? 1 : f < 2.75 ? 2 : f < 4 ? 2.5 : f < 7.5 ? 5 : 10
  return m * p
}

/**
 * Score bands, not head counts. Band width is a nice step near max / 7, so a
 * top score near 70 yields 10-point bands. Each boundary then snaps to the
 * largest score gap within 40% of the width, so bands respect clusters.
 * Lenses with a wild spread (context) band in log space instead.
 * Trailing empty tiers drop; middle gaps render as slim empty rows.
 */
type Scale = (v: number) => number

/** Even nominal bounds, each snapped to the widest near score gap. */
function snapBounds(ts: number[], top: number, w: number): number[] {
  const nominal: number[] = []
  for (let j = 1; j < TIERS.length; j++) nominal.push(top - j * w)
  const sorted = [...ts].sort((a, b) => b - a)
  const gaps: { mid: number; size: number }[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const size = sorted[i] - sorted[i + 1]
    if (size > 0) gaps.push({ mid: (sorted[i] + sorted[i + 1]) / 2, size })
  }
  const bounds: number[] = []
  let prev = top
  for (const nb of nominal) {
    let best = nb
    let bestSize = 0
    for (const g of gaps) {
      if (Math.abs(g.mid - nb) <= 0.4 * w && g.size > bestSize) {
        best = g.mid
        bestSize = g.size
      }
    }
    if (best >= prev) best = nb
    bounds.push(best)
    prev = best
  }
  return bounds
}

/** Drop each row into its band; report the last held tier. */
function assignTiers(
  ranked: Ranked[],
  t: Scale,
  bounds: number[],
): { rowsByTier: Ranked[][]; last: number } {
  const rowsByTier: Ranked[][] = TIERS.map(() => [])
  for (const r of ranked) {
    const s = t(r.value)
    let idx = TIERS.length - 1
    for (let j = 0; j < bounds.length; j++) {
      if (s > bounds[j]) {
        idx = j
        break
      }
    }
    rowsByTier[idx].push(r)
  }
  let last = rowsByTier.length - 1
  while (last > 0 && rowsByTier[last].length === 0) last--
  return { rowsByTier, last }
}

export function bands(lens: Lens, ranked: Ranked[]): Band[] {
  if (!ranked.length) return []
  const vals = ranked.map((r) => r.value)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const log = lo > 0 && hi / lo > 50
  const t = (v: number): number => {
    if (log) return lens.higherBetter ? Math.log10(v) : -Math.log10(v)
    return lens.higherBetter ? v : -v
  }
  const inv = (s: number): number => {
    if (log) return lens.higherBetter ? 10 ** s : 10 ** -s
    return lens.higherBetter ? s : -s
  }
  const ts = vals.map(t)
  const top = Math.max(...ts)
  const w = niceStep(Math.max(...ts.map((s) => Math.abs(s))) / TIERS.length)
  const bounds = snapBounds(ts, top, w)
  const { rowsByTier, last } = assignTiers(ranked, t, bounds)

  const fmt = lens.format
  const labels = TIERS.map((_, j) => {
    const isLast = j === last || j === TIERS.length - 1
    if (lens.higherBetter) {
      const upper = j === 0 ? top : bounds[j - 1]
      if (isLast && j > 0) return `≤ ${fmt(inv(upper))}`
      return `${fmt(inv(upper))} – ${fmt(inv(bounds[j]))}`
    }
    const lower = j === 0 ? top : bounds[j - 1]
    if (isLast && j > 0) return `≥ ${fmt(inv(lower))}`
    return `${fmt(inv(lower))} – ${fmt(inv(bounds[j]))}`
  })
  return TIERS.slice(0, last + 1).map((tier, j) => ({
    tier,
    rows: rowsByTier[j],
    label: labels[j],
    empty: rowsByTier[j].length === 0,
  }))
}

/**
 * Gap to the next better row. The leader reads its margin over #2, the rest
 * read their gap to the row above. Lone boards read a dash.
 */
export function gapNextCopy(lens: Lens, ranked: Ranked[], row: Ranked): string {
  if (ranked.length < 2) return '—'
  const pad = (n: number): string => `#${String(n).padStart(2, '0')}`
  if (row.rank === 1) {
    const d = Math.abs(row.value - ranked[1].value)
    return lens.higherBetter ? `+${lens.format(d)} · ${pad(2)}` : `−${lens.format(d)} · ${pad(2)}`
  }
  const above = ranked[row.rank - 2]
  const d = Math.abs(row.value - above.value)
  return lens.higherBetter
    ? `−${lens.format(d)} · ${pad(row.rank - 1)}`
    : `+${lens.format(d)} · ${pad(row.rank - 1)}`
}

export type LensField = Exclude<LensId, 'compound'>

export type FactIcon = 'metric' | 'model' | 'tag' | 'bolt' | 'clock' | 'list'

export interface FactDef {
  field: LensField
  label: string
  icon: FactIcon
  format: (v: number) => string
}

const lensFormat = (lenses: Lens[], id: LensField): ((v: number) => string) =>
  lenses.find((l) => l.id === id)!.format

/** Fixed fact rows for model tooltips: smarts, price, speed. */
export const MODEL_FACTS: FactDef[] = [
  { field: 'intelligence', label: 'Intelligence', icon: 'model', format: (v) => v.toFixed(1) },
  { field: 'price', label: '$/1M', icon: 'tag', format: (v) => `$${v.toFixed(2)}` },
  { field: 'speed', label: 'Speed', icon: 'bolt', format: (v) => `${Math.round(v)} t/s` },
]

/** Fixed fact rows for harness tooltips: score, cost, time, steps. */
export const HARNESS_FACTS: FactDef[] = [
  {
    field: 'intelligence',
    label: 'Score',
    icon: 'metric',
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  { field: 'price', label: 'Cost', icon: 'tag', format: (v) => `$${v.toFixed(2)}` },
  { field: 'latency', label: 'Time', icon: 'clock', format: lensFormat(HLENSES, 'latency') },
  { field: 'speed', label: 'Steps', icon: 'list', format: (v) => String(Math.round(v)) },
]
