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

  const goPage = (p: Board) => {
    if (p === page) return
    go(p, twinLens(lensId, p))
  }
  const goLens = (id: LensId) => go(page, id)

  return (
    <main className="page">
      <h1 className="sr-only">Model and Harness Tier List</h1>
      <div
        className="pages"
        role="tablist"
        aria-label="Leaderboard"
        style={{ '--i': PAGES.indexOf(page) } as React.CSSProperties}
      >
        <span className="pages-pill" aria-hidden="true" />
        {PAGES.map((p) => (
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
      <div key={page} className="board-cross">
        <Leaderboard config={CONFIGS[page]} lensId={lensId} onLens={goLens} />
      </div>
    </main>
  )
}
