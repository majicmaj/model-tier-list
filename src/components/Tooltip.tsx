import type { Ref } from 'react'
import type { Company, FactDef, Lens, Model, StarMark } from '../lib/tiers'
import { Icon, Mark } from './icons'
import type { TipState } from '../hooks/useTip'

export interface TileInfo {
  value: string
  rank: number
  gap: string
}

function ComboHead({ model, makers }: { model: Model; makers: Record<string, Company> }) {
  const co = makers[model.company]
  return (
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
        {model.modelMakers!.map((k) => (
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
  )
}

function MetaRow({ model }: { model: Model }) {
  if (!model.reasoning && !model.openWeights && !model.releaseDate) return null
  return (
    <p className="tip-meta">
      {model.reasoning && <span className="tag">reasoning</span>}
      {model.openWeights && <span className="tag">open</span>}
      {model.releaseDate && <span className="tip-rel">Rel. {model.releaseDate}</span>}
    </p>
  )
}

export function Tooltip({
  model,
  makers,
  lens,
  info,
  pos,
  total,
  marks,
  facts,
  elRef,
  onTipEnter,
  onTipLeave,
}: {
  model: Model
  makers: Record<string, Company>
  lens: Lens
  info: TileInfo | null
  pos: TipState
  total: number
  marks: StarMark[]
  facts: FactDef[]
  elRef: Ref<HTMLDivElement>
  onTipEnter: () => void
  onTipLeave: () => void
}) {
  const co = makers[model.company]
  return (
    <div
      id={`tip-${model.slug}`}
      key={pos.above ? 'above' : 'below'}
      ref={elRef}
      role="tooltip"
      className={`tip${pos.corrected ? ' is-set' : ''}${pos.leaving ? ' is-out' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` } as React.CSSProperties}
      onMouseEnter={onTipEnter}
      onMouseLeave={onTipLeave}
    >
      <p className="tip-name">{model.modelMakers ? model.name : model.shortName}</p>
      {model.modelMakers ? (
        <ComboHead model={model} makers={makers} />
      ) : (
        <p className="tip-co">{co?.name || 'Unknown maker'}</p>
      )}
      <dl className="tip-grid">
        {info && (
          <div>
            <dt>
              <Icon n="rank" />
              Rank
            </dt>
            <dd>
              #{String(info.rank).padStart(2, '0')} of {total}
            </dd>
          </div>
        )}
        {info && (
          <div>
            <dt>
              <Icon n="metric" />
              {lens.label}
            </dt>
            <dd>{info.value}</dd>
          </div>
        )}
        {info && (
          <div>
            <dt>
              <Icon n="gap" />
              Gap
            </dt>
            <dd>{info.gap}</dd>
          </div>
        )}
        {facts.map((f) => {
          const v = model[f.field]
          return (
            <div key={f.field}>
              <dt>
                <Icon n={f.icon} />
                {f.label}
              </dt>
              <dd>{v === null ? '—' : f.format(v)}</dd>
            </div>
          )
        })}
      </dl>
      {!info && <p className="tip-flat">No {lens.label.toLowerCase()} score this edition.</p>}
      {marks.length > 0 && (
        <p className="tip-marks">
          {marks.map((s) => (
            <span key={s.label} className="tag tag-star">
              <Icon n="tier" />
              {s.label}
            </span>
          ))}
        </p>
      )}
      <MetaRow model={model} />
      <a className="tip-link" href={model.url} target="_blank" rel="noreferrer">
        Open on Artificial Analysis
      </a>
    </div>
  )
}
