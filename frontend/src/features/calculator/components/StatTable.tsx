import { useId } from 'react'

import type { Spread, Stats } from '../types/api'
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
  baseStats: Stats | null
  finalStats: Stats | null
  accent?: 'plasma' | 'cyan'
  onSpChange: (patch: Partial<Spread>) => void
}

export function StatTable({
  sp,
  baseStats,
  finalStats,
  accent = 'plasma',
  onSpChange,
}: Props) {
  const headingId = useId()
  const accentLabel =
    accent === 'cyan' ? 'text-arena-cyan' : 'text-arena-plasma'
  const total = sp.hp + sp.atk + sp.def + sp.spa + sp.spd + sp.spe

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p id={headingId} className={`arena-label ${accentLabel}`}>
          Build · Base → SP → Final
        </p>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/44">
          Lv 50 · {total}/192 SP
        </span>
      </div>
      <div
        role="table"
        aria-labelledby={headingId}
        className="rounded-sm border border-white/10 bg-arena-void/50"
      >
        <div
          role="row"
          className="grid grid-cols-[0.7fr_0.9fr_1.3fr_0.9fr] items-center gap-2 border-b border-white/10 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/50"
        >
          <span role="columnheader">Stat</span>
          <span role="columnheader">Base</span>
          <span role="columnheader">SP 0–32</span>
          <span role="columnheader">Final</span>
        </div>
        {ROWS.map((row) => (
          <StatRow
            key={row.key}
            row={row}
            sp={sp[row.key]}
            base={baseStats?.[row.baseKey] ?? null}
            final={finalStats?.[row.finalKey] ?? null}
            onChange={(value) => onSpChange({ [row.key]: clampSp(value) })}
          />
        ))}
      </div>
    </div>
  )
}

type RowProps = {
  row: Row
  sp: number
  base: number | null
  final: number | null
  onChange: (value: number) => void
}

function StatRow({ row, sp, base, final, onChange }: RowProps) {
  const inputId = useId()
  return (
    <div
      role="row"
      className="grid grid-cols-[0.7fr_0.9fr_1.3fr_0.9fr] items-center gap-2 border-b border-white/5 px-3 py-2 last:border-b-0"
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
        className="arena-input h-9 w-full max-w-[100px] px-2 py-1 text-sm"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(Number.isFinite(parsed) ? parsed : 0)
        }}
      />
      <span
        role="cell"
        data-testid={`stat-final-${row.key}`}
        className="font-display text-base font-semibold text-white"
      >
        {final ?? '—'}
      </span>
    </div>
  )
}
