import type { Ref } from 'react'
import type { Company, Lens, Model } from '../lib/tiers'
import { Icon, Mark } from './icons'
import type { TipState } from '../hooks/useTip'

export interface TileInfo {
  value: string
  rank: number
  gap: string
  tier: string
  band: string
}

export function Tooltip({
  model,
  makers,
  lens,
  info,
  pos,
  total,
  marks,
  elRef,
}: {
  model: Model
  makers: Record<string, Company>
  lens: Lens
  info: TileInfo | null
  pos: TipState
  total: number
  marks: string[]
  elRef: Ref<HTMLDivElement>
}) {
  const co = makers[model.company]
  return (
    <div
      id={`tip-${model.slug}`}
      ref={elRef}
      role="tooltip"
      className={`tip${pos.above ? ' is-above' : ' is-below'}${pos.pinned ? ' is-pinned' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` } as React.CSSProperties}
    >
      <p className="tip-name">{model.modelMakers ? model.name : model.shortName}</p>
      {model.modelMakers ? (
        <div className="tip-combo">
          <div className="tip-part">
            <Icon n="harness" />
            <Mark src={co?.logo} name={co?.name || model.name} size={16} />
            <span>
              {co?.name || 'Unknown maker'}
              {model.version ? ` · v${model.version}` : ''}
            </span>
          </div>
          <div className="tip-part">
            <Icon n="model" />
            {model.modelMakers.map((k) => (
              <Mark
                key={k}
                src={makers[k]?.logo}
                name={makers[k]?.name || model.modelLabel || '?'}
                size={16}
              />
            ))}
            <span>{model.modelLabel}</span>
          </div>
        </div>
      ) : (
        <p className="tip-co">{co?.name || 'Unknown maker'}</p>
      )}
      {info ? (
        <dl className="tip-grid">
          <div>
            <dt>
              <Icon n="rank" />
              Rank
            </dt>
            <dd>
              #{String(info.rank).padStart(2, '0')} of {total}
            </dd>
          </div>
          <div>
            <dt>
              <Icon n="metric" />
              {lens.label}
            </dt>
            <dd>{info.value}</dd>
          </div>
          <div>
            <dt>
              <Icon n="gap" />
              Gap
            </dt>
            <dd>{info.gap}</dd>
          </div>
          <div>
            <dt>
              <Icon n="tier" />
              Tier
            </dt>
            <dd>
              {info.tier} · {info.band}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="tip-flat">No {lens.label.toLowerCase()} score this edition.</p>
      )}
      {marks.length > 0 && (
        <p className="tip-marks">
          {marks.map((s) => (
            <span key={s} className="tag tag-star">
              <Icon n="tier" />
              {s}
            </span>
          ))}
        </p>
      )}
      {(model.reasoning || model.openWeights || model.releaseDate) && (
        <p className="tip-meta">
          {model.reasoning && <span className="tag">reasoning</span>}
          {model.openWeights && <span className="tag">open</span>}
          {model.releaseDate && <span className="tip-rel">Rel. {model.releaseDate}</span>}
        </p>
      )}
      <a className="tip-link" href={model.url} target="_blank" rel="noreferrer">
        Open on Artificial Analysis
      </a>
    </div>
  )
}
