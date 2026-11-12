import { useMemo, useRef } from 'react'
import {
  bands,
  compoundPartial,
  compoundStars,
  compoundValues,
  displayName,
  gapCopy,
  isNew,
  multiEffortBases,
  prevRanks,
  rank,
  type Company,
  type CompoundDef,
  type Lens,
  type LensId,
  type Model,
  type Ranked,
} from './lib/tiers'
import { useFlip } from './hooks/useFlip'
import { useTip } from './hooks/useTip'
import { LensSelect } from './components/LensSelect'
import { Tile } from './components/Tile'
import { Tooltip, type TileInfo } from './components/Tooltip'

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
  const partial = useMemo(
    () => (blended ? compoundPartial(compound, entries) : new Set<string>()),
    [blended, compound, entries],
  )
  const multi = useMemo(() => multiEffortBases(entries), [entries])
  const moves = useMemo(() => {
    const before = prevRanks(lens, compound, entries)
    const out = new Map<string, number>()
    for (const r of ranked) {
      const was = before.get(r.model.slug)
      if (was !== undefined && was !== r.rank) out.set(r.model.slug, was - r.rank)
    }
    return out
  }, [lens, compound, entries, ranked])
  const { tip, tipEl, onHover, onLeave, onToggle } = useTip(lensId)
  const boardRef = useRef<HTMLDivElement>(null)
  const capture = useFlip(boardRef)

  const pick = (id: LensId) => {
    if (id === lensId) return
    capture()
    onLens(id)
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

  // All hooks sit above this return, so an empty set cannot break hook order.
  if (!entries.length) {
    return <p className="empty">No data yet.</p>
  }

  return (
    <>
      <LensSelect lenses={lenses} lens={lens} onPick={pick} />
      <p className="sr-only" role="status">
        {lens.hint}
      </p>

      {/* display:contents adds no box; it only scopes tile queries. */}
      <div ref={boardRef} style={{ display: 'contents' }}>
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
                      partial={partial.has(r.model.slug)}
                      delta={moves.get(r.model.slug) ?? null}
                      display={displayName(r.model, multi)}
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
              {unranked.map((m) => (
                <Tile
                  key={m.slug}
                  model={m}
                  makers={makers}
                  fresh={isNew(edition, m.added)}
                  partial={false}
                  delta={null}
                  display={displayName(m, multi)}
                  tipOpen={tip?.slug === m.slug}
                  onHover={onHover}
                  onLeave={onLeave}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {tip && tipModel && (
        <Tooltip
          model={tipModel}
          makers={makers}
          lens={lens}
          info={tipInfo}
          pos={tip}
          total={ranked.length}
          marks={tipModel ? (stars?.get(tipModel.slug) ?? []) : []}
          elRef={tipEl}
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
