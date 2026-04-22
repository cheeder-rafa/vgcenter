import { useId } from 'react'

import type { Spread, StatStages, Stats, StatusCondition } from '../types/api'
import { MAX_SP_PER_STAT, clampSp } from './statTableUtils'

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'

type Row = {
  key: StatKey
  label: string
  baseKey: keyof Stats
  finalKey: keyof Stats
}

const ROWS: ReadonlyArray<Row> = [
  { key: 'hp', label: 'HP', baseKey: 'hp', finalKey: 'hp' },
  { key: 'atk', label: 'Atk', baseKey: 'attack', finalKey: 'attack' },
  { key: 'def', label: 'Def', baseKey: 'defense', finalKey: 'defense' },
  {
    key: 'spa',
    label: 'SpA',
    baseKey: 'specialAttack',
    finalKey: 'specialAttack',
  },
  {
    key: 'spd',
    label: 'SpD',
    baseKey: 'specialDefense',
    finalKey: 'specialDefense',
  },
  { key: 'spe', label: 'Spe', baseKey: 'speed', finalKey: 'speed' },
]

type Props = {
  sp: Spread
  stages: StatStages
  baseStats: Stats | null
  finalStats: Stats | null
  status: StatusCondition
  accent?: 'plasma' | 'cyan'
  onSpChange: (patch: Partial<Spread>) => void
  onStageChange: (patch: Partial<StatStages>) => void
}

export function StatTable({
  sp,
  stages,
  baseStats,
  finalStats,
  status,
  accent = 'plasma',
  onSpChange,
  onStageChange,
}: Props) {
  const headingId = useId()
  const accentLabel =
    accent === 'cyan' ? 'text-arena-cyan' : 'text-arena-plasma'
  const total = sp.hp + sp.atk + sp.def + sp.spa + sp.spd + sp.spe
  const remaining = 66 - total

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p id={headingId} className={`arena-label ${accentLabel}`}>
          Build · Base → SP → Stage → Final
        </p>
        <span
          data-testid="sp-remaining"
          className={`font-mono text-[0.7rem] uppercase tracking-[0.22em] ${
            remaining < 0 ? 'text-red-400' : 'text-white/44'
          }`}
        >
          Lv 50 · {remaining} SP remaining
        </span>
      </div>
      <div
        role="table"
        aria-labelledby={headingId}
        className="overflow-x-auto rounded-sm border border-white/10 bg-arena-void/50"
      >
        <div className="min-w-[34rem]">
          <div
            role="row"
            className="grid grid-cols-[0.7fr_0.8fr_1.2fr_0.8fr_0.9fr] items-center gap-2 border-b border-white/10 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/50"
          >
            <span role="columnheader">Stat</span>
            <span role="columnheader">Base</span>
            <span role="columnheader">SP 0–32</span>
            <span role="columnheader">Stage</span>
            <span role="columnheader">Final</span>
          </div>
          {ROWS.map((row) => (
            <StatRow
              key={row.key}
              row={row}
              sp={sp[row.key]}
              base={baseStats?.[row.baseKey] ?? null}
              final={resolveDisplayedFinalStat(
                finalStats,
                row.finalKey,
                row.key === 'hp' ? null : stages[row.key],
                status,
              )}
              stage={row.key === 'hp' ? null : stages[row.key]}
              onChange={(value) => onSpChange({ [row.key]: clampSp(value) })}
              onStageChange={
                row.key === 'hp'
                  ? undefined
                  : (value) => onStageChange({ [row.key]: value })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type RowProps = {
  row: Row
  sp: number
  base: number | null
  final: number | null
  stage: number | null
  onChange: (value: number) => void
  onStageChange?: (value: number) => void
}

function StatRow({
  row,
  sp,
  base,
  final,
  stage,
  onChange,
  onStageChange,
}: RowProps) {
  const inputId = useId()
  return (
    <div
      role="row"
      className="grid grid-cols-[0.7fr_0.8fr_1.2fr_0.8fr_0.9fr] items-center gap-2 border-b border-white/5 px-3 py-2 last:border-b-0"
    >
      <label
        htmlFor={inputId}
        className="font-display text-sm font-bold tracking-[0.18em] text-white/80"
      >
        {row.label}
      </label>
      <span
        role="cell"
        className="font-mono text-sm text-white/72"
        data-testid={`stat-base-${row.key}`}
      >
        {base ?? '—'}
      </span>
      <input
        id={inputId}
        role="cell"
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_SP_PER_STAT}
        step={1}
        value={sp}
        aria-label={`${row.label} SP`}
        className="arena-input h-10 w-full max-w-[100px] px-2 py-1 text-sm"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(Number.isFinite(parsed) ? parsed : 0)
        }}
      />
      {row.key === 'hp' || stage === null || onStageChange === undefined ? (
        <div
          role="cell"
          data-testid={`stat-stage-${row.key}`}
          className="flex items-center justify-end gap-1"
        >
          <span className="arena-chip min-w-7 justify-center px-1.5 text-[0.72rem] text-transparent">
            -
          </span>
          <span className="min-w-[3ch] text-center font-mono text-xs text-white/22">
            —
          </span>
          <span className="arena-chip min-w-7 justify-center px-1.5 text-[0.72rem] text-transparent">
            +
          </span>
        </div>
      ) : (
        <StageControl
          statKey={row.key}
          value={stage}
          onChange={onStageChange}
        />
      )}
      <span
        role="cell"
        data-testid={`stat-final-${row.key}`}
        className="text-right font-display text-base font-semibold text-white"
      >
        {final ?? '—'}
      </span>
    </div>
  )
}

function StageControl({
  statKey,
  value,
  onChange,
}: {
  statKey: Exclude<StatKey, 'hp'>
  value: number
  onChange: (value: number) => void
}) {
  const label = statKey === 'spe' ? 'Speed' : statKey.toUpperCase()

  return (
    <div
      role="cell"
      className="flex items-center justify-end gap-1"
      data-testid={`stage-control-${statKey}`}
    >
      <button
        type="button"
        className="arena-chip min-h-8 min-w-8 justify-center px-1.5 text-[0.72rem] text-white/80"
        aria-label={`${label} stage down`}
        onClick={() => onChange(Math.max(-6, value - 1))}
      >
        -
      </button>
      <span
        className="min-w-[3ch] text-center font-mono text-xs text-white/78"
        data-testid={`stage-value-${statKey}`}
      >
        {value > 0 ? `+${value}` : value}
      </span>
      <button
        type="button"
        className="arena-chip min-h-8 min-w-8 justify-center px-1.5 text-[0.72rem] text-white/80"
        aria-label={`${label} stage up`}
        onClick={() => onChange(Math.min(6, value + 1))}
      >
        +
      </button>
    </div>
  )
}

function resolveDisplayedFinalStat(
  finalStats: Stats | null,
  key: keyof Stats,
  stage: number | null,
  status: StatusCondition,
) {
  if (finalStats === null) {
    return null
  }

  let value = finalStats[key]

  if (stage !== null) {
    value = applyStage(value, stage)
  }

  if (key === 'speed' && status === 'PARALYSIS') {
    return Math.floor(value / 2)
  }

  return value
}

function applyStage(stat: number, stage: number) {
  const normalizedStage = Math.max(-6, Math.min(6, stage))
  if (normalizedStage === 0) {
    return stat
  }
  if (normalizedStage > 0) {
    return Math.floor((stat * (2 + normalizedStage)) / 2)
  }
  return Math.floor((stat * 2) / (2 + Math.abs(normalizedStage)))
}
