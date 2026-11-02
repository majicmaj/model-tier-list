import snapshot from '../data/snapshot.json'

export type LensId = 'intelligence' | 'speed' | 'price' | 'latency' | 'context' | 'value'

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
export function rank(lens: Lens, models: Model[]): { ranked: Ranked[]; unranked: Model[] } {
  const scored = models.filter((m) => m[lens.id] !== null) as Array<
    Model & Record<LensId, number>
  >
  scored.sort((a, b) =>
    lens.higherBetter ? b[lens.id] - a[lens.id] : a[lens.id] - b[lens.id],
  )
  const best = scored.length ? scored[0][lens.id] : 0
  const ranked: Ranked[] = scored.map((model, i) => {
    const value = model[lens.id]
    return {
      model,
      value,
      rank: i + 1,
      gap: lens.higherBetter ? best - value : value - best,
    }
  })
  const unranked = models.filter((m) => m[lens.id] === null)
  return { ranked, unranked }
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
    if (log) return Math.log10(v)
    return lens.higherBetter ? v : -v
  }
  const inv = (s: number): number => {
    if (log) return 10 ** s
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
    if (lens.higherBetter || log) {
      const upper = j === 0 ? top : bounds[j - 1]
      if (isLast && j > 0) return `≤ ${fmt(inv(upper))}`
      return `${fmt(inv(upper))} – ${fmt(inv(bounds[j]))}`
    }
    const lower = j === 0 ? top : bounds[j - 1]
    if (isLast && j > 0) return `≥ ${fmt(-lower)}`
    return `${fmt(-lower)} – ${fmt(-bounds[j])}`
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
