import type { DamageDelta } from '../types/api'

type Props = {
  delta: DamageDelta | null
  testId?: string
}

export function DamageDeltaChip({ delta, testId }: Props) {
  if (delta === null) {
    return null
  }

  const isPositive = delta.minPctDelta > 0 || delta.maxPctDelta > 0
  const isNegative = delta.minPctDelta < 0 || delta.maxPctDelta < 0
  const tone = isPositive
    ? 'border-arena-plasma/25 bg-arena-plasma/10 text-arena-plasma'
    : isNegative
      ? 'border-arena-sun/25 bg-arena-sun/10 text-arena-sun'
      : 'border-white/10 bg-white/[0.05] text-white/55'

  return (
    <span
      data-testid={testId}
      className={`arena-chip shrink-0 whitespace-nowrap text-[0.55rem] tracking-[0.12em] ${tone}`}
    >
      {formatDelta(delta)}
    </span>
  )
}

function formatDelta(delta: DamageDelta) {
  return `${formatValue(delta.minPctDelta)} / ${formatValue(delta.maxPctDelta)} pp`
}

function formatValue(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toFixed(1)}`
}
