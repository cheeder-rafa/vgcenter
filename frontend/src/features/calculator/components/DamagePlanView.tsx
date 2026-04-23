import type { DamageResult, MoveCategory } from '../types/api'
import { DamageBar } from './DamageBar'
import { DamageDeltaChip } from './DamageDeltaChip'
import type { MoveEntry } from './DualMoveReadout'
import { getTypeChipClasses } from './typeColors'

export type PlannedMoveEntry = MoveEntry & {
  previousResult?: DamageResult | null
}

type Props = {
  attackerName: string | null
  defenderName: string | null
  attackerMoves: PlannedMoveEntry[]
  defenderMoves: PlannedMoveEntry[]
  attackerHp?: number | null
  defenderHp?: number | null
}

export function DamagePlanView({
  attackerName,
  defenderName,
  attackerMoves,
  defenderMoves,
  attackerHp = null,
  defenderHp = null,
}: Props) {
  return (
    <article
      className="arena-panel arena-panel--plasma relative overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-2"
      data-testid="damage-plan-view"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-3">
        <header className="flex flex-wrap items-center gap-2">
          <p className="arena-label text-arena-plasma">Damage Plan</p>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/30">
            · Sequence the line, then compare the damage delta at each edit
          </span>
        </header>

        <div className="grid gap-3 xl:grid-cols-2">
          <PlanLine
            label={attackerName ?? 'Side A'}
            accentText="text-arena-plasma"
            accentBorder="border-arena-plasma/20"
            steps={attackerMoves}
            startingHp={defenderHp}
            targetLabel={defenderName ?? 'Defender'}
          />
          <PlanLine
            label={defenderName ?? 'Side B'}
            accentText="text-arena-cyan"
            accentBorder="border-arena-cyan/20"
            steps={defenderMoves}
            startingHp={attackerHp}
            targetLabel={attackerName ?? 'Attacker'}
          />
        </div>
      </div>
    </article>
  )
}

function PlanLine({
  label,
  accentText,
  accentBorder,
  steps,
  startingHp,
  targetLabel,
}: {
  label: string
  accentText: string
  accentBorder: string
  steps: PlannedMoveEntry[]
  startingHp: number | null
  targetLabel: string
}) {
  const hasSteps = steps.some((entry) => entry.result !== null)

  return (
    <section
      className={`flex min-w-0 flex-col gap-2 rounded-sm border ${accentBorder} bg-white/[0.03] px-3 py-3`}
      data-testid={`damage-plan-line-${label.toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`arena-label ${accentText}`}>{label} · Plan</p>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/35">
          vs. {targetLabel}
        </span>
      </div>

      {hasSteps ? (
        <div className="flex flex-col gap-2">
          {buildPlanTrack(steps, startingHp).map((step) => (
            <PlanStepCard key={step.index} {...step} />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-white/10 bg-white/[0.04] px-3 py-4 text-sm text-white/55">
          Add moves to the line to build a turn-by-turn damage plan.
        </div>
      )}
    </section>
  )
}

type PlannedCard = {
  index: number
  moveName: string | null
  moveType: string | null
  moveCategory: MoveCategory | null | undefined
  result: DamageResult
  previousResult: DamageResult | null
  remainingRange: string
}

function PlanStepCard({
  index,
  moveName,
  moveType,
  result,
  previousResult,
  remainingRange,
}: PlannedCard) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-white/10 bg-white/[0.04] px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/35">
          {index + 1}
        </span>
        <span className="truncate font-mono text-[0.72rem] text-white/75">
          {moveName ?? '—'}
        </span>
        <DamageDeltaChip
          current={result}
          previous={previousResult}
          testId={`plan-delta-${index}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`arena-chip w-auto min-w-[5.5ch] justify-center overflow-hidden whitespace-nowrap text-[0.55rem] tracking-tight ${getTypeChipClasses(moveType ?? null)}`}
        >
          {moveType ?? '—'}
        </span>
        <span className="font-mono text-[0.68rem] tabular-nums text-white/60">
          {result.minPct.toFixed(1)}% - {result.maxPct.toFixed(1)}%
        </span>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/35">
          {remainingRange} HP after step
        </span>
      </div>
      <DamageBar minPct={result.minPct} maxPct={result.maxPct} />
    </div>
  )
}

function buildPlanTrack(steps: PlannedMoveEntry[], startingHp: number | null) {
  const start = startingHp ?? null
  let currentMin = start
  let currentMax = start

  return steps
    .map((entry, index) => {
      if (entry.result === null) {
        return null
      }

      const nextMin =
        currentMin === null ? null : Math.max(0, currentMin - entry.result.max)
      const nextMax =
        currentMax === null ? null : Math.max(0, currentMax - entry.result.min)
      const remainingRange =
        nextMin === null || nextMax === null
          ? '—'
          : nextMin === nextMax
            ? `${nextMin}`
            : `${nextMin}–${nextMax}`

      currentMin = nextMin
      currentMax = nextMax

      return {
        index,
        moveName: entry.moveName,
        moveType: entry.moveType,
        moveCategory: entry.moveCategory,
        result: entry.result,
        previousResult: entry.previousResult ?? null,
        remainingRange,
      }
    })
    .filter((entry): entry is PlannedCard => entry !== null)
}
