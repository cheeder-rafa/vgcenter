import { useState } from 'react'

import { useCalculatorStore } from '../store/useCalculatorStore'
import type { DamageResult, MoveCategory } from '../types/api'
import { copyDamageReport } from './copyDamageReport'
import { DamageBar } from './DamageBar'
import { formatSummaryText } from './formatReadoutText'
import { RollSummary } from './RollSummary'
import { useToastStore } from '../store/useToastStore'
import { getTypeChipClasses } from './typeColors'

export type MoveEntry = {
  moveName: string | null
  moveType: string | null
  moveCategory?: MoveCategory | null
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
  /** Actual finalStats.hp of the attacker (needed for defender-side roll heatmap) */
  attackerHp?: number | null
  /** Actual finalStats.hp of the defender (needed for attacker-side roll heatmap) */
  defenderHp?: number | null
}

function koTier(
  result: DamageResult | null,
): 'ohko' | '2hko' | 'partial' | 'safe' | 'none' {
  if (result === null) return 'none'
  const { probability, hits } = result.koChance
  if (probability > 0 && hits === 1) return 'ohko'
  if (probability >= 1 && hits === 2) return '2hko'
  if (probability > 0 && hits <= 2) return 'partial'
  return 'safe'
}

const KO_TIER_COLOR: Record<ReturnType<typeof koTier>, string> = {
  ohko: 'rgba(255, 75, 75, 0.92)',
  '2hko': 'rgba(255, 145, 30, 0.90)',
  partial: 'rgba(255, 210, 74, 0.85)',
  safe: 'rgba(255,255,255,0.5)',
  none: 'rgba(255,255,255,0.25)',
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
  const tier = koTier(result)
  const readoutColor = KO_TIER_COLOR[tier]

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
      aria-label={
        hasResult ? `${moveName ?? 'Move'} — click to see rolls` : undefined
      }
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
      className={`flex flex-col gap-1 rounded-sm border px-2 py-2 transition-colors ${
        hasResult ? 'cursor-pointer' : 'cursor-default opacity-50'
      } ${accentRing}`}
    >
      <div className="grid grid-cols-[2.5ch_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:grid-cols-[2ch_1fr_6ch_9ch] sm:gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/35">
          M{index + 1}
        </span>
        <span className="truncate font-mono text-[0.72rem] text-white/65">
          {moveName ?? '—'}
        </span>
        <span
          className={`arena-chip w-auto min-w-[5.5ch] justify-center overflow-hidden whitespace-nowrap text-[0.55rem] tracking-tight sm:w-full ${getTypeChipClasses(moveType ?? null)}`}
        >
          {moveType ?? '—'}
        </span>
        <span
          className="col-start-2 text-right font-mono text-[0.72rem] tabular-nums sm:col-auto"
          style={{ color: readoutColor }}
          data-testid={`overview-readout-${side}-${index}`}
          data-ko-tier={tier === 'none' ? undefined : tier}
        >
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
  attackerHp,
  defenderHp,
}: {
  entry: MoveEntry
  attackerName: string | null
  defenderName: string | null
  side: 'attacker' | 'defender'
  attackerHp: number | null
  defenderHp: number | null
}) {
  const attackingCombatant = useCalculatorStore((state) =>
    side === 'attacker' ? state.attacker : state.defender,
  )
  const defendingCombatant = useCalculatorStore((state) =>
    side === 'attacker' ? state.defender : state.attacker,
  )
  const { moveName, moveCategory, result } = entry
  if (result === null) return null

  const effectiveAttacker = side === 'attacker' ? attackerName : defenderName
  const effectiveDefender = side === 'attacker' ? defenderName : attackerName
  const effectiveDefenderHp = side === 'attacker' ? defenderHp : attackerHp

  const summaryText = formatSummaryText({
    attackerName: effectiveAttacker,
    defenderName: effectiveDefender,
    moveName,
    attackerMegaActive: attackingCombatant.megaActive,
    defenderMegaActive: defendingCombatant.megaActive,
    moveCategory,
    attackerSp: attackingCombatant.sp,
    defenderSp: defendingCombatant.sp,
    attackerStages: attackingCombatant.stages,
    defenderStages: defendingCombatant.stages,
    result,
  })
  const hp = effectiveDefenderHp ?? result.max + 1

  async function handleCopy() {
    await copyDamageReport(summaryText)
    useToastStore.getState().push('Copied to clipboard')
  }

  return (
    <div
      data-testid="move-detail-panel"
      className="flex h-full flex-col gap-3 rounded-sm border border-white/10 bg-white/[0.04] px-3 py-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.78rem] leading-5 text-white/90">
            {summaryText}
          </p>
          <div className="pt-1">
            <RollSummary
              rolls={result.rolls}
              defenderHp={hp}
              summaryTestId="overview-roll-summary"
              rollsTestId="overview-rolls-text"
              compact
            />
          </div>
        </div>
        <button
          type="button"
          aria-label="Copy damage report"
          onClick={() => void handleCopy()}
          className="w-full shrink-0 rounded-sm border border-white/15 bg-white/[0.06] px-2 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/50 transition hover:border-white/30 hover:bg-white/[0.1] hover:text-white/80 active:scale-95 sm:w-auto"
        >
          Copy
        </button>
      </div>
    </div>
  )
}

function SideColumn({
  label,
  accentText,
  accentBorder,
  className = '',
  side,
  moves,
  selected,
  onSelect,
}: {
  label: string
  accentText: string
  accentBorder: string
  className?: string
  side: 'attacker' | 'defender'
  moves: MoveEntry[]
  selected: SelectedMove | null
  onSelect: (index: number) => void
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-sm border ${accentBorder} bg-white/[0.03] px-2 py-2 ${className}`}
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
    </div>
  )
}

function FocusLane({
  selected,
  hasAny,
  attackerMoves,
  defenderMoves,
  attackerName,
  defenderName,
  attackerHp,
  defenderHp,
}: {
  selected: SelectedMove | null
  hasAny: boolean
  attackerMoves: MoveEntry[]
  defenderMoves: MoveEntry[]
  attackerName: string | null
  defenderName: string | null
  attackerHp: number | null
  defenderHp: number | null
}) {
  const activeEntry =
    selected === null
      ? null
      : ((selected.side === 'attacker'
          ? attackerMoves[selected.index]
          : defenderMoves[selected.index]) ?? null)

  return (
    <div
      data-testid="overview-focus-lane"
      className="order-3 flex min-h-[176px] flex-col xl:col-start-2 xl:row-start-1"
    >
      {selected !== null &&
      activeEntry !== null &&
      activeEntry.result !== null ? (
        <DetailPanel
          entry={activeEntry}
          attackerName={attackerName}
          defenderName={defenderName}
          side={selected.side}
          attackerHp={attackerHp}
          defenderHp={defenderHp}
        />
      ) : (
        <div className="flex h-full min-h-[176px] flex-col justify-between rounded-sm border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="space-y-2">
            <p className="arena-label text-arena-violet">Roll Focus</p>
            <h3 className="font-display text-lg font-semibold tracking-wide text-white">
              {hasAny ? 'Select a move' : 'Waiting for live damage'}
            </h3>
            <p className="font-body text-sm leading-6 text-white/65">
              {hasAny
                ? 'Pick either side to inspect the 16 rolls, KO counts, and a copy-ready readout without breaking the matchup rhythm.'
                : 'Load both sides with a legal move to populate this analysis lane.'}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="rounded-sm border border-white/10 bg-white/[0.04] px-2.5 py-2">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/35">
                16 rolls
              </p>
              <p className="pt-1 font-body text-sm text-white/70">
                Range, lethal count, and copy text stay centered between both
                combatants.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DualMoveReadout({
  attackerName,
  defenderName,
  attackerMoves,
  defenderMoves,
  attackerHp = null,
  defenderHp = null,
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
    <article className="arena-panel arena-panel--violet relative overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-2">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-3">
        <header className="flex flex-wrap items-center gap-2">
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

        <div
          className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)] xl:items-start"
          data-testid="damage-overview-columns"
        >
          <SideColumn
            className="order-1 xl:col-start-1 xl:row-start-1"
            label={attackerName ?? 'Side A'}
            accentText="text-arena-plasma"
            accentBorder="border-arena-plasma/20"
            side="attacker"
            moves={attackerMoves}
            selected={selected}
            onSelect={(i) => handleSelect('attacker', i)}
          />
          <FocusLane
            selected={selected}
            hasAny={hasAny}
            attackerMoves={attackerMoves}
            defenderMoves={defenderMoves}
            attackerName={attackerName}
            defenderName={defenderName}
            attackerHp={attackerHp}
            defenderHp={defenderHp}
          />
          <SideColumn
            className="order-2 xl:col-start-3 xl:row-start-1"
            label={defenderName ?? 'Side B'}
            accentText="text-arena-cyan"
            accentBorder="border-arena-cyan/20"
            side="defender"
            moves={defenderMoves}
            selected={selected}
            onSelect={(i) => handleSelect('defender', i)}
          />
        </div>
      </div>
    </article>
  )
}
