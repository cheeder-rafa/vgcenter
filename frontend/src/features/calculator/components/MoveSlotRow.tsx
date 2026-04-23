import { useId, useMemo } from 'react'

import type { DamageResult, MoveDefinition } from '../types/api'
import { DamageBar } from './DamageBar'
import { DamageDeltaChip } from './DamageDeltaChip'
import { getTypeChipClasses } from './typeColors'

type Props = {
  index: number
  moveId: string | null
  legalMoveIds: string[] | null
  allMoves: MoveDefinition[]
  result: DamageResult | null
  previousResult?: DamageResult | null
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
  previousResult = null,
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
      className={`flex cursor-pointer flex-col gap-1.5 rounded-sm border bg-white/[0.04] px-2.5 py-2 transition hover:border-white/25 sm:px-3 ${accentBorder} ${accentGlow}`}
      data-testid={`move-slot-${index}`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 sm:grid-cols-[auto_minmax(0,1fr)_8ch_10ch_auto] sm:gap-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/55">
          M{index + 1}
        </span>
        <select
          id={selectId}
          aria-label={`Move slot ${index + 1}`}
          className="arena-select col-span-full h-10 py-2 sm:col-auto sm:h-9 sm:py-1"
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
          className={`arena-chip w-auto min-w-[6ch] justify-center overflow-hidden whitespace-nowrap text-[0.58rem] tracking-tight sm:w-[8ch] ${getTypeChipClasses(
            selectedMove?.type ?? null,
          )}`}
          data-testid={`move-slot-type-${index}`}
        >
          {selectedMove?.type ?? '—'}
        </span>
        <span
          className="col-start-2 whitespace-nowrap text-right font-mono text-xs text-white/80 sm:col-auto sm:min-w-[10ch]"
          data-testid={`move-slot-readout-${index}`}
        >
          {readout}
        </span>
        {result !== null ? (
          <DamageDeltaChip
            current={result}
            previous={previousResult}
            testId={`move-slot-delta-${index}`}
            className="sm:justify-self-end"
          />
        ) : null}
      </div>
      {result !== null && (
        <DamageBar minPct={result.minPct} maxPct={result.maxPct} />
      )}
    </div>
  )
}

function formatReadout(result: DamageResult | null): string {
  if (result === null) {
    return '— %'
  }
  return `${result.minPct.toFixed(1)}% – ${result.maxPct.toFixed(1)}%`
}
