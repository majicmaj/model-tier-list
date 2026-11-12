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
  leaving: boolean
}

/** First guess from the tile box; the correct pass fixes both axes. */
function tilePos(anchor: HTMLElement): TipPos {
  const r = anchor.getBoundingClientRect()
  const w = 248
  const h = 320
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
  const closeTimer = useRef(0)
  const fadeTimer = useRef(0)
  const tipRef = useRef<TipState | null>(null)
  tipRef.current = tip

  const clearTimer = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = 0
  }
  const clearFade = () => {
    window.clearTimeout(fadeTimer.current)
    fadeTimer.current = 0
  }

  useEffect(() => setTip(null), [lensId])
  useEffect(
    () => () => {
      clearTimer()
      clearFade()
    },
    [],
  )

  /** Fade out, then unmount; a fresh hover cancels the fade. */
  const closeTip = () => {
    clearTimer()
    clearFade()
    setTip((cur) => (cur && !cur.leaving ? { ...cur, leaving: true } : cur))
    fadeTimer.current = window.setTimeout(() => setTip(null), 120)
  }

  useEffect(() => {
    if (!tip) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTip()
    }
    const onScroll = () => closeTip()
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.tile,.tip')) closeTip()
    }
    // iOS Safari skips mousedown on plain page areas, so touch taps need this.
    const onTouchEnd = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.tile,.tip')) closeTip()
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
    if (!tip || tip.corrected || tip.leaving) return
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
    clearTimer()
    clearFade()
    const cur = tipRef.current
    if (cur?.pinned && !cur.leaving) return
    if (cur && cur.slug === slug && !cur.leaving) return
    setTip({ slug, ...tilePos(anchor), pinned: false, corrected: false, leaving: false })
  }
  // The pointer may cross the tile gap or enter the card; wait it out.
  const onLeave = () => {
    clearTimer()
    closeTimer.current = window.setTimeout(() => {
      const cur = tipRef.current
      if (cur && !cur.pinned && !cur.leaving) closeTip()
    }, 120)
  }
  const onToggle = (slug: string, anchor: HTMLElement) => {
    clearTimer()
    clearFade()
    const cur = tipRef.current
    if (cur?.pinned && cur.slug === slug && !cur.leaving) {
      closeTip()
      return
    }
    setTip({ slug, ...tilePos(anchor), pinned: true, corrected: false, leaving: false })
  }
  const onTipEnter = () => {
    clearTimer()
    clearFade()
    setTip((cur) => (cur?.leaving ? { ...cur, leaving: false } : cur))
  }
  const onTipLeave = () => {
    closeTip()
  }

  return { tip, tipEl, onHover, onLeave, onToggle, onTipEnter, onTipLeave }
}
