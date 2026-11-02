import { useEffect, useMemo, useState } from 'react'
import {
  LENSES,
  bands,
  data,
  gapCopy,
  rank,
  type Lens,
  type LensId,
  type Model,
  type Ranked,
} from './lib/tiers'

interface TipState {
  slug: string
  x: number
  y: number
  above: boolean
  pinned: boolean
}

function Logo({ model }: { model: Model }) {
  const co = data.companies[model.company]
  if (!co?.logo) {
    return (
      <span className="logo-miss" aria-hidden="true">
        {(co?.name || model.shortName).slice(0, 1)}
      </span>
    )
  }
  return <img className="logo" src={co.logo} alt="" loading="lazy" width={28} height={28} />
}

function tilePos(anchor: HTMLElement): { x: number; y: number; above: boolean } {
  const r = anchor.getBoundingClientRect()
  const w = 248
  const h = 210
  const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8)
  const above = r.top > h + 12
  return { x, y: above ? r.top - 10 : r.bottom + 10, above }
}

interface TileInfo {
  value: string
  rank: number
  gap: string
  tier: string
  band: string
}

function Tile({
  model,
  delay,
  tipOpen,
  onHover,
  onLeave,
  onToggle,
}: {
  model: Model
  delay: number
  tipOpen: boolean
  onHover: (slug: string, anchor: HTMLElement) => void
  onLeave: () => void
  onToggle: (slug: string, anchor: HTMLElement) => void
}) {
  const co = data.companies[model.company]
  return (
    <button
      type="button"
      className={`tile${tipOpen ? ' is-open' : ''}`}
      style={{ '--d': `${delay}ms`, '--tint': co?.color || undefined } as React.CSSProperties}
      aria-describedby={tipOpen ? `tip-${model.slug}` : undefined}
      onMouseEnter={(e) => onHover(model.slug, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(model.slug, e.currentTarget)}
      onBlur={onLeave}
      onClick={(e) => onToggle(model.slug, e.currentTarget)}
    >
      <Logo model={model} />
      <span className="tile-name">{model.shortName}</span>
    </button>
  )
}

function Tooltip({
  model,
  lens,
  info,
  pos,
  total,
}: {
  model: Model
  lens: Lens
  info: TileInfo | null
  pos: TipState
  total: number
}) {
  const co = data.companies[model.company]
  return (
    <div
      id={`tip-${model.slug}`}
      role="tooltip"
      className={`tip${pos.above ? ' is-above' : ' is-below'}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` } as React.CSSProperties}
    >
      <p className="tip-name">{model.shortName}</p>
      <p className="tip-co">{co?.name || 'Unknown maker'}</p>
      {info ? (
        <dl className="tip-grid">
          <div>
            <dt>Rank</dt>
            <dd>
              #{String(info.rank).padStart(2, '0')} of {total}
            </dd>
          </div>
          <div>
            <dt>{lens.label}</dt>
            <dd>{info.value}</dd>
          </div>
          <div>
            <dt>Gap</dt>
            <dd>{info.gap}</dd>
          </div>
          <div>
            <dt>Tier</dt>
            <dd>
              {info.tier} · {info.band}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="tip-flat">No {lens.label.toLowerCase()} score this edition.</p>
      )}
      <p className="tip-meta">
        {model.reasoning && <span className="tag">reasoning</span>}
        {model.openWeights && <span className="tag">open</span>}
        {model.releaseDate && <span className="tip-rel">Rel. {model.releaseDate}</span>}
      </p>
      <a className="tip-link" href={model.url} target="_blank" rel="noreferrer">
        Open on Artificial Analysis
      </a>
    </div>
  )
}

export default function App() {
  const [lensId, setLensId] = useState<LensId>('intelligence')
  const [tip, setTip] = useState<TipState | null>(null)
  const lens = LENSES.find((l) => l.id === lensId)!
  const { ranked, unranked } = useMemo(() => rank(lens, data.models), [lens])
  const rows = useMemo(() => bands(lens, ranked), [lens, ranked])

  useEffect(() => setTip(null), [lensId])

  useEffect(() => {
    if (!tip) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null)
    }
    const onScroll = () => setTip(null)
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('.tile') && !el.closest('.tip')) setTip(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('mousedown', onDown)
    }
  }, [tip])

  if (!data.models.length) {
    return (
      <main className="page">
        <h1>Model Tier List</h1>
        <p className="empty">No snapshot yet. Run pnpm fetch to print the first edition.</p>
      </main>
    )
  }

  const onHover = (slug: string, anchor: HTMLElement) => {
    setTip((cur) => {
      if (cur?.pinned) return cur
      return { slug, ...tilePos(anchor), pinned: false }
    })
  }
  const onLeave = () => {
    setTip((cur) => (cur && !cur.pinned ? null : cur))
  }
  const onToggle = (slug: string, anchor: HTMLElement) => {
    setTip((cur) => {
      if (cur?.pinned && cur.slug === slug) return null
      return { slug, ...tilePos(anchor), pinned: true }
    })
  }

  const onKeys = (e: React.KeyboardEvent) => {
    const i = LENSES.findIndex((l) => l.id === lensId)
    let n: number | null = null
    if (e.key === 'ArrowRight') n = (i + 1) % LENSES.length
    if (e.key === 'ArrowLeft') n = (i - 1 + LENSES.length) % LENSES.length
    if (e.key === 'Home') n = 0
    if (e.key === 'End') n = LENSES.length - 1
    if (n !== null) {
      e.preventDefault()
      setLensId(LENSES[n].id)
      document.getElementById(`chip-${LENSES[n].id}`)?.focus()
    }
  }

  const tipModel: Model | undefined = tip
    ? (ranked.find((r) => r.model.slug === tip.slug)?.model ??
      unranked.find((m) => m.slug === tip.slug))
    : undefined
  const tipRow: Ranked | undefined = tip
    ? ranked.find((r) => r.model.slug === tip.slug)
    : undefined
  const tipBand = tipRow ? rows.find((b) => b.rows.includes(tipRow)) : undefined
  const tipInfo: TileInfo | null =
    tipRow && tipBand
      ? {
          value: lens.format(tipRow.value),
          rank: tipRow.rank,
          gap: gapCopy(lens, tipRow.gap),
          tier: tipBand.tier,
          band: tipBand.label,
        }
      : null

  return (
    <main className="page">
      <header className="masthead">
        <div className="mast-top">
          <h1>Model Tier List</h1>
          <p className="edition">
            Edition {data.edition} · {data.models.length} models · Data:{' '}
            <a href={data.source} target="_blank" rel="noreferrer">
              Artificial Analysis
            </a>
          </p>
        </div>
        <ol className="legend" aria-label="Tier legend">
          {rows.map((b) => (
            <li key={b.tier} className="legend-item">
              <span className={`plate plate-${b.tier}`}>{b.tier}</span>
              <span className="legend-count">{b.rows.length}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="chips" role="tablist" aria-label="Metric lens" onKeyDown={onKeys}>
        {LENSES.map((l) => (
          <button
            key={l.id}
            id={`chip-${l.id}`}
            role="tab"
            aria-selected={l.id === lensId}
            className={`chip${l.id === lensId ? ' is-on' : ''}`}
            onClick={() => setLensId(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="hint" role="tabpanel" aria-live="polite">
        {lens.hint}
      </p>

      <div className="board">
        {rows.map((b) => (
          <section key={`${lensId}-${b.tier}`} className="tier" aria-label={`Tier ${b.tier}`}>
            <div className={`tier-label tier-label-${b.tier}`}>
              <span className="tier-letter">{b.tier}</span>
              <span className="tier-range">{b.label}</span>
              <span className="tier-count">
                {b.rows.length} model{b.rows.length === 1 ? '' : 's'}
              </span>
            </div>
            {b.empty ? (
              <p className="tier-empty">No models in this band.</p>
            ) : (
              <div className="tiles">
                {b.rows.map((r) => (
                  <Tile
                    key={r.model.slug}
                    model={r.model}
                    delay={Math.min(r.rank * 12, 330)}
                    tipOpen={tip?.slug === r.model.slug}
                    onHover={onHover}
                    onLeave={onLeave}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {unranked.length > 0 && (
        <section className="tier tier-flat" aria-label="Unranked models">
          <div className="tier-label tier-label-flat">
            <span className="tier-letter">–</span>
            <span className="tier-range">No score</span>
            <span className="tier-count">
              {unranked.length} model{unranked.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="tiles">
            {unranked.map((m, i) => (
              <Tile
                key={m.slug}
                model={m}
                delay={Math.min((ranked.length + i) * 12, 330)}
                tipOpen={tip?.slug === m.slug}
                onHover={onHover}
                onLeave={onLeave}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      )}

      {tip && tipModel && (
        <Tooltip model={tipModel} lens={lens} info={tipInfo} pos={tip} total={ranked.length} />
      )}

      <footer className="colophon">
        <p>
          Snapshot {data.fetchedAt.slice(0, 10)} from {data.source.replace('https://', '')} ·
          Tiers are score bands in steps of max / 7, snapped to nearby gaps. Hover or tap
          a tile for detail.
        </p>
        <p>Refresh: pnpm fetch.</p>
      </footer>
    </main>
  )
}
