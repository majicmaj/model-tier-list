import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import type { Lens, LensId } from '../lib/tiers'

function LensOptions({
  lenses,
  lens,
  onPick,
}: {
  lenses: Lens[]
  lens: Lens
  onPick: (id: LensId) => void
}) {
  return (
    <>
      {lenses.map((l) => (
        <button
          key={l.id}
          type="button"
          role="option"
          aria-selected={l.id === lens.id}
          className={`lens-opt${l.id === lens.id ? ' is-on' : ''}`}
          onClick={() => onPick(l.id)}
        >
          <span className="lens-opt-label">{l.label}</span>
          <span className="lens-opt-hint">{l.hint}</span>
        </button>
      ))}
    </>
  )
}

/** Wide screens: every lens one tap away under a sliding pill. */
function LensRow({
  lenses,
  lens,
  onPick,
}: {
  lenses: Lens[]
  lens: Lens
  onPick: (id: LensId) => void
}) {
  const i = Math.max(
    0,
    lenses.findIndex((l) => l.id === lens.id),
  )
  return (
    <div
      className={`lens-row n${lenses.length}`}
      role="group"
      aria-label="Metric lens"
      style={{ '--i': i } as React.CSSProperties}
    >
      <span className="lens-pill" aria-hidden="true" />
      {lenses.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={l.id === lens.id}
          title={l.hint}
          className={`lens-chip${l.id === lens.id ? ' is-on' : ''}`}
          onClick={() => onPick(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function LensSelect({
  lenses,
  lens,
  onPick,
}: {
  lenses: Lens[]
  lens: Lens
  onPick: (id: LensId) => void
}) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 640px)').matches,
  )
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => {
      setIsMobile(mq.matches)
      setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!isMobile) {
    return <LensRow lenses={lenses} lens={lens} onPick={onPick} />
  }

  const pick = (id: LensId) => {
    onPick(id)
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <div className="lens-field">
      <button
        ref={btnRef}
        type="button"
        className="lens-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{lens.label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-veil" />
          <Drawer.Content className="drawer-card" aria-label="Metric lens">
            <div className="drawer-grip" aria-hidden="true" />
            <Drawer.Title className="drawer-title">Metric</Drawer.Title>
            <Drawer.Description className="sr-only">
              Pick a metric lens for the board.
            </Drawer.Description>
            <div role="listbox" aria-label="Metric lens" className="drawer-opts">
              <LensOptions lenses={lenses} lens={lens} onPick={pick} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
