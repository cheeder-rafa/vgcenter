import { useState } from 'react'

import type { DamageResult } from '../types/api'
import { copyDamageReport } from './copyDamageReport'
import { DamageBar } from './DamageBar'
import { formatRollsText, formatSummaryText } from './formatReadoutText'
import { RollHeatmap } from './RollHeatmap'
import { useToastStore } from '../store/useToastStore'
import { getTypeChipClasses } from './typeColors'

export type MoveEntry = {
  moveName: string | null
  moveType: string | null
  result: DamageResult | null
}

type SelectedMove = {
  side: 'attacker' | 'defender'
  index: number
}

type Props = {
  attackerName: string | null
  defenderName: string | null
  attackerMoves: MoveEntry[]
  defenderMoves: MoveEntry[]
}

function MoveReadoutRow({
  index,
  side,
  moveName,
  moveType,
  result,
  selected,
  onSelect,
}: MoveEntry & {
  index: number
  side: 'attacker' | 'defender'
  selected: boolean
  onSelect: () => void
}) {
  const readout =
    result !== null
      ? `${result.minPct.toFixed(1)}–${result.maxPct.toFixed(1)}%`
      : '— %'

  const hasResult = result !== null
  const accentRing = selected
    ? side === 'attacker'
      ? 'border-arena-plasma/60 bg-arena-plasma/[0.06]'
      : 'border-arena-cyan/60 bg-arena-cyan/[0.06]'
    : 'border-transparent hover:border-white/10'

  return (
    <div
      role="button"
      tabIndex={hasResult ? 0 : -1}
      aria-pressed={selected}
      aria-label={hasResult ? `${moveName ?? 'Move'} — click to see rolls` : undefined}
      data-testid={`overview-move-${side}-${index}`}
      onClick={() => {
        if (hasResult) onSelect()
      }}
      onKeyDown={(e) => {
        if (hasResult && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`flex flex-col gap-0.5 rounded-sm border px-2 py-1 transition-colors ${
        hasResult ? 'cursor-pointer' : 'cursor-default opacity-50'
      } ${accentRing}`}
    >
      <div className="grid grid-cols-[2ch_1fr_6ch_9ch] items-center gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/35">
          M{index + 1}
        </span>
        <span className="truncate font-mono text-[0.72rem] text-white/65">
          {moveName ?? '—'}
        </span>
        <span
          className={`arena-chip w-full justify-center overflow-hidden whitespace-nowrap text-[0.55rem] tracking-tight ${getTypeChipClasses(moveType ?? null)}`}
        >
          {moveType ?? '—'}
        </span>
        <span className="text-right font-mono text-[0.72rem] tabular-nums text-white/80">
          {readout}
        </span>
      </div>
      {result !== null && (
        <DamageBar minPct={result.minPct} maxPct={result.maxPct} />
      )}
    </div>
  )
}

function DetailPanel({
  entry,
  attackerName,
  defenderName,
  side,
}: {
  entry: MoveEntry
  attackerName: string | null
  defenderName: string | null
  side: 'attacker' | 'defender'
}) {
  const { moveName, result } = entry
  if (result === null) return null

  const effectiveAttacker = side === 'attacker' ? attackerName : defenderName
  const effectiveDefender = side === 'attacker' ? defenderName : attackerName

  const summaryText = formatSummaryText({
    attackerName: effectiveAttacker,
    defenderName: effectiveDefender,
    moveName,
    result,
  })
  const rollsText = formatRollsText(result)
  const hp = result.max + 1
  const koChancePct = result.koChance.probability * 100
  const accent = side === 'attacker' ? 'plasma' : 'cyan'

  async function handleCopy() {
    await copyDamageReport(summaryText)
    useToastStore.getState().push('Copied to clipboard')
  }

  return (
    <div
      data-testid="move-detail-panel"
      className="flex flex-col gap-2 rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.78rem] leading-5 text-white/90">
            {summaryText}
          </p>
          <p
            className="pt-0.5 font-mono text-[0.65rem] leading-4 text-white/40"
            data-testid="overview-rolls-text"
          >
            {rollsText}
          </p>
        </div>
        <button
          type="button"
          aria-label="Copy damage report"
          onClick={() => void handleCopy()}
          className="shrink-0 rounded-sm border border-white/15 bg-white/[0.06] px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/50 transition hover:border-white/30 hover:bg-white/[0.1] hover:text-white/80 active:scale-95"
        >
          Copy
        </button>
      </div>
      <RollHeatmap
        rolls={result.rolls}
        defenderHp={hp}
        koChancePct={koChancePct}
        defenderName={effectiveDefender}
        accent={accent}
      />
    </div>
  )
}

function SideColumn({
  label,
  accentText,
  accentBorder,
  side,
  moves,
  selected,
  onSelect,
  attackerName,
  defenderName,
}: {
  label: string
  accentText: string
  accentBorder: string
  side: 'attacker' | 'defender'
  moves: MoveEntry[]
  selected: SelectedMove | null
  onSelect: (index: number) => void
  attackerName: string | null
  defenderName: string | null
}) {
  const expandedIndex =
    selected?.side === side ? selected.index : null
  const expandedEntry =
    expandedIndex !== null ? (moves[expandedIndex] ?? null) : null

  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-sm border ${accentBorder} bg-white/[0.03] px-2 py-2`}
    >
      <p className={`arena-label px-1 ${accentText}`}>{label} · Moves</p>
      <div className="flex flex-col gap-1">
        {moves.map((entry, i) => (
          <MoveReadoutRow
            key={i}
            index={i}
            side={side}
            {...entry}
            selected={selected?.side === side && selected.index === i}
            onSelect={() => onSelect(i)}
          />
        ))}
      </div>

      {/* Inline roll detail — expands when a move is selected in this column */}
      {expandedEntry !== null && expandedEntry.result !== null && (
        <DetailPanel
          entry={expandedEntry}
          attackerName={attackerName}
          defenderName={defenderName}
          side={side}
        />
      )}
    </div>
  )
}

export function DualMoveReadout({
  attackerName,
  defenderName,
  attackerMoves,
  defenderMoves,
}: Props) {
  const [selected, setSelected] = useState<SelectedMove | null>(null)

  const hasAny =
    attackerMoves.some((m) => m.result !== null) ||
    defenderMoves.some((m) => m.result !== null)

  function handleSelect(side: 'attacker' | 'defender', index: number) {
    const moves = side === 'attacker' ? attackerMoves : defenderMoves
    if (moves[index]?.result === null) return
    setSelected((prev) =>
      prev?.side === side && prev.index === index ? null : { side, index },
    )
  }

  return (
    <article className="arena-panel arena-panel--violet relative overflow-hidden px-3 py-2">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-2">
        <header className="flex items-center gap-2">
          <p className="arena-label text-arena-violet">Damage Overview</p>
          {!hasAny && (
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/30">
              · Select moves to see live damage
            </span>
          )}
          {hasAny && selected === null && (
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/25">
              · Click a move for rolls
            </span>
          )}
        </header>

        <div className="flex gap-3">
          <SideColumn
            label={attackerName ?? 'Side A'}
            accentText="text-arena-plasma"
            accentBorder="border-arena-plasma/20"
            side="attacker"
            moves={attackerMoves}
            selected={selected}
            onSelect={(i) => handleSelect('attacker', i)}
            attackerName={attackerName}
            defenderName={defenderName}
          />
          <SideColumn
            label={defenderName ?? 'Side B'}
            accentText="text-arena-cyan"
            accentBorder="border-arena-cyan/20"
            side="defender"
            moves={defenderMoves}
            selected={selected}
            onSelect={(i) => handleSelect('defender', i)}
            attackerName={attackerName}
            defenderName={defenderName}
          />
        </div>
      </div>
    </article>
  )
}
