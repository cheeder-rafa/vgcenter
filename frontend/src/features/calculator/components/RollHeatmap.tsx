import { useEffect, useRef } from 'react'

import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSpring } from '../hooks/useSpring'

type Props = {
  rolls: number[]
  defenderHp: number
  koChancePct: number
  defenderName?: string | null
  accent?: 'plasma' | 'cyan' | 'violet'
}

const PALETTE = {
  safe: { fill: 'rgba(80, 190, 150, 0.78)', glow: 'rgba(110, 231, 183, 0.55)' },
  lethal: { fill: 'rgba(255, 70, 70, 0.9)', glow: 'rgba(255, 80, 80, 0.65)' },
} as const

function tickColor(roll: number, hp: number) {
  if (roll >= hp) return PALETTE.lethal
  return PALETTE.safe
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  rolls: number[],
  defenderHp: number,
) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  canvas.width = w * dpr
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  if (ctx === null) return
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  if (rolls.length === 0) return

  const min = Math.min(...rolls)
  const max = Math.max(...rolls)
  const range = max - min || 1

  const tickW = 2
  const tickGap = 1.5
  const totalW = rolls.length * (tickW + tickGap)
  const startX = (w - totalW) / 2

  // KO threshold line
  const koX = ((defenderHp - min) / range) * (w - 16) + 8
  if (defenderHp >= min && defenderHp <= max + 1) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(koX, 0)
    ctx.lineTo(koX, h)
    ctx.stroke()
    ctx.restore()
  }

  // Draw tick marks positioned by damage value across the bar width
  const sorted = [...rolls].sort((a, b) => a - b)
  sorted.forEach((roll, i) => {
    const x = startX + i * (tickW + tickGap)
    const { fill, glow } = tickColor(roll, defenderHp)

    // Glow
    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = 6
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x, h * 0.1, tickW, h * 0.8, 1)
    ctx.fill()
    ctx.restore()
  })

  // Value-mapped position indicators at top (small dots)
  rolls.forEach((roll) => {
    const x = ((roll - min) / range) * (w - 16) + 8
    const { fill } = tickColor(roll, defenderHp)
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

function KoPct({
  value,
  accent,
}: {
  value: number
  accent: 'plasma' | 'cyan' | 'violet'
}) {
  const reduced = useReducedMotion()
  const animated = useSpring(value, { stiffness: 200, damping: 22 })
  const displayed = reduced ? value : animated

  const color =
    value >= 100
      ? '#ff4b4b'
      : value >= 50
        ? '#ff7a1a'
        : value > 0
          ? '#ffd24a'
          : accent === 'cyan'
            ? '#22d3ee'
            : accent === 'violet'
              ? '#a78bfa'
              : '#ff2b8e'

  const label =
    displayed >= 99.95
      ? '100%'
      : displayed < 0.05
        ? '0%'
        : `${displayed.toFixed(1)}%`

  return (
    <span
      className="font-mono text-[0.82rem] font-bold tabular-nums"
      style={{ color }}
    >
      {label}
    </span>
  )
}

export function RollHeatmap({
  rolls,
  defenderHp,
  koChancePct,
  defenderName = null,
  accent = 'violet',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    drawHeatmap(canvas, rolls, defenderHp)

    if (reduced) return

    const observer = new ResizeObserver(() => {
      drawHeatmap(canvas, rolls, defenderHp)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [rolls, defenderHp, reduced])

  const lethalCount = rolls.filter((r) => r >= defenderHp).length
  const safeCount = rolls.length - lethalCount

  const minRoll = rolls.length > 0 ? Math.min(...rolls) : null
  const maxRoll = rolls.length > 0 ? Math.max(...rolls) : null
  const hpLabel =
    defenderName !== null
      ? `${defenderName} · ${defenderHp} HP`
      : `${defenderHp} HP`

  return (
    <div
      className="flex flex-col gap-2"
      role="img"
      aria-label={`16 damage rolls — ${lethalCount} lethal, ${safeCount} safe. KO chance: ${koChancePct.toFixed(1)}%`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="arena-label text-white/40">Rolls</span>
          {lethalCount > 0 || safeCount > 0 ? (
            <span className="font-mono text-[0.62rem]">
              {lethalCount > 0 && (
                <span style={{ color: 'rgba(255,80,80,0.85)' }}>
                  {lethalCount} lethal
                </span>
              )}
              {lethalCount > 0 && safeCount > 0 && (
                <span className="text-white/30"> · </span>
              )}
              {safeCount > 0 && (
                <span style={{ color: 'rgba(80,190,150,0.85)' }}>
                  {safeCount} safe
                </span>
              )}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="arena-label text-white/35">KO</span>
          <KoPct value={koChancePct} accent={accent} />
        </div>
      </div>

      <div className="relative h-[22px] overflow-hidden rounded-sm bg-white/[0.05]">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[0.6rem] text-white/38">
        <span>{minRoll ?? '—'}</span>
        <span className="text-white/22">{hpLabel}</span>
        <span>{maxRoll ?? '—'}</span>
      </div>
    </div>
  )
}
