import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface TipPos {
  x: number
  y: number
  above: boolean
  anchorTop: number
  anchorBottom: number
}

export interface TipState extends TipPos {
  slug: string
  pinned: boolean
  corrected: boolean
}

/** First guess from the tile box; the correct pass fixes both axes. */
function tilePos(anchor: HTMLElement): TipPos {
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

export function useTip(lensId: string) {
  const [tip, setTip] = useState<TipState | null>(null)
  const tipEl = useRef<HTMLDivElement>(null)

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

  // The estimate above uses a fixed card size. After mount, shift the card
  // so its bottom edge clears the tile, or flip it below when room is short.
  useLayoutEffect(() => {
    if (!tip || tip.corrected) return
    const el = tipEl.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = Math.min(Math.max(tip.x + 124 - box.width / 2, 8), window.innerWidth - box.width - 8)
    if (!tip.above || tip.y + box.height <= tip.anchorTop - 4) {
      setTip({ ...tip, x, corrected: true })
      return
    }
    const y = tip.anchorTop - 10 - box.height
    if (y < 8) {
      setTip({ ...tip, x, above: false, y: tip.anchorBottom + 10, corrected: true })
    } else {
      setTip({ ...tip, x, y, corrected: true })
    }
  }, [tip])

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

  return { tip, tipEl, onHover, onLeave, onToggle }
}
