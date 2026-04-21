import type { DamageResult } from '../types/api'
import type { CalculatorSide } from '../store/useCalculatorStore'

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

  return (
    <article className="arena-panel arena-panel--violet relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-arena-plasma to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-arena-cyan to-transparent" />

      <div className="relative z-10 flex flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="arena-label text-arena-violet">
              Detailed Readout · Slot M{focusedIndex + 1}
            </p>
            <h2 className="font-display text-xl font-bold tracking-wide text-white">
              {attackerLabel ?? '—'}{' '}
              <span className="text-arena-violet/70">→</span>{' '}
              {defenderLabel ?? '—'}
            </h2>
            {moveName !== null ? (
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-white/55">
                Move · {moveName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
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
          <LiveBlock result={result} />
        )}
      </div>
    </article>
  )
}

function StandbyBlock({ status }: { status: Props['status'] }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="font-display text-[3.25rem] leading-none tracking-tight text-white/20 sm:text-[4rem]">
          — – —
        </p>
        <p className="pt-3 font-mono text-xs uppercase tracking-[0.25em] text-white/45">
          {status === 'loading'
            ? 'Syncing damage engine…'
            : 'Select a move to see its rolls.'}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-white/10 bg-white/5 p-4">
        <span className="arena-label text-arena-violet/70">KO Chance</span>
        <span className="font-display text-lg text-white/80">—</span>
      </div>
    </div>
  )
}

function ErrorBlock({ message }: { message: string | null }) {
  return (
    <div className="rounded-sm border border-[rgba(255,145,145,0.32)] bg-[rgba(127,24,35,0.18)] px-4 py-4">
      <p className="arena-label text-[rgba(255,184,184,0.92)]">Error</p>
      <p className="pt-1 font-body text-sm leading-6 text-white/75">
        {message ?? 'The calculator could not complete the request.'}
      </p>
    </div>
  )
}

function LiveBlock({ result }: { result: DamageResult }) {
  const hpLabel = `${result.minPct.toFixed(1)}% – ${result.maxPct.toFixed(1)}%`
  const koProbability = `${(result.koChance.probability * 100).toFixed(2)}%`

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-display text-[3rem] font-extrabold leading-none tracking-tight text-white sm:text-[4rem]">
            {result.min}&nbsp;–&nbsp;{result.max}
          </p>
          <p className="font-mono text-sm uppercase tracking-[0.25em] text-arena-cyan">
            {hpLabel} HP
          </p>
        </div>
        <div className="rounded-sm border border-arena-plasma/40 bg-arena-plasma/10 p-4">
          <p className="arena-label text-arena-plasma">KO Chance</p>
          <p className="pt-1 font-display text-lg text-white">
            {result.koChance.description}
          </p>
          <p className="font-mono text-xs text-white/65">
            p = {koProbability} · hits = {result.koChance.hits}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="arena-label text-arena-plasma">16 Rolls</p>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/44">
            Distribution
          </span>
        </div>
        <div
          className="grid gap-1.5 sm:grid-cols-4"
          data-testid="detailed-rolls"
        >
          {result.rolls.map((roll, idx) => (
            <div
              key={idx}
              className="rounded-sm border border-white/10 bg-arena-void/70 px-2 py-1.5 text-center"
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/40">
                {idx + 1}
              </p>
              <p className="font-display text-base text-white">{roll}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
