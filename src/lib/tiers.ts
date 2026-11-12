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
}

export interface Model {
  slug: string
  name: string
  shortName: string
  added?: string | null
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
export const agentData = agentSnapshot as Snapshot

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
  },
  {
    id: 'speed',
    label: 'Speed',
    hint: 'Median output tokens per second · higher wins',
    higherBetter: true,
    format: (v) => `${Math.round(v)} t/s`,
  },
  {
    id: 'price',
    label: 'Price',
    hint: 'Blended USD per 1M tokens · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
  },
  {
    id: 'latency',
    label: 'Latency',
    hint: 'Median seconds to first chunk · lower wins',
    higherBetter: false,
    format: (v) => `${v.toFixed(2)}s`,
  },
  {
    id: 'context',
    label: 'Context',
    hint: 'Context window tokens · higher wins',
    higherBetter: true,
    format: (v) => compact(v),
  },
  {
    id: 'value',
    label: 'Value',
    hint: 'Weighted USD per index task · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
  },
  {
    id: 'compound',
    label: 'Compound',
    hint: '60% intelligence · 25% value · 15% speed · higher wins',
    higherBetter: true,
    format: (v) => v.toFixed(1),
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
  },
  {
    id: 'price',
    label: 'Cost',
    hint: 'Mean USD per task · lower wins',
    higherBetter: false,
    format: (v) => `$${v.toFixed(2)}`,
  },
  {
    id: 'latency',
    label: 'Time',
    hint: 'Mean wall time per task · lower wins',
    higherBetter: false,
    format: (v) => duration(v),
  },
  {
    id: 'speed',
    label: 'Steps',
    hint: 'Mean steps per task · lower wins',
    higherBetter: false,
    format: (v) => String(Math.round(v)),
  },
  {
    id: 'compound',
    label: 'Compound',
    hint: '60% score · 25% cost · 15% time · higher wins',
    higherBetter: true,
    format: (v) => v.toFixed(1),
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
    values
      ? (values.get(m.slug) ?? null)
      : ((m as unknown as Record<string, number | null>)[lens.id] ?? null)
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

export interface CompoundPart {
  field: Exclude<LensId, 'compound'>
  weight: number
  higherBetter: boolean
  star: string
}

export interface CompoundDef {
  parts: CompoundPart[]
}

export const MODEL_COMPOUND: CompoundDef = {
  parts: [
    { field: 'intelligence', weight: 0.6, higherBetter: true, star: 'Smartest' },
    { field: 'value', weight: 0.25, higherBetter: false, star: 'Best value' },
    { field: 'speed', weight: 0.15, higherBetter: true, star: 'Fastest' },
  ],
}

export const HARNESS_COMPOUND: CompoundDef = {
  parts: [
    { field: 'intelligence', weight: 0.6, higherBetter: true, star: 'Top score' },
    { field: 'price', weight: 0.25, higherBetter: false, star: 'Cheapest' },
    { field: 'latency', weight: 0.15, higherBetter: false, star: 'Quickest' },
  ],
}

/**
 * Weighted blend, 0 to 100. Each part scales min-max across the board, so a
 * dollar never outshouts an index point. Missing parts drop out and the
 * surviving weights renormalize; entries with no parts stay unranked.
 */
export function compoundValues(def: CompoundDef, models: Model[]): Map<string, number | null> {
  const stats = def.parts.map((p) => {
    const vs = models.map((m) => m[p.field]).filter((v): v is number => v !== null)
    return { min: Math.min(...vs), max: Math.max(...vs), n: vs.length }
  })
  const out = new Map<string, number | null>()
  for (const m of models) {
    let num = 0
    let den = 0
    def.parts.forEach((p, i) => {
      const v = m[p.field]
      if (v === null || !stats[i].n) return
      const { min, max } = stats[i]
      const norm =
        max === min ? 1 : p.higherBetter ? (v - min) / (max - min) : (max - v) / (max - min)
      num += p.weight * norm
      den += p.weight
    })
    out.set(m.slug, den > 0 ? (num / den) * 100 : null)
  }
  return out
}

/**
 * Runaway component leaders only: rank 1 beats rank 2 by 15% or more of the
 * bigger value. Close fights earn no star.
 */
export function compoundStars(def: CompoundDef, models: Model[]): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const p of def.parts) {
    const vs = models.filter((m) => m[p.field] !== null)
    if (vs.length < 2) continue
    const sorted = [...vs].sort((a, b) => {
      const [x, y] = [a[p.field]!, b[p.field]!]
      return p.higherBetter ? y - x : x - y
    })
    const [a, b] = [sorted[0][p.field]!, sorted[1][p.field]!]
    if (Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) >= 0.15) {
      out.set(sorted[0].slug, [...(out.get(sorted[0].slug) ?? []), p.star])
    }
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

/** Signed gap copy; the leader reads as lead. */
export function gapCopy(lens: Lens, gap: number): string {
  if (gap === 0) return 'lead'
  return lens.higherBetter ? `−${lens.format(gap)}` : `+${lens.format(gap)}`
}
