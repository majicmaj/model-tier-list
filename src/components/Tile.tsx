import { deltaCopy, type Company, type DisplayName, type Model } from '../lib/tiers'
import { Logo, Mark } from './icons'

export function Tile({
  model,
  makers,
  fresh,
  partial,
  delta,
  display,
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
