import { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import {
  bands,
  gapCopy,
  rank,
  type Company,
  type Lens,
  type LensId,
  type Model,
  type Ranked,
} from './lib/tiers'

export interface BoardConfig {
  entries: Model[]
  makers: Record<string, Company>
  lenses: Lens[]
  emptyBand: string
  unrankedLabel: string
  edition: string
  source: string
}

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

function LensSelect({
  lenses,
  lens,
  onPick,
}: {
  lenses: Lens[]
  lens: Lens
  onPick: (id: LensId) => void
}) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 640px)').matches,
  )
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => {
      setIsMobile(mq.matches)
      setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!open || isMobile) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.lens-field')) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('touchend', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('touchend', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, isMobile])

  useEffect(() => {
    if (open && !isMobile) {
      menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    }
  }, [open, isMobile])

  const onMenuKeys = (e: React.KeyboardEvent) => {
    const opts = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('.lens-opt') ?? [])]
    const i = opts.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      opts[(i + 1 + opts.length) % opts.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      opts[(i - 1 + opts.length) % opts.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      opts[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      opts[opts.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const onBtnKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const pick = (id: LensId) => {
    onPick(id)
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <div className="lens-field">
      <button
        ref={btnRef}
        type="button"
        className="lens-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onBtnKeys}
      >
        <span>{lens.label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && !isMobile && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Metric lens"
          className="lens-menu"
          onKeyDown={onMenuKeys}
        >
          {lenses.map((l) => (
            <button
              key={l.id}
              type="button"
              role="option"
              aria-selected={l.id === lens.id}
              className={`lens-opt${l.id === lens.id ? ' is-on' : ''}`}
              onClick={() => pick(l.id)}
            >
              <span className="lens-opt-label">{l.label}</span>
              <span className="lens-opt-hint">{l.hint}</span>
            </button>
          ))}
        </div>
      )}
      {isMobile && (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="drawer-veil" />
            <Drawer.Content className="drawer-card" aria-label="Metric lens">
              <div className="drawer-grip" aria-hidden="true" />
              <Drawer.Title className="drawer-title">Metric</Drawer.Title>
              <Drawer.Description className="sr-only">
                Pick a metric lens for the board.
              </Drawer.Description>
              <div role="listbox" aria-label="Metric lens" className="drawer-opts">
                {lenses.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="option"
                    aria-selected={l.id === lens.id}
                    className={`lens-opt${l.id === lens.id ? ' is-on' : ''}`}
                    onClick={() => pick(l.id)}
                  >
                    <span className="lens-opt-label">{l.label}</span>
                    <span className="lens-opt-hint">{l.hint}</span>
                  </button>
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>
  )
}

export default function Leaderboard({ config }: { config: BoardConfig }) {
  const { entries, makers, lenses, emptyBand, unrankedLabel, edition, source } = config
  const [lensId, setLensId] = useState<LensId>(lenses[0].id)
  const [tip, setTip] = useState<TipState | null>(null)
  const lens = lenses.find((l) => l.id === lensId) ?? lenses[0]
  const { ranked, unranked } = useMemo(() => rank(lens, entries), [lens, entries])
  const rows = useMemo(() => bands(lens, ranked), [lens, ranked])

  useEffect(() => setTip(null), [lensId])

  useEffect(() => {
    if (!tip) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null)
    }
    const onScroll = () => setTip(null)
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.tile,.tip')) setTip(null)
    }
    // iOS Safari skips mousedown on plain page areas, so touch taps need this.
    const onTouchEnd = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.tile,.tip')) setTip(null)
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
  }, [tip])

  if (!entries.length) {
    return <p className="empty">No data yet.</p>
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
    <>
      <LensSelect lenses={lenses} lens={lens} onPick={setLensId} />
      <p className="sr-only" role="status">
        {lens.hint}
      </p>

      <div className="board">
        {rows.map((b) => (
          <section key={`${lens.id}-${b.tier}`} className="tier" aria-label={`Tier ${b.tier}`}>
            <div className={`tier-label tier-label-${b.tier}`}>
              <span className="tier-letter">{b.tier}</span>
              <span className="tier-range">{b.label}</span>
            </div>
            {b.empty ? (
              <p className="tier-empty">{emptyBand}</p>
            ) : (
              <div className="tiles">
                {b.rows.map((r) => (
                  <Tile
                    key={r.model.slug}
                    model={r.model}
                    makers={makers}
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
        <section className="tier tier-flat" aria-label={unrankedLabel}>
          <div className="tier-label tier-label-flat">
            <span className="tier-letter">–</span>
            <span className="tier-range">No score</span>
          </div>
          <div className="tiles">
            {unranked.map((m, i) => (
              <Tile
                key={m.slug}
                model={m}
                makers={makers}
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
          makers={makers}
          lens={lens}
          info={tipInfo}
          pos={tip}
          total={ranked.length}
        />
      )}

      <footer className="colophon">
        <p>
          Data:{' '}
          <a href={source} target="_blank" rel="noreferrer">
            Artificial Analysis
          </a>{' '}
          · Updated {edition}
        </p>
      </footer>
    </>
  )
}
