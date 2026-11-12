import { useLayoutEffect, useRef, type RefObject } from 'react'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Lens switch: FLIP tiles and tier labels, tween board height. One pass. */
export function useFlip(boardRef: RefObject<HTMLElement | null>) {
  const first = useRef(new Map<string, { x: number; y: number }>())
  const rootH = useRef(0)

  // Lens switch: FLIP each tile and label from its old spot. One-shot.
  useLayoutEffect(() => {
    const before = first.current
    first.current = new Map()
    const root = boardRef.current
    if (!before.size || !root) {
      rootH.current = 0
      return
    }
    root.querySelectorAll('.tile[data-slug], .tier-label[data-tier]').forEach((el) => {
      const key =
        el.getAttribute('data-slug') != null
          ? `t:${el.getAttribute('data-slug')}`
          : `l:${el.getAttribute('data-tier')}`
      const f = before.get(key)
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
    // New rows grow or shrink the board; tween the height so the foot glides.
    const from = rootH.current
    rootH.current = 0
    if (from) {
      const to = root.offsetHeight
      if (from !== to) {
        root.style.overflow = 'hidden'
        const anim = root.animate([{ height: `${from}px` }, { height: `${to}px` }], {
          duration: 350,
          easing: EASE,
        })
        anim.onfinish = () => {
          root.style.overflow = ''
        }
      }
    }
  })

  const capture = () => {
    const root = boardRef.current
    if (reduceMotion() || !root) return
    const m = new Map<string, { x: number; y: number }>()
    root.querySelectorAll('.tile[data-slug]').forEach((el) => {
      const r = el.getBoundingClientRect()
      m.set(`t:${el.getAttribute('data-slug')}`, { x: r.left, y: r.top })
    })
    root.querySelectorAll('.tier-label[data-tier]').forEach((el) => {
      const r = el.getBoundingClientRect()
      m.set(`l:${el.getAttribute('data-tier')}`, { x: r.left, y: r.top })
    })
    first.current = m
    rootH.current = root.offsetHeight
  }

  return capture
}
