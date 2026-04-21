import { useId, useMemo } from 'react'

import type { DamageResult, MoveDefinition } from '../types/api'
import { getTypeChipClasses } from './typeColors'

type Props = {
  index: number
  moveId: string | null
  legalMoveIds: string[] | null
  allMoves: MoveDefinition[]
  result: DamageResult | null
  focused: boolean
  accent?: 'plasma' | 'cyan'
  onMoveChange: (moveId: string | null) => void
  onFocus: () => void
}

export function MoveSlotRow({
  index,
  moveId,
  legalMoveIds,
  allMoves,
  result,
  focused,
  accent = 'plasma',
  onMoveChange,
  onFocus,
}: Props) {
  const selectId = useId()

  const legalMoveSet = useMemo(
    () =>
      legalMoveIds === null
        ? null
        : new Set(legalMoveIds.map((id) => id.toLowerCase())),
    [legalMoveIds],
  )

  const options = useMemo(() => {
    const filtered =
      legalMoveSet === null
        ? allMoves
        : allMoves.filter((move) => legalMoveSet.has(move.id.toLowerCase()))
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [allMoves, legalMoveSet])

  const accentBorder =
    focused && accent === 'cyan'
      ? 'border-arena-cyan/70'
      : focused
        ? 'border-arena-plasma/70'
        : 'border-white/10'
  const accentGlow =
    focused && accent === 'cyan'
      ? 'shadow-[0_0_24px_-12px_rgba(34,211,238,0.9)]'
      : focused
        ? 'shadow-[0_0_24px_-12px_rgba(255,43,142,0.9)]'
        : ''

  const readout = formatReadout(result)
  const selectedMove = useMemo(
    () => allMoves.find((move) => move.id === moveId) ?? null,
    [allMoves, moveId],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onFocus()
        }
      }}
      aria-pressed={focused}
      className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_7.5ch_10ch] items-center gap-3 rounded-sm border bg-white/[0.04] px-3 py-2 transition hover:border-white/25 ${accentBorder} ${accentGlow}`}
      data-testid={`move-slot-${index}`}
    >
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/55">
        M{index + 1}
      </span>
      <select
        id={selectId}
        aria-label={`Move slot ${index + 1}`}
        className="arena-select h-9 py-1"
        value={moveId ?? ''}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const next = event.target.value
          onMoveChange(next === '' ? null : next)
        }}
      >
        <option value="" className="bg-arena-void">
          — Empty —
        </option>
        {options.map((move) => (
          <option key={move.id} value={move.id} className="bg-arena-void">
            {move.name}
          </option>
        ))}
      </select>
      <span
        className={`arena-chip min-w-[7.5ch] justify-center whitespace-nowrap ${getTypeChipClasses(
          selectedMove?.type ?? null,
        )}`}
        data-testid={`move-slot-type-${index}`}
      >
        {selectedMove?.type ?? '—'}
      </span>
      <span
        className="min-w-[10ch] whitespace-nowrap text-right font-mono text-xs text-white/80"
        data-testid={`move-slot-readout-${index}`}
      >
        {readout}
      </span>
    </div>
  )
}

function formatReadout(result: DamageResult | null): string {
  if (result === null) {
    return '— %'
  }
  return `${result.minPct.toFixed(1)}% – ${result.maxPct.toFixed(1)}%`
}
