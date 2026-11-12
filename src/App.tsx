import { useEffect, useLayoutEffect, useRef } from 'react'
import Leaderboard, { type BoardConfig } from './Leaderboard'
import { useHashRoute } from './hooks/useHashRoute'
import {
  HARNESS_COMPOUND,
  HARNESS_FACTS,
  HLENSES,
  LENSES,
  MODEL_COMPOUND,
  MODEL_FACTS,
  agentData,
  data,
  twinLens,
  type Board,
  type LensId,
} from './lib/tiers'

const PAGES: Board[] = ['models', 'harnesses']

const CONFIGS: Record<Board, BoardConfig> = {
  models: {
    entries: data.models,
    makers: data.companies,
    lenses: LENSES,
    compound: MODEL_COMPOUND,
    facts: MODEL_FACTS,
    emptyBand: 'No models in this band.',
    unrankedLabel: 'Unranked models',
    edition: data.edition,
    source: data.source,
  },
  harnesses: {
    entries: agentData.models,
    makers: agentData.companies,
    lenses: HLENSES,
    compound: HARNESS_COMPOUND,
    facts: HARNESS_FACTS,
    emptyBand: 'No harnesses in this band.',
    unrankedLabel: 'Unranked harnesses',
    edition: agentData.edition,
    source: agentData.source,
  },
}

export default function App() {
  const [{ page, lensId }, go] = useHashRoute()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const pillRef = useRef<HTMLSpanElement>(null)

  const placePill = () => {
    const btn = tabRefs.current[PAGES.indexOf(page)]
    const pill = pillRef.current
    const base = tabRefs.current[0]?.offsetWidth
    if (!btn || !pill || !base) return
    pill.style.width = `${base}px`
    pill.style.transform = `translateX(${btn.offsetLeft - 2}px) scaleX(${btn.offsetWidth / base})`
  }

  useLayoutEffect(() => {
    placePill()
  }, [page])

  useEffect(() => {
    window.addEventListener('resize', placePill)
    document.fonts?.ready.then(placePill).catch(() => {})
    return () => window.removeEventListener('resize', placePill)
  }, [])

  const goPage = (p: Board) => {
    if (p === page) return
    go(p, twinLens(lensId, p))
  }
  const goLens = (id: LensId) => go(page, id)

  return (
    <main className="page">
      <h1 className="sr-only">Model and Harness Tier List</h1>
      <div className="pages" role="tablist" aria-label="Leaderboard">
        <span ref={pillRef} className="pages-pill" aria-hidden="true" />
        {PAGES.map((p, i) => (
          <button
            key={p}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            aria-selected={page === p}
            className={`page-tab${page === p ? ' is-on' : ''}`}
            onClick={() => goPage(p)}
          >
            {p === 'models' ? 'Models' : 'Harnesses'}
          </button>
        ))}
      </div>
      <Leaderboard key={page} config={CONFIGS[page]} lensId={lensId} onLens={goLens} />
    </main>
  )
}
