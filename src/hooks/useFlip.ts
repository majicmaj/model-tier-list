import { useLayoutEffect, useRef, type RefObject } from 'react'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Mount enter plus FLIP on lens switch, scoped to one board root. */
export function useFlip(boardRef: RefObject<HTMLElement | null>) {
  const first = useRef(new Map<string, { x: number; y: number }>())

  // Mount enter: staggered fade in one WAAPI pass, before first paint.
  useLayoutEffect(() => {
    if (reduceMotion()) return
    const root = boardRef.current
    if (!root) return
    const anims = [...root.querySelectorAll('.tile')].map((el, i) =>
      (el as HTMLElement).animate(
        [
          { opacity: 0, transform: 'scale(0.94)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          duration: 180,
          delay: Math.min(i * 12, 330),
          easing: EASE,
          fill: 'backwards',
        },
      ),
    )
    return () => anims.forEach((a) => a.cancel())
  }, [boardRef])

  // Lens switch: FLIP each tile from its old spot. One-shot per render.
  useLayoutEffect(() => {
    const before = first.current
    first.current = new Map()
    if (!before.size) return
    boardRef.current?.querySelectorAll('.tile[data-slug]').forEach((el) => {
      const f = before.get(el.getAttribute('data-slug')!)
      if (!f) return
      const r = el.getBoundingClientRect()
      const dx = f.x - r.left
      const dy = f.y - r.top
      if (dx || dy) {
        ;(el as HTMLElement).animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 350, easing: EASE },
        )
      }
    })
  })

  const capture = () => {
    if (reduceMotion()) return
    const m = new Map<string, { x: number; y: number }>()
    boardRef.current?.querySelectorAll('.tile[data-slug]').forEach((el) => {
      const r = el.getBoundingClientRect()
      m.set(el.getAttribute('data-slug')!, { x: r.left, y: r.top })
    })
    first.current = m
  }

  return capture
}
