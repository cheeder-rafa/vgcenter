import { useMemo, type KeyboardEvent } from 'react'

import {
  useCalculatorStore,
  type CalculatorSide,
} from '../store/useCalculatorStore'
import { useToastStore } from '../store/useToastStore'
import type { DamageResult } from '../types/api'
import { copyDamageReport } from './copyDamageReport'
import { formatSummaryText } from './formatReadoutText'
import { RollSummary } from './RollSummary'

type Props = {
  focusedSide: CalculatorSide
  focusedIndex: number
  result: DamageResult | null
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string | null
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
}

export function DetailedResult({
  focusedSide,
  focusedIndex,
  result,
  status,
  errorMessage = null,
  attackerName,
  defenderName,
  moveName,
}: Props) {
  const attackerLabel = focusedSide === 'attacker' ? attackerName : defenderName
  const defenderLabel = focusedSide === 'attacker' ? defenderName : attackerName
  const attackingCombatant = useCalculatorStore((state) => state[focusedSide])
  const defendingSide = useCalculatorStore((state) =>
    focusedSide === 'attacker' ? state.defenderSide : state.attackerSide,
  )
  const moveId = useCalculatorStore(
    (state) => state[focusedSide].moves[focusedIndex]?.moveId ?? null,
  )
  const move = useCalculatorStore((state) =>
    moveId === null
      ? null
      : (state.moveCatalog.find((entry) => entry.id === moveId) ?? null),
  )
  const defenderHp = useCalculatorStore((state) =>
    focusedSide === 'attacker'
      ? (state.defender.finalStats?.hp ?? null)
      : (state.attacker.finalStats?.hp ?? null),
  )

  const throughProtect =
    result !== null &&
    result.max > 0 &&
    defendingSide.protect &&
    (attackingCombatant.abilityId === 'piercing-drill' ||
      (attackingCombatant.abilityId === 'unseen-fist' &&
        move?.contact === true))

  const copyText = useMemo(
    () =>
      result === null
        ? null
        : formatSummaryText({
            attackerName: attackerLabel,
            defenderName: defenderLabel,
            moveName,
            result,
            throughProtect,
          }),
    [attackerLabel, defenderLabel, moveName, result, throughProtect],
  )

  async function handleCopy() {
    if (copyText === null) {
      return
    }

    await copyDamageReport(copyText)
    useToastStore.getState().push('Copied to clipboard')
  }

  const buttonProps =
    copyText === null
      ? {}
      : {
          role: 'button' as const,
          tabIndex: 0,
          'aria-label': 'Copy damage report',
          onClick: () => {
            void handleCopy()
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              void handleCopy()
            }
          },
        }

  return (
    <article
      className={`arena-panel arena-panel--violet relative overflow-hidden px-3 py-2 sm:px-3 sm:py-2 ${
        copyText === null ? '' : 'cursor-copy'
      }`}
      {...buttonProps}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-2.5">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="arena-label text-arena-violet">
              Detailed Readout · Slot M{focusedIndex + 1}
            </p>
            <h2 className="font-display text-lg font-bold tracking-wide text-white">
              {attackerLabel ?? '—'}{' '}
              <span className="text-arena-violet/70">→</span>{' '}
              {defenderLabel ?? '—'}
            </h2>
            {moveName !== null ? (
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/55">
                Move · {moveName}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`arena-chip text-[0.62rem] tracking-[0.2em] ${
                focusedSide === 'attacker'
                  ? 'text-arena-plasma'
                  : 'text-arena-cyan'
              }`}
            >
              ATTACKER
            </span>
          </div>
        </header>

        {status === 'error' ? (
          <ErrorBlock message={errorMessage} />
        ) : result === null ? (
          <StandbyBlock status={status} />
        ) : (
          <LiveBlock
            attackerName={attackerLabel}
            defenderName={defenderLabel}
            moveName={moveName}
            result={result}
            throughProtect={throughProtect}
            defenderHp={defenderHp}
          />
        )}
      </div>
    </article>
  )
}

function StandbyBlock({ status }: { status: Props['status'] }) {
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
        {status === 'loading'
          ? 'Syncing damage engine…'
          : 'Select a move to see its live damage report.'}
      </p>
    </div>
  )
}

function ErrorBlock({ message }: { message: string | null }) {
  return (
    <div className="rounded-sm border border-[rgba(255,145,145,0.32)] bg-[rgba(127,24,35,0.18)] px-3 py-2">
      <p className="arena-label text-[rgba(255,184,184,0.92)]">Error</p>
      <p className="pt-1 font-body text-sm leading-6 text-white/75">
        {message ?? 'The calculator could not complete the request.'}
      </p>
    </div>
  )
}

function LiveBlock({
  attackerName,
  defenderName,
  moveName,
  result,
  throughProtect,
  defenderHp,
}: {
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
  result: DamageResult
  throughProtect: boolean
  defenderHp: number | null
}) {
  const hp = defenderHp ?? result.max + 1
  const summary = formatSummaryText({
    attackerName,
    defenderName,
    moveName,
    result,
    throughProtect,
  })

  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.04]">
      <div className="px-3 py-2.5">
        <p className="font-mono text-[0.86rem] leading-6 text-white sm:text-[0.92rem]">
          {summary}
        </p>
        <div className="pt-1.5">
          <RollSummary
          rolls={result.rolls}
          defenderHp={hp}
            summaryTestId="detailed-roll-summary"
            rollsTestId="detailed-rolls"
          />
        </div>
      </div>
    </div>
  )
}
