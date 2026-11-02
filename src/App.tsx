import { useState } from 'react'
import Leaderboard, { type BoardConfig } from './Leaderboard'
import { HLENSES, LENSES, agentData, data } from './lib/tiers'

type Page = 'models' | 'harnesses'

const CONFIGS: Record<Page, BoardConfig> = {
  models: {
    entries: data.models,
    makers: data.companies,
    lenses: LENSES,
    emptyBand: 'No models in this band.',
    unrankedLabel: 'Unranked models',
    edition: data.edition,
    source: data.source,
  },
  harnesses: {
    entries: agentData.models,
    makers: agentData.companies,
    lenses: HLENSES,
    emptyBand: 'No harnesses in this band.',
    unrankedLabel: 'Unranked harnesses',
    edition: agentData.edition,
    source: agentData.source,
  },
}

export default function App() {
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === '#/harnesses' ? 'harnesses' : 'models',
  )

  const goPage = (p: Page) => {
    if (p === page) return
    setPage(p)
    window.location.hash = p === 'harnesses' ? '#/harnesses' : '#/'
  }

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
      <Leaderboard key={page} config={CONFIGS[page]} />
    </main>
  )
}
