import type { DamageResult } from '../types/api'

type Props = {
  current: DamageResult
  previous: DamageResult | null
  testId?: string
  className?: string
}

export function DamageDeltaChip({
  current,
  previous,
  testId,
  className = '',
}: Props) {
  if (previous === null) {
    return null
  }

  const delta = averagePct(current) - averagePct(previous)
  const formatted = formatDelta(delta)
  const tone =
    delta > 0
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
      : delta < 0
        ? 'border-rose-400/25 bg-rose-400/10 text-rose-100'
        : 'border-white/10 bg-white/[0.05] text-white/55'

  return (
    <span
      data-testid={testId}
      aria-label={`Damage changed by ${formatted} since the last edit`}
      className={`arena-chip shrink-0 whitespace-nowrap text-[0.55rem] tracking-[0.15em] ${tone} ${className}`}
    >
      Δ {formatted}
    </span>
  )
}

function averagePct(result: DamageResult): number {
  return (result.minPct + result.maxPct) / 2
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : ''
  return `${sign}${Math.abs(delta).toFixed(1)}%`
}
