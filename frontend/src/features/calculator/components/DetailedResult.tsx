import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'

import type { CalculatorSide } from '../store/useCalculatorStore'
import type { DamageResult } from '../types/api'
import { copyDamageReport } from './copyDamageReport'
import { formatReadoutText } from './formatReadoutText'

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
  const [copied, setCopied] = useState(false)
  const attackerLabel = focusedSide === 'attacker' ? attackerName : defenderName
  const defenderLabel = focusedSide === 'attacker' ? defenderName : attackerName

  const copyText = useMemo(
    () =>
      result === null
        ? null
        : formatReadoutText({
            attackerName: attackerLabel,
            defenderName: defenderLabel,
            moveName,
            result,
          }),
    [attackerLabel, defenderLabel, moveName, result],
  )

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function handleCopy() {
    if (copyText === null) {
      return
    }

    await copyDamageReport(copyText)
    setCopied(true)
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
      className={`arena-panel arena-panel--violet relative overflow-hidden px-4 py-3 sm:px-4 sm:py-3 ${
        copyText === null ? '' : 'cursor-copy'
      }`}
      {...buttonProps}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-3">
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
              className={`arena-chip ${
                focusedSide === 'attacker'
                  ? 'text-arena-plasma'
                  : 'text-arena-cyan'
              }`}
            >
              {focusedSide === 'attacker' ? 'OFFENSE' : 'COUNTER'}
            </span>
            <span className="arena-chip text-arena-violet/90">
              {status === 'loading'
                ? 'RUNNING'
                : status === 'error'
                  ? 'ERROR'
                  : result !== null
                    ? 'LIVE'
                    : 'STANDBY'}
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
          />
        )}
      </div>

      {copied ? (
        <div className="pointer-events-none absolute right-4 top-3 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-emerald-100 transition-opacity">
          Copied damage report
        </div>
      ) : null}
    </article>
  )
}

function StandbyBlock({ status }: { status: Props['status'] }) {
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.04] px-3 py-3">
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
    <div className="rounded-sm border border-[rgba(255,145,145,0.32)] bg-[rgba(127,24,35,0.18)] px-4 py-3">
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
}: {
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
  result: DamageResult
}) {
  const readout = formatReadoutText({
    attackerName,
    defenderName,
    moveName,
    result,
  })
  const [summary, rolls] = readout.split('\n')

  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="font-mono text-[0.86rem] leading-6 text-white sm:text-[0.92rem]">
        {summary}
      </p>
      <p
        className="pt-1 font-mono text-[0.72rem] leading-5 text-white/58"
        data-testid="detailed-rolls"
      >
        {rolls}
      </p>
    </div>
  )
}
