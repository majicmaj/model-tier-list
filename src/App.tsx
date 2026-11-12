import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Leaderboard, { type BoardConfig } from './Leaderboard'
import { HARNESS_COMPOUND, HLENSES, LENSES, MODEL_COMPOUND, agentData, data } from './lib/tiers'

type Page = 'models' | 'harnesses'

const PAGES: Page[] = ['models', 'harnesses']

const CONFIGS: Record<Page, BoardConfig> = {
  models: {
    entries: data.models,
    makers: data.companies,
    lenses: LENSES,
    compound: MODEL_COMPOUND,
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

  const goPage = (p: Page) => {
    if (p === page) return
    setPage(p)
    window.location.hash = p === 'harnesses' ? '#/harnesses' : '#/'
  }

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
      <Leaderboard key={page} config={CONFIGS[page]} />
    </main>
  )
}
