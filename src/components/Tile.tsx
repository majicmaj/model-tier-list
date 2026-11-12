import {
  deltaCopy,
  type Company,
  type DisplayName,
  type Model,
  type StarIcon,
  type StarMark,
} from '../lib/tiers'
import { Logo, Mark } from './icons'

function Badge({ mark }: { mark: StarMark }) {
  const glyph: Record<StarIcon, React.ReactNode> = {
    crown: (
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
        <path d="M2 10.5 3.5 5.5 7 8l2.5-4.5L13 8l1.5-2.5L14 10.5z" />
        <rect x="2" y="11.2" width="12" height="1.6" rx="0.8" />
      </svg>
    ),
    dollar: <span aria-hidden="true">$</span>,
    bolt: (
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
        <polygon points="9 1 3 9.5 7.5 9.5 7 15 13 6.5 8.5 6.5 9 1" />
      </svg>
    ),
  }
  return (
    <span className="tile-mark" aria-label={mark.label}>
      {glyph[mark.icon]}
    </span>
  )
}

export function Tile({
  model,
  makers,
  fresh,
  partial,
  delta,
  display,
  marks,
  tipOpen,
  onHover,
  onLeave,
  onToggle,
}: {
  model: Model
  makers: Record<string, Company>
  fresh: boolean
  partial: boolean
  delta: number | null
  display: DisplayName
  marks: StarMark[]
  tipOpen: boolean
  onHover: (slug: string, anchor: HTMLElement) => void
  onLeave: () => void
  onToggle: (slug: string, anchor: HTMLElement) => void
}) {
  const co = makers[model.company]
  const twin = !!model.modelMakers?.length && model.modelMakers[0] !== model.company
  const label = display.secondary ? `${display.primary}, ${display.secondary}` : display.primary
  return (
    <button
      type="button"
      data-slug={model.slug}
      className={`tile${tipOpen ? ' is-open' : ''}`}
      style={{ '--tint': co?.color || undefined } as React.CSSProperties}
      aria-label={label}
      aria-describedby={tipOpen ? `tip-${model.slug}` : undefined}
      onMouseEnter={(e) => onHover(model.slug, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(model.slug, e.currentTarget)}
      onBlur={onLeave}
      onClick={(e) => onToggle(model.slug, e.currentTarget)}
    >
      {fresh && (
        <span className="tile-new" aria-label="New this week">
          New
        </span>
      )}
      {marks.length > 0 && (
        <span className="tile-marks">
          {marks.map((s) => (
            <Badge key={s.label} mark={s} />
          ))}
        </span>
      )}
      {partial && <span className="tile-dot" aria-label="Score uses partial data" />}
      {delta !== null && delta !== 0 && (
        <span
          className={`tile-delta${delta > 0 ? ' is-up' : ' is-down'}`}
          aria-label={`Moved ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} since last update`}
        >
          {deltaCopy(delta)}
        </span>
      )}
      {twin ? (
        <span className="logos" aria-hidden="true">
          <Mark
            src={makers[model.company]?.logo}
            name={makers[model.company]?.name || model.shortName}
            size={24}
          />
          <Mark
            src={makers[model.modelMakers![0]]?.logo}
            name={makers[model.modelMakers![0]]?.name || model.shortName}
            size={24}
          />
        </span>
      ) : (
        <Logo model={model} makers={makers} />
      )}
      <span className="tile-name" aria-hidden="true">
        {display.primary}
      </span>
      {display.secondary && (
        <span className="tile-sub" aria-hidden="true">
          {display.secondary}
        </span>
      )}
    </button>
  )
}
