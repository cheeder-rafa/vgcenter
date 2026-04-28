type Props = {
  delta: number
  maxAbsDelta: number
  label?: string
}

const POSITIVE_FILL = 'rgba(110, 231, 183, 0.85)'
const POSITIVE_GLOW = 'rgba(110, 231, 183, 0.4)'
const NEGATIVE_FILL = 'rgba(255, 80, 100, 0.85)'
const NEGATIVE_GLOW = 'rgba(255, 80, 100, 0.4)'
const NEUTRAL_FILL = 'rgba(167, 139, 250, 0.55)'

export function DeltaBar({ delta, maxAbsDelta, label }: Props) {
  const span = Math.max(0.001, maxAbsDelta)
  const pct = Math.min(100, (Math.abs(delta) / span) * 100)
  const positive = delta > 0.0001
  const negative = delta < -0.0001
  const fill = positive
    ? POSITIVE_FILL
    : negative
      ? NEGATIVE_FILL
      : NEUTRAL_FILL
  const glow = positive
    ? POSITIVE_GLOW
    : negative
      ? NEGATIVE_GLOW
      : 'transparent'
  const sign = positive ? '+' : negative ? '−' : '±'
  const display = `${sign}${Math.abs(delta).toFixed(1)}`

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex h-1.5 w-full overflow-hidden rounded-full"
        role="presentation"
        style={{ backgroundColor: 'rgba(167, 139, 250, 0.08)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: fill,
            boxShadow: `0 0 12px ${glow}`,
          }}
        />
      </div>
      <span
        className="font-mono text-arena-xs tabular-nums"
        style={{
          color: positive ? '#6ee7b7' : negative ? '#ff8090' : '#a78bfa',
        }}
      >
        {label ?? display}
      </span>
    </div>
  )
}
