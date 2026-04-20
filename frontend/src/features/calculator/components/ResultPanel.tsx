import type { ReactNode } from 'react'

import { t } from '../../../lib/i18n'
import type { CalculateDamageResponse } from '../types/api'

export type ResultMode = 'range' | 'rolls'
export type ResultStatus = 'idle' | 'loading' | 'success' | 'error'

type Props = {
  mode: ResultMode
  onModeChange: (mode: ResultMode) => void
  result: CalculateDamageResponse | null
  status: ResultStatus
  errorMessage: string | null
}

export function ResultPanel({
  mode,
  onModeChange,
  result,
  status,
  errorMessage,
}: Props) {
  return (
    <article className="arena-panel arena-panel--violet relative overflow-hidden p-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.07] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-arena-violet shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
              <p className="arena-label text-arena-violet">Damage Readout</p>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              {t('panel.result')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={mode === 'range'}
              onClick={() => onModeChange('range')}
            >
              Range
            </ModeButton>
            <ModeButton
              active={mode === 'rolls'}
              onClick={() => onModeChange('rolls')}
            >
              Full 16 Rolls
            </ModeButton>
          </div>
        </header>

        {status === 'loading' ? (
          <LoadingReadout />
        ) : status === 'error' ? (
          <ErrorReadout errorMessage={errorMessage} />
        ) : result === null ? (
          <EmptyReadout />
        ) : (
          <FilledReadout mode={mode} result={result} />
        )}
      </div>
    </article>
  )
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`rounded-sm border px-3 py-2 font-body text-sm transition ${
        active
          ? 'border-arena-plasma/55 bg-arena-plasma/14 text-white'
          : 'border-white/10 bg-white/[0.04] text-white/64 hover:border-white/24 hover:text-white'
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function EmptyReadout() {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-3">
        <p className="font-display text-[5rem] leading-none tracking-tight text-white/20 sm:text-[6rem]">
          — – —
        </p>
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-white/40">
          {t('result.waiting')}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-white/10 bg-white/5 p-5">
        <span className="arena-label text-arena-violet/70">Status</span>
        <span className="font-display text-lg text-white/80">Standby</span>
        <span className="font-mono text-xs text-white/50">
          Hook up /api/v1/damage/calculate to stream rolls.
        </span>
      </div>
    </div>
  )
}

function LoadingReadout() {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-3">
        <p className="font-display text-[4rem] leading-none tracking-tight text-white/18 sm:text-[5.5rem]">
          Calculating
        </p>
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-arena-cyan">
          Syncing current battle state with the damage engine.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-white/10 bg-white/5 p-5">
        <span className="arena-label text-arena-violet/70">Status</span>
        <span className="font-display text-lg text-white/82">Running</span>
        <span className="font-body text-sm leading-6 text-white/52">
          The current attacker, defender, field, and move inputs are being
          resolved.
        </span>
      </div>
    </div>
  )
}

function ErrorReadout({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-3">
        <p className="font-display text-[4rem] leading-none tracking-tight text-[rgba(255,145,145,0.92)] sm:text-[5.5rem]">
          Hold
        </p>
        <p className="max-w-[60ch] font-body text-sm leading-6 text-white/62">
          {errorMessage ?? 'The calculator could not complete the request.'}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-[rgba(255,145,145,0.32)] bg-[rgba(127,24,35,0.18)] p-5">
        <span className="arena-label text-[rgba(255,184,184,0.92)]">
          Status
        </span>
        <span className="font-display text-lg text-white">Request failed</span>
        <span className="font-body text-sm leading-6 text-white/58">
          Adjust the scenario if needed, then run the calculation again.
        </span>
      </div>
    </div>
  )
}

function FilledReadout({
  mode,
  result,
}: {
  mode: ResultMode
  result: CalculateDamageResponse
}) {
  const hpLabel = `${result.minPct.toFixed(1)}% – ${result.maxPct.toFixed(1)}%`
  const koProbability = `${(result.koChance.probability * 100).toFixed(2)}%`

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="font-display text-[4rem] font-extrabold leading-none tracking-tight text-white sm:text-[5.5rem]">
            {result.min}&nbsp;–&nbsp;{result.max}
          </p>
          <p className="font-mono text-sm uppercase tracking-[0.25em] text-arena-cyan">
            {hpLabel} HP
          </p>
        </div>

        {mode === 'range' ? (
          <div className="grid gap-3 rounded-sm border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-3">
            <MetricBlock
              label="Minimum"
              value={String(result.min)}
              tone="text-arena-plasma"
            />
            <MetricBlock
              label="Maximum"
              value={String(result.max)}
              tone="text-arena-sun"
            />
            <MetricBlock
              label="HP Range"
              value={hpLabel}
              tone="text-arena-cyan"
              compact
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="arena-label text-arena-plasma">Damage Rolls</p>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/44">
                16 possible outcomes
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {result.rolls.map((roll, idx) => (
                <div
                  key={idx}
                  className="rounded-sm border border-white/10 bg-arena-void/70 px-3 py-3"
                >
                  <p className="arena-label text-arena-violet/78">
                    Roll {idx + 1}
                  </p>
                  <p className="pt-2 font-display text-2xl text-white">
                    {roll}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-arena-plasma/40 bg-arena-plasma/10 p-5">
        <span className="arena-label text-arena-plasma">KO Chance</span>
        <span className="font-display text-xl text-white">
          {result.koChance.description}
        </span>
        <span className="font-mono text-xs text-white/70">
          p = {koProbability} · hits = {result.koChance.hits}
        </span>
      </div>
    </div>
  )
}

function MetricBlock({
  compact = false,
  label,
  tone,
  value,
}: {
  compact?: boolean
  label: string
  tone: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <p className="arena-label text-white/48">{label}</p>
      <p className={`font-display ${compact ? 'text-xl' : 'text-3xl'} ${tone}`}>
        {value}
      </p>
    </div>
  )
}
