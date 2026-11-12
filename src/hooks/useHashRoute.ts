import { useEffect, useState } from 'react'
import { HLENSES, LENSES, type Board, type LensId } from '../lib/tiers'

export interface Route {
  page: Board
  lensId: LensId
}

const LENS_IDS: LensId[] = [
  'intelligence',
  'speed',
  'price',
  'latency',
  'context',
  'value',
  'compound',
]

/** `#/harnesses?l=price` drives state, so Back and reload just work. */
function parseHash(): Route {
  const h = window.location.hash || '#/'
  const page: Board = h.startsWith('#/harnesses') ? 'harnesses' : 'models'
  const m = h.match(/[?&]l=([a-z]+)/)
  const want = (m?.[1] ?? 'compound') as LensId
  const lenses = page === 'harnesses' ? HLENSES : LENSES
  const lensId = LENS_IDS.includes(want) && lenses.some((l) => l.id === want) ? want : 'compound'
  return { page, lensId }
}

function hashFor(page: Board, lensId: LensId): string {
  return `#/${page === 'harnesses' ? 'harnesses' : ''}?l=${lensId}`
}

export function useHashRoute(): [Route, (page: Board, lensId: LensId) => void] {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = (page: Board, lensId: LensId) => {
    const next = hashFor(page, lensId)
    if (window.location.hash === next) {
      setRoute({ page, lensId })
      return
    }
    window.location.hash = next
  }

  return [route, go]
}
