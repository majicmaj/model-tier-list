import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import {
  bands,
  compoundStars,
  compoundValues,
  gapCopy,
  isNew,
  rank,
  type Company,
  type CompoundDef,
  type Lens,
  type LensId,
  type Model,
  type Ranked,
} from './lib/tiers'

export interface BoardConfig {
  entries: Model[]
  makers: Record<string, Company>
  lenses: Lens[]
  compound: CompoundDef
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
  anchorTop: number
  anchorBottom: number
  corrected: boolean
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

function Mark({ src, name, size }: { src: string | null | undefined; name: string; size: number }) {
  if (!src) {
    return (
      <span className="mark-miss" style={{ width: size, height: size }} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    )
  }
  return <img className="mark" src={src} alt="" loading="lazy" width={size} height={size} />
}

const ICONS = {
  rank: (
    <>
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </>
  ),
  metric: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
  gap: (
    <>
      <path d="m18 8 4 4-4 4" />
      <path d="M2 12h20" />
      <path d="m6 8-4 4 4 4" />
    </>
  ),
  tier: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </>
  ),
  harness: (
    <>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </>
  ),
  model: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </>
  ),
} as const

function Icon({ n }: { n: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[n]}
    </svg>
  )
}

function tilePos(anchor: HTMLElement): Omit<TipState, 'slug' | 'pinned' | 'corrected'> {
  const r = anchor.getBoundingClientRect()
  const w = 248
  const h = 210
  const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8)
  const above = r.top > h + 12
  return {
    x,
    y: above ? r.top - 10 - h : r.bottom + 10,
    above,
    anchorTop: r.top,
    anchorBottom: r.bottom,
  }
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
  fresh,
  tipOpen,
  onHover,
  onLeave,
  onToggle,
}: {
  model: Model
  makers: Record<string, Company>
  fresh: boolean
  tipOpen: boolean
  onHover: (slug: string, anchor: HTMLElement) => void
  onLeave: () => void
  onToggle: (slug: string, anchor: HTMLElement) => void
}) {
  const co = makers[model.company]
  return (
    <button
      type="button"
      data-slug={model.slug}
      className={`tile${tipOpen ? ' is-open' : ''}`}
      style={{ '--tint': co?.color || undefined } as React.CSSProperties}
      aria-describedby={tipOpen ? `tip-${model.slug}` : undefined}
      onMouseEnter={(e) => onHover(model.slug, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(model.slug, e.currentTarget)}
      onBlur={onLeave}
      onClick={(e) => onToggle(model.slug, e.currentTarget)}
    >
      {fresh && (
        <span className="tile-new" aria-label="New this week">
          New
        </span>
      )}
      {model.modelMakers?.length ? (
        <span className="logos" aria-hidden="true">
          <Mark
            src={makers[model.company]?.logo}
            name={makers[model.company]?.name || model.shortName}
            size={24}
          />
          <Mark
            src={makers[model.modelMakers[0]]?.logo}
            name={makers[model.modelMakers[0]]?.name || model.shortName}
            size={24}
          />
        </span>
      ) : (
        <Logo model={model} makers={makers} />
      )}
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
  marks,
}: {
  model: Model
  makers: Record<string, Company>
  lens: Lens
  info: TileInfo | null
  pos: TipState
  total: number
  marks: string[]
}) {
  const co = makers[model.company]
  return (
    <div
      id={`tip-${model.slug}`}
      role="tooltip"
      className={`tip${pos.above ? ' is-above' : ' is-below'}${pos.pinned ? ' is-pinned' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` } as React.CSSProperties}
    >
      <p className="tip-name">{model.modelMakers ? model.name : model.shortName}</p>
      {model.modelMakers ? (
        <div className="tip-combo">
          <div className="tip-part">
            <Icon n="harness" />
            <Mark src={co?.logo} name={co?.name || model.name} size={16} />
            <span>
              {co?.name || 'Unknown maker'}
              {model.version ? ` · v${model.version}` : ''}
            </span>
          </div>
          <div className="tip-part">
            <Icon n="model" />
            {model.modelMakers.map((k) => (
              <Mark
                key={k}
                src={makers[k]?.logo}
                name={makers[k]?.name || model.modelLabel || '?'}
                size={16}
              />
            ))}
            <span>{model.modelLabel}</span>
          </div>
        </div>
      ) : (
        <p className="tip-co">{co?.name || 'Unknown maker'}</p>
      )}
      {info ? (
        <dl className="tip-grid">
          <div>
            <dt>
              <Icon n="rank" />
              Rank
            </dt>
            <dd>
              #{String(info.rank).padStart(2, '0')} of {total}
            </dd>
          </div>
          <div>
            <dt>
              <Icon n="metric" />
              {lens.label}
            </dt>
            <dd>{info.value}</dd>
          </div>
          <div>
            <dt>
              <Icon n="gap" />
              Gap
            </dt>
            <dd>{info.gap}</dd>
          </div>
          <div>
            <dt>
              <Icon n="tier" />
              Tier
            </dt>
            <dd>
              {info.tier} · {info.band}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="tip-flat">No {lens.label.toLowerCase()} score this edition.</p>
      )}
      {marks.length > 0 && (
        <p className="tip-marks">
          {marks.map((s) => (
            <span key={s} className="tag tag-star">
              <Icon n="tier" />
              {s}
            </span>
          ))}
        </p>
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

export default function Leaderboard({
  config,
  lensId,
  onLens,
}: {
  config: BoardConfig
  lensId: LensId
  onLens: (id: LensId) => void
}) {
  const { entries, makers, lenses, compound, emptyBand, unrankedLabel, edition, source } =
    config
  const [tip, setTip] = useState<TipState | null>(null)
  const firstRects = useRef(new Map<string, { x: number; y: number }>())
  const lens = lenses.find((l) => l.id === lensId) ?? lenses[0]
  const blended = lens.id === 'compound'
  const values = useMemo(
    () => (blended ? compoundValues(compound, entries) : null),
    [blended, compound, entries],
  )
  const { ranked, unranked } = useMemo(
    () => rank(lens, entries, values ?? undefined),
    [lens, entries, values],
  )
  const rows = useMemo(() => bands(lens, ranked), [lens, ranked])
  const stars = useMemo(
    () => (blended ? compoundStars(compound, entries) : null),
    [blended, compound, entries],
  )

  useEffect(() => setTip(null), [lensId])

  const pick = (id: LensId) => {
    if (id === lensId) return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const m = new Map<string, { x: number; y: number }>()
      document.querySelectorAll('.tile[data-slug]').forEach((el) => {
        const r = el.getBoundingClientRect()
        m.set(el.getAttribute('data-slug')!, { x: r.left, y: r.top })
      })
      firstRects.current = m
    }
    onLens(id)
  }

  // Mount enter: staggered fade in one WAAPI pass, before first paint.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const anims = [...document.querySelectorAll('.tile')].map((el, i) =>
      (el as HTMLElement).animate(
        [
          { opacity: 0, transform: 'scale(0.94)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          duration: 180,
          delay: Math.min(i * 12, 330),
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'backwards',
        },
      ),
    )
    return () => anims.forEach((a) => a.cancel())
  }, [])

  // Lens switch: FLIP each tile from its old spot. One-shot per render.
  useLayoutEffect(() => {
    const first = firstRects.current
    firstRects.current = new Map()
    if (!first.size) return
    document.querySelectorAll('.tile[data-slug]').forEach((el) => {
      const f = first.get(el.getAttribute('data-slug')!)
      if (!f) return
      const r = el.getBoundingClientRect()
      const dx = f.x - r.left
      const dy = f.y - r.top
      if (dx || dy) {
        ;(el as HTMLElement).animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
      }
    })
  })

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
      return { slug, ...tilePos(anchor), pinned: false, corrected: false }
    })
  }
  const onLeave = () => {
    setTip((cur) => (cur && !cur.pinned ? null : cur))
  }
  const onToggle = (slug: string, anchor: HTMLElement) => {
    setTip((cur) => {
      if (cur?.pinned && cur.slug === slug) return null
      return { slug, ...tilePos(anchor), pinned: true, corrected: false }
    })
  }

  // The estimate above uses a fixed card height. After mount, shift the card
  // so its bottom edge clears the tile, or flip it below when room is short.
  useLayoutEffect(() => {
    if (!tip || tip.corrected) return
    const el = document.getElementById(`tip-${tip.slug}`)
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (!tip.above || tip.y + h <= tip.anchorTop - 4) {
      setTip({ ...tip, corrected: true })
      return
    }
    const y = tip.anchorTop - 10 - h
    if (y < 8) {
      setTip({ ...tip, above: false, y: tip.anchorBottom + 10, corrected: true })
    } else {
      setTip({ ...tip, y, corrected: true })
    }
  }, [tip])

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
      <LensSelect lenses={lenses} lens={lens} onPick={pick} />
      <p className="sr-only" role="status">
        {lens.hint}
      </p>

      <div className="board">
        {rows.map((b) => (
          <section key={b.tier} className="tier" aria-label={`Tier ${b.tier}`}>
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
                    fresh={isNew(edition, r.model.added)}
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
                fresh={isNew(edition, m.added)}
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
          marks={tipModel ? (stars?.get(tipModel.slug) ?? []) : []}
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
