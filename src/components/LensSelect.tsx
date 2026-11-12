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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => {
      setIsMobile(mq.matches)
      setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!open || isMobile) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.lens-field')) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('touchend', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('touchend', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, isMobile])

  useEffect(() => {
    if (open && !isMobile) {
      menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    }
  }, [open, isMobile])

  const onMenuKeys = (e: React.KeyboardEvent) => {
    const opts = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('.lens-opt') ?? [])]
    const i = opts.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      opts[(i + 1 + opts.length) % opts.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      opts[(i - 1 + opts.length) % opts.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      opts[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      opts[opts.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const onBtnKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
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
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onBtnKeys}
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
      {open && !isMobile && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Metric lens"
          className="lens-menu"
          onKeyDown={onMenuKeys}
        >
          <LensOptions lenses={lenses} lens={lens} onPick={pick} />
        </div>
      )}
      {isMobile && (
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
      )}
    </div>
  )
}
