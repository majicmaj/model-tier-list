import { useEffect, useMemo, useState } from 'react'
import {
  HLENSES,
  LENSES,
  agentData,
  bands,
  data,
  gapCopy,
  rank,
  type Company,
  type Lens,
  type LensId,
  type Model,
  type Ranked,
} from './lib/tiers'

type Page = 'models' | 'harnesses'

interface TipState {
  slug: string
  x: number
  y: number
  above: boolean
  pinned: boolean
}

function Logo({ model, makers }: { model: Model; makers: Record<string, Company> }) {
  const co = makers[model.company]
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

function lensPos(anchor: HTMLElement): { x: number; y: number; above: boolean } {
  const r = anchor.getBoundingClientRect()
  const w = 260
  const h = 44
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
  makers,
  delay,
  tipOpen,
  onHover,
  onLeave,
  onToggle,
}: {
  model: Model
  makers: Record<string, Company>
  delay: number
  tipOpen: boolean
  onHover: (slug: string, anchor: HTMLElement) => void
  onLeave: () => void
  onToggle: (slug: string, anchor: HTMLElement) => void
}) {
  const co = makers[model.company]
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
      <Logo model={model} makers={makers} />
      <span className="tile-name">{model.shortName}</span>
    </button>
  )
}

function Tooltip({
  model,
  makers,
  lens,
  info,
  pos,
  total,
}: {
  model: Model
  makers: Record<string, Company>
  lens: Lens
  info: TileInfo | null
  pos: TipState
  total: number
}) {
  const co = makers[model.company]
  return (
    <div
      id={`tip-${model.slug}`}
      role="tooltip"
      className={`tip${pos.above ? ' is-above' : ' is-below'}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` } as React.CSSProperties}
    >
      <p className="tip-name">{model.detail ? model.name : model.shortName}</p>
      <p className="tip-co">{co?.name || 'Unknown maker'}</p>
      {model.detail ? <p className="tip-detail">{model.detail}</p> : null}
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
      {(model.reasoning || model.openWeights || model.releaseDate) && (
        <p className="tip-meta">
          {model.reasoning && <span className="tag">reasoning</span>}
          {model.openWeights && <span className="tag">open</span>}
          {model.releaseDate && <span className="tip-rel">Rel. {model.releaseDate}</span>}
        </p>
      )}
      <a className="tip-link" href={model.url} target="_blank" rel="noreferrer">
        Open on Artificial Analysis
      </a>
    </div>
  )
}

interface LensTipState {
  id: LensId
  x: number
  y: number
  above: boolean
  pinned: boolean
}

export default function App() {
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === '#/harnesses' ? 'harnesses' : 'models',
  )
  const [lensId, setLensId] = useState<LensId>('intelligence')
  const [tip, setTip] = useState<TipState | null>(null)
  const [lensTip, setLensTip] = useState<LensTipState | null>(null)
  const ds = page === 'models' ? data : agentData
  const lenses = page === 'models' ? LENSES : HLENSES
  const lens = lenses.find((l) => l.id === lensId) ?? lenses[0]
  const { ranked, unranked } = useMemo(() => rank(lens, ds.models), [lens, ds])
  const rows = useMemo(() => bands(lens, ranked), [lens, ranked])

  const goPage = (p: Page) => {
    if (p === page) return
    setPage(p)
    setLensId('intelligence')
    setTip(null)
    setLensTip(null)
    window.location.hash = p === 'harnesses' ? '#/harnesses' : '#/'
  }

  useEffect(() => {
    setTip(null)
    setLensTip((cur) => (cur && cur.id !== lensId ? null : cur))
  }, [lensId])

  useEffect(() => {
    if (!tip && !lensTip) return
    const close = () => {
      setTip(null)
      setLensTip(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onScroll = () => close()
    const outside = (el: HTMLElement): boolean =>
      !el.closest('.tile') &&
      !el.closest('.tip') &&
      !el.closest('.chip') &&
      !el.closest('.lens-tip')
    const onDown = (e: MouseEvent) => {
      if (outside(e.target as HTMLElement)) close()
    }
    // iOS Safari skips mousedown on plain page areas, so touch taps need this.
    const onTouchEnd = (e: TouchEvent) => {
      if (outside(e.target as HTMLElement)) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [tip, lensTip])

  if (!ds.models.length) {
    return (
      <main className="page">
        <h1>Model Tier List</h1>
        <p className="empty">No data yet.</p>
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
    setLensTip(null)
    setTip((cur) => {
      if (cur?.pinned && cur.slug === slug) return null
      return { slug, ...tilePos(anchor), pinned: true }
    })
  }

  const onChipHover = (id: LensId, anchor: HTMLElement) => {
    setLensTip((cur) => {
      if (cur?.pinned) return cur
      return { id, ...lensPos(anchor), pinned: false }
    })
  }
  const onChipLeave = () => {
    setLensTip((cur) => (cur && !cur.pinned ? null : cur))
  }
  const onChipClick = (id: LensId, anchor: HTMLElement) => {
    if (id === lensId) {
      setTip(null)
      setLensTip((cur) => {
        if (cur?.pinned && cur.id === id) return null
        return { id, ...lensPos(anchor), pinned: true }
      })
    } else {
      setLensTip(null)
      setLensId(id)
    }
  }

  const onKeys = (e: React.KeyboardEvent) => {
    const i = lenses.findIndex((l) => l.id === lens.id)
    let n: number | null = null
    if (e.key === 'ArrowRight') n = (i + 1) % lenses.length
    if (e.key === 'ArrowLeft') n = (i - 1 + lenses.length) % lenses.length
    if (e.key === 'Home') n = 0
    if (e.key === 'End') n = lenses.length - 1
    if (n !== null) {
      e.preventDefault()
      setLensId(lenses[n].id)
      document.getElementById(`chip-${lenses[n].id}`)?.focus()
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
      <h1 className="sr-only">Model and Harness Tier List</h1>
      <div className="pages" role="tablist" aria-label="Leaderboard">
        {(['models', 'harnesses'] as Page[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={page === p}
            className={`page-tab${page === p ? ' is-on' : ''}`}
            onClick={() => goPage(p)}
          >
            {p === 'models' ? 'Models' : 'Harnesses'}
          </button>
        ))}
      </div>
      <div className="chips" role="tablist" aria-label="Metric lens" onKeyDown={onKeys}>
        {lenses.map((l) => (
          <button
            key={l.id}
            id={`chip-${l.id}`}
            role="tab"
            aria-selected={l.id === lens.id}
            aria-describedby={lensTip?.id === l.id ? 'lens-tip' : undefined}
            className={`chip${l.id === lens.id ? ' is-on' : ''}`}
            onMouseEnter={(e) => onChipHover(l.id, e.currentTarget)}
            onMouseLeave={onChipLeave}
            onFocus={(e) => onChipHover(l.id, e.currentTarget)}
            onBlur={onChipLeave}
            onClick={(e) => onChipClick(l.id, e.currentTarget)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {lens.hint}
      </p>

      <div className="board">
        {rows.map((b) => (
          <section
            key={`${page}-${lens.id}-${b.tier}`}
            className="tier"
            aria-label={`Tier ${b.tier}`}
          >
            <div className={`tier-label tier-label-${b.tier}`}>
              <span className="tier-letter">{b.tier}</span>
              <span className="tier-range">{b.label}</span>
            </div>
            {b.empty ? (
              <p className="tier-empty">
                {page === 'models' ? 'No models in this band.' : 'No harnesses in this band.'}
              </p>
            ) : (
              <div className="tiles">
                {b.rows.map((r) => (
                  <Tile
                    key={r.model.slug}
                    model={r.model}
                    makers={ds.companies}
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
        <section
          className="tier tier-flat"
          aria-label={page === 'models' ? 'Unranked models' : 'Unranked harnesses'}
        >
          <div className="tier-label tier-label-flat">
            <span className="tier-letter">–</span>
            <span className="tier-range">No score</span>
          </div>
          <div className="tiles">
            {unranked.map((m, i) => (
              <Tile
                key={m.slug}
                model={m}
                makers={ds.companies}
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
        <Tooltip
          model={tipModel}
          makers={ds.companies}
          lens={lens}
          info={tipInfo}
          pos={tip}
          total={ranked.length}
        />
      )}

      {lensTip && (
        <div
          id="lens-tip"
          role="tooltip"
          className={`lens-tip${lensTip.above ? ' is-above' : ' is-below'}`}
          style={{ left: `${lensTip.x}px`, top: `${lensTip.y}px` } as React.CSSProperties}
        >
          {lenses.find((l) => l.id === lensTip.id)?.hint}
        </div>
      )}

      <footer className="colophon">
        <p>
          Data:{' '}
          <a href={ds.source} target="_blank" rel="noreferrer">
            Artificial Analysis
          </a>{' '}
          · Updated {ds.edition}
        </p>
      </footer>
    </main>
  )
}
