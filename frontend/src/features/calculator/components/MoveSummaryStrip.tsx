import type { DamageResult } from '../types/api'

export type SideResults = (DamageResult | null)[]

export function MoveSummaryStrip({
  results,
  accent,
}: {
  results: SideResults
  accent: 'plasma' | 'cyan'
}) {
  const accentFill =
    accent === 'cyan' ? 'rgba(34,211,238,0.85)' : 'rgba(255,43,142,0.85)'
  const accentTrack =
    accent === 'cyan' ? 'rgba(34,211,238,0.15)' : 'rgba(255,43,142,0.15)'

  return (
    <div className="flex items-center gap-1" aria-label="Move damage summary">
      {results.map((result, i) => {
        if (result === null) {
          return (
            <div
              key={i}
              className="h-[18px] w-[28px] rounded-[2px] bg-white/[0.06]"
              title={`M${i + 1}: no result`}
            />
          )
        }

        const clampedMin = Math.min(100, Math.max(0, result.minPct))
        const clampedMax = Math.min(100, Math.max(0, result.maxPct))
        const isLethal = result.maxPct >= 100

        const trackColor = isLethal
          ? 'rgba(255,75,75,0.55)'
          : clampedMax >= 50
            ? 'rgba(255,140,30,0.15)'
            : accentTrack
        const pinColor = isLethal
          ? 'rgba(255,75,75,0.9)'
          : clampedMax >= 50
            ? 'rgba(255,122,26,0.88)'
            : accentFill

        const rangeLeft = isLethal ? 0 : clampedMin
        const rangeWidth = isLethal ? 100 : Math.max(0, clampedMax - clampedMin)

        return (
          <div
            key={i}
            className="relative h-[18px] w-[28px] overflow-hidden rounded-[2px]"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            title={`M${i + 1}: ${result.minPct.toFixed(1)}–${result.maxPct.toFixed(1)}%`}
          >
            <div
              className="absolute inset-y-0"
              data-testid="range-fill"
              style={{
                left: `${rangeLeft}%`,
                width: `${rangeWidth}%`,
                background: trackColor,
              }}
            />
            <div
              className="absolute inset-y-0 w-[2px]"
              style={{
                left: `${isLethal ? 1 : Math.max(0.5, clampedMin)}%`,
                background: pinColor,
              }}
            />
            <div
              className="absolute inset-y-0 w-[2px]"
              style={{
                left: `${isLethal ? 98 : Math.min(99.5, clampedMax)}%`,
                background: pinColor,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
