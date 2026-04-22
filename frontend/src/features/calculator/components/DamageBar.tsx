import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSpring } from '../hooks/useSpring'

type Props = {
  minPct: number
  maxPct: number
}

function getBandColor(maxPct: number): {
  track: string
  fill: string
  glow: string
} {
  if (maxPct >= 100) {
    return {
      track: 'rgba(255, 80, 80, 0.12)',
      fill: 'rgba(255, 75, 75, 0.88)',
      glow: 'rgba(255, 80, 80, 0.7)',
    }
  }
  if (maxPct >= 50) {
    return {
      track: 'rgba(255, 140, 30, 0.12)',
      fill: 'rgba(255, 122, 26, 0.88)',
      glow: 'rgba(255, 122, 26, 0.65)',
    }
  }
  return {
    track: 'rgba(100, 200, 160, 0.10)',
    fill: 'rgba(80, 190, 150, 0.78)',
    glow: 'rgba(110, 231, 183, 0.5)',
  }
}

export function DamageBar({ minPct, maxPct }: Props) {
  const reduced = useReducedMotion()
  const clampedMin = Math.min(100, Math.max(0, minPct))
  const clampedMax = Math.min(100, Math.max(0, maxPct))

  const springMin = useSpring(clampedMin, { stiffness: 320, damping: 30 })
  const springMax = useSpring(clampedMax, { stiffness: 320, damping: 30 })

  const animMin = reduced ? clampedMin : springMin
  const animMax = reduced ? clampedMax : springMax

  const { track, fill, glow } = getBandColor(clampedMax)

  // Markers: clamp to [1px, 99%] so they never clip at edges
  const minLeft = Math.max(0.5, animMin)
  const maxLeft = Math.min(99.5, animMax)

  return (
    <div
      role="img"
      aria-label={`Damage ${minPct.toFixed(1)}–${maxPct.toFixed(1)}%`}
      className="relative h-[5px] w-full overflow-hidden rounded-full"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      {/* Range fill band */}
      <div
        className="absolute inset-y-0 transition-none"
        style={{
          left: `${animMin}%`,
          width: `${Math.max(0, animMax - animMin)}%`,
          background: track,
        }}
      />

      {/* Min marker pin */}
      <div
        className="absolute inset-y-0 w-[2px]"
        style={{
          left: `${minLeft}%`,
          background: fill,
          boxShadow: `0 0 5px 1px ${glow}`,
          transform: 'translateX(-1px)',
        }}
      />

      {/* Max marker pin */}
      <div
        className="absolute inset-y-0 w-[2px]"
        style={{
          left: `${maxLeft}%`,
          background: clampedMax >= 100 ? 'rgba(255,75,75,0.92)' : fill,
          boxShadow:
            clampedMax >= 100
              ? '0 0 7px 2px rgba(255,80,80,0.85)'
              : `0 0 5px 1px ${glow}`,
          transform: 'translateX(-1px)',
        }}
      />
    </div>
  )
}
