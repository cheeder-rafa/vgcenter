import { t } from '../../../lib/i18n'
import type { CalculateDamageResponse } from '../types/api'

type Props = {
  result: CalculateDamageResponse | null
}

export function ResultPanel({ result }: Props) {
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
          <div className="flex gap-2">
            <span className="arena-chip text-arena-plasma">16 ROLLS</span>
            <span className="arena-chip text-arena-cyan">HP%</span>
            <span className="arena-chip text-arena-sun">KO</span>
          </div>
        </header>

        {result === null ? (
          <EmptyReadout />
        ) : (
          <FilledReadout result={result} />
        )}
      </div>
    </article>
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

function FilledReadout({ result }: { result: CalculateDamageResponse }) {
  const hpLabel = `${result.minPct.toFixed(1)}% – ${result.maxPct.toFixed(1)}%`
  const koProbability = `${(result.koChance.probability * 100).toFixed(2)}%`

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-3">
        <p className="font-display text-[4rem] font-extrabold leading-none tracking-tight text-transparent [background-clip:text] [-webkit-background-clip:text] [background-image:linear-gradient(135deg,_#ff2b8e,_#ff7a1a,_#ffd24a)] sm:text-[5.5rem]">
          {result.min}&nbsp;–&nbsp;{result.max}
        </p>
        <p className="font-mono text-sm uppercase tracking-[0.25em] text-arena-cyan">
          {hpLabel} HP
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {result.rolls.map((roll, idx) => (
            <span
              key={idx}
              className="rounded-sm border border-arena-violet/30 bg-arena-void/70 px-2 py-1 font-mono text-[0.7rem] text-arena-violet"
            >
              {roll}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-sm border border-arena-plasma/40 bg-arena-plasma/10 p-5">
        <span className="arena-label text-arena-plasma">KO Chance</span>
        <span className="font-display text-xl text-white">{result.koChance.description}</span>
        <span className="font-mono text-xs text-white/70">
          p = {koProbability} · hits = {result.koChance.hits}
        </span>
      </div>
    </div>
  )
}
