import { useState } from 'react'
import { Link } from 'react-router-dom'

import { encodeCalcState } from '../../calculator/share/encodeState'
import type { CombatantBuild, FieldRequest, SideConditions } from '../../calculator/types/api'
import { COLOR_CLASS, cellColorClass } from '../lib/cellColor'
import type { MatrixCell as MatrixCellType } from '../types'

type Props = {
  cell: MatrixCellType
  attacker: CombatantBuild
  defender: CombatantBuild
  regulation: string
  field: FieldRequest
  sideA: SideConditions
  sideB: SideConditions
}

export function MatrixCell({ cell, attacker, defender, regulation, field, sideA, sideB }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const colorKey = cellColorClass(cell.minPct, cell.maxPct)
  const colorClasses = COLOR_CLASS[colorKey]

  const encoded = encodeCalcState({
    regulation: regulation as 'M-A',
    attacker,
    defender,
    field,
    attackerSide: sideA,
    defenderSide: sideB,
    criticalHit: false,
    targets: 1,
  })

  const href = `/calc?s=${encoded}`
  const moveLabel = cell.bestMoveId
    ? cell.bestMoveId.replace(/-/g, ' ')
    : '—'

  return (
    <div
      className="relative"
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
      onFocus={() => setTooltipOpen(true)}
      onBlur={() => setTooltipOpen(false)}
    >
      <Link
        to={href}
        className={[
          'block rounded p-1.5 text-center transition-all duration-150 hover:ring-1 hover:ring-white/30 focus:outline-none focus:ring-1 focus:ring-arena-cyan',
          colorClasses,
        ].join(' ')}
        aria-label={`${moveLabel}: ${cell.minPct.toFixed(0)}–${cell.maxPct.toFixed(0)}%, open in calculator`}
      >
        <div className="truncate font-body text-[0.6rem] uppercase tracking-wide">
          {moveLabel}
        </div>
        <div className="font-display text-xs tabular-nums">
          {cell.minPct.toFixed(0)}–{cell.maxPct.toFixed(0)}
          <span className="font-body text-[0.55rem] opacity-70">%</span>
        </div>
        {cell.koChance.probability > 0 && (
          <div className="font-body text-[0.55rem] uppercase tracking-wide opacity-80">
            {cell.koChance.probability >= 1
              ? 'OHKO'
              : `${(cell.koChance.probability * 100).toFixed(0)}% KO`}
          </div>
        )}
      </Link>

      {tooltipOpen && cell.rolls.length > 0 && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded border border-white/10 bg-arena-void px-2.5 py-1.5 shadow-xl"
          style={{ minWidth: '10rem' }}
        >
          <p className="mb-1 font-body text-[0.6rem] uppercase tracking-wider text-white/50">
            Damage rolls
          </p>
          <div className="flex flex-wrap gap-1">
            {cell.rolls.map((r, i) => (
              <span
                key={i}
                className="rounded bg-white/5 px-1 font-display text-[0.6rem] tabular-nums text-white/70"
              >
                {r}
              </span>
            ))}
          </div>
          <p className="mt-1 font-body text-[0.6rem] text-white/40">{cell.koChance.description}</p>
        </div>
      )}
    </div>
  )
}
