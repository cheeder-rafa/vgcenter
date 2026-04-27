import type { MoveEntry } from '../components/DualMoveReadout'
import { resolveSpriteSources } from '../components/spriteBadgeSources'
import { useToastStore } from '../store/useToastStore'

export type ExportImageInput = {
  attacker: {
    name: string | null
    speciesId: string | null
    megaActive: boolean
    megaFormId: string | null
    types: string[]
  }
  defender: {
    name: string | null
    speciesId: string | null
    megaActive: boolean
    megaFormId: string | null
    types: string[]
  }
  attackerMoves: MoveEntry[]
  defenderMoves: MoveEntry[]
  regulation: string
}

// Canvas dimensions (Discord embed / OG ratio)
const W = 1200
const H = 630
const DPR = 2

// Arena theme colors
const ARENA_VOID = '#04030f'
const ARENA_PLASMA = '#ff2b8e'
const ARENA_CYAN = '#22d3ee'
const ARENA_VIOLET = '#a78bfa'
const ARENA_SURFACE = 'rgba(255,255,255,0.04)'
const ARENA_BORDER = 'rgba(255,255,255,0.10)'

// Type hex colors for type chips
const TYPE_HEX: Record<string, string> = {
  NORMAL: '#b7b7aa',
  FIRE: '#ff9c54',
  WATER: '#6ea7ff',
  ELECTRIC: '#f7d54b',
  GRASS: '#78d870',
  ICE: '#98f1ff',
  FIGHTING: '#df6d63',
  POISON: '#c47be7',
  GROUND: '#d7b163',
  FLYING: '#8fa8ff',
  PSYCHIC: '#ff74b8',
  BUG: '#a8bf39',
  ROCK: '#c6ad67',
  GHOST: '#8f7ae6',
  DRAGON: '#8f7dff',
  DARK: '#8d7868',
  STEEL: '#9cb8c9',
  FAIRY: '#f2a7da',
}

// KO tier colors matching in-app convention
function koTierColor(result: MoveEntry['result']): string {
  if (result === null) return 'rgba(255,255,255,0.25)'
  const { probability, hits } = result.koChance
  if (probability > 0 && hits === 1) return 'rgba(255,75,75,0.92)'
  if (probability >= 1 && hits === 2) return 'rgba(255,145,30,0.90)'
  if (probability > 0 && hits <= 2) return 'rgba(255,210,74,0.85)'
  return 'rgba(255,255,255,0.5)'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function loadSpriteWithFallback(
  sources: string[],
): Promise<HTMLImageElement | null> {
  for (const src of sources) {
    try {
      return await loadImage(src)
    } catch {
      // try next
    }
  }
  return null
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: 'normal' | 'bold' | '700' | '800' = 'normal',
  family: 'mono' | 'display' = 'mono',
) {
  const ff =
    family === 'display'
      ? '"Orbitron", "Arial", sans-serif'
      : '"Courier New", "Courier", monospace'
  ctx.font = `${weight} ${size}px ${ff}`
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawTypeChip(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
) {
  const hex = TYPE_HEX[type.toUpperCase()] ?? '#888888'
  const chipW = 56
  const chipH = 18

  ctx.save()
  ctx.globalAlpha = 0.85
  roundRect(ctx, x, y, chipW, chipH, 4)
  ctx.fillStyle = hex + '30'
  ctx.fill()
  ctx.strokeStyle = hex + '80'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = hex
  ctx.globalAlpha = 1
  setFont(ctx, 9, '700', 'display')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(type.toUpperCase(), x + chipW / 2, y + chipH / 2)
  ctx.restore()
}

function drawMoveRow(
  ctx: CanvasRenderingContext2D,
  entry: MoveEntry,
  index: number,
  x: number,
  y: number,
  colW: number,
  accent: string,
) {
  const rowH = 38
  const top = y + index * (rowH + 4)

  // Row background
  roundRect(ctx, x, top, colW, rowH, 3)
  ctx.fillStyle = ARENA_SURFACE
  ctx.fill()
  ctx.strokeStyle = ARENA_BORDER
  ctx.lineWidth = 1
  ctx.stroke()

  // Move index label
  setFont(ctx, 9, 'normal', 'mono')
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`M${index + 1}`, x + 8, top + 6)

  if (entry.moveName === null || entry.result === null) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    setFont(ctx, 10, 'normal', 'mono')
    ctx.fillText('—', x + 28, top + 12)
    return
  }

  // Move name
  setFont(ctx, 11, 'normal', 'mono')
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.textAlign = 'left'
  const nameMaxW = colW - 100
  ctx.save()
  ctx.beginPath()
  ctx.rect(x + 28, top, nameMaxW, rowH)
  ctx.clip()
  ctx.fillText(entry.moveName, x + 28, top + 6)
  ctx.restore()

  // Type chip
  if (entry.moveType !== null) {
    drawTypeChip(ctx, entry.moveType, x + 28, top + 20)
  }

  // Damage range
  const range = `${entry.result.minPct.toFixed(1)}–${entry.result.maxPct.toFixed(1)}%`
  setFont(ctx, 11, '700', 'mono')
  ctx.fillStyle = koTierColor(entry.result)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(range, x + colW - 8, top + 6)

  // KO description
  setFont(ctx, 9, 'normal', 'mono')
  ctx.fillStyle = accent + 'aa'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(entry.result.koChance.description, x + colW - 8, top + rowH - 6)
}

function drawSpriteGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
) {
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90)
  grad.addColorStop(0, color + '55')
  grad.addColorStop(0.5, color + '22')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, 90, 0, Math.PI * 2)
  ctx.fill()
}

export async function exportResultImage(
  input: ExportImageInput,
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = W * DPR
  canvas.height = H * DPR
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`

  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    useToastStore.getState().push('Export failed — canvas unavailable')
    return
  }

  ctx.scale(DPR, DPR)

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = ARENA_VOID
  ctx.fillRect(0, 0, W, H)

  // Subtle grid overlay
  ctx.save()
  ctx.globalAlpha = 0.04
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 0.5
  const gridSize = 48
  for (let gx = 0; gx < W; gx += gridSize) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, H)
    ctx.stroke()
  }
  for (let gy = 0; gy < H; gy += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(W, gy)
    ctx.stroke()
  }
  ctx.restore()

  // Top accent bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, ARENA_PLASMA)
  topGrad.addColorStop(0.5, '#f59e0b')
  topGrad.addColorStop(1, ARENA_CYAN)
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 4)

  // Bottom accent bar
  const botGrad = ctx.createLinearGradient(0, 0, W, 0)
  botGrad.addColorStop(0, ARENA_CYAN)
  botGrad.addColorStop(0.5, ARENA_VIOLET)
  botGrad.addColorStop(1, ARENA_PLASMA)
  ctx.fillStyle = botGrad
  ctx.fillRect(0, H - 3, W, 3)

  // ── Header band ─────────────────────────────────────────────────────────────
  const HEADER_H = 56
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  ctx.fillRect(0, 4, W, HEADER_H)
  ctx.strokeStyle = ARENA_BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 4 + HEADER_H)
  ctx.lineTo(W, 4 + HEADER_H)
  ctx.stroke()

  // Pulse dot
  ctx.save()
  ctx.shadowColor = ARENA_PLASMA
  ctx.shadowBlur = 12
  ctx.fillStyle = ARENA_PLASMA
  ctx.beginPath()
  ctx.arc(24, 4 + HEADER_H / 2, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Title
  setFont(ctx, 18, '800', 'display')
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('VGCenter · Damage Calc', 38, 4 + HEADER_H / 2)

  // Regulation chip
  const regLabel = `Regulation ${input.regulation}`
  setFont(ctx, 10, '700', 'display')
  ctx.textAlign = 'left'
  const regW = ctx.measureText(regLabel).width + 20
  const regX = W - regW - 20
  const regY = 4 + (HEADER_H - 22) / 2
  roundRect(ctx, regX, regY, regW, 22, 3)
  ctx.strokeStyle = ARENA_PLASMA + '66'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = ARENA_PLASMA + '18'
  ctx.fill()
  ctx.fillStyle = ARENA_PLASMA
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(regLabel.toUpperCase(), regX + regW / 2, regY + 11)

  // ── Layout constants ─────────────────────────────────────────────────────────
  const CONTENT_TOP = 4 + HEADER_H + 16
  const FOOTER_H = 32
  const CONTENT_H = H - CONTENT_TOP - FOOTER_H - 8
  const SPRITE_ZONE_W = 200
  const COL_GAP = 16
  const CENTER_W = W - 2 * SPRITE_ZONE_W - 2 * COL_GAP
  const LEFT_X = 0
  const LEFT_COL_X = SPRITE_ZONE_W + COL_GAP
  const RIGHT_COL_X = LEFT_COL_X + CENTER_W / 2 + COL_GAP / 2
  const RIGHT_X = W - SPRITE_ZONE_W
  const COL_W = CENTER_W / 2 - COL_GAP / 2

  // ── Load sprites ─────────────────────────────────────────────────────────────
  const [atkSprite, defSprite] = await Promise.all([
    loadSpriteWithFallback(
      resolveSpriteSources(
        input.attacker.speciesId,
        input.attacker.megaActive,
        input.attacker.megaFormId,
      ),
    ),
    loadSpriteWithFallback(
      resolveSpriteSources(
        input.defender.speciesId,
        input.defender.megaActive,
        input.defender.megaFormId,
      ),
    ),
  ])

  // ── Sprite zones ─────────────────────────────────────────────────────────────
  const spriteSize = 160
  const atkSpriteCX = LEFT_X + SPRITE_ZONE_W / 2
  const atkSpriteCY = CONTENT_TOP + CONTENT_H / 2 - 10
  const defSpriteCX = RIGHT_X + SPRITE_ZONE_W / 2
  const defSpriteCY = CONTENT_TOP + CONTENT_H / 2 - 10

  // Glow rings
  drawSpriteGlow(ctx, atkSpriteCX, atkSpriteCY, ARENA_PLASMA)
  drawSpriteGlow(ctx, defSpriteCX, defSpriteCY, ARENA_CYAN)

  // Draw sprites
  if (atkSprite !== null) {
    ctx.drawImage(
      atkSprite,
      atkSpriteCX - spriteSize / 2,
      atkSpriteCY - spriteSize / 2,
      spriteSize,
      spriteSize,
    )
  }
  if (defSprite !== null) {
    ctx.drawImage(
      defSprite,
      defSpriteCX - spriteSize / 2,
      defSpriteCY - spriteSize / 2,
      spriteSize,
      spriteSize,
    )
  }

  // Combatant names under sprites
  const nameY = CONTENT_TOP + CONTENT_H / 2 + spriteSize / 2 + 8

  setFont(ctx, 14, '700', 'display')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.fillStyle = ARENA_PLASMA
  ctx.fillText(input.attacker.name ?? '—', atkSpriteCX, nameY)

  ctx.fillStyle = ARENA_CYAN
  ctx.fillText(input.defender.name ?? '—', defSpriteCX, nameY)

  // Type chips under name
  const atkTypes = input.attacker.types.slice(0, 2)
  const defTypes = input.defender.types.slice(0, 2)
  const chipY = nameY + 22

  atkTypes.forEach((t, ti) => {
    drawTypeChip(
      ctx,
      t,
      atkSpriteCX - (atkTypes.length * 60) / 2 + ti * 62,
      chipY,
    )
  })
  defTypes.forEach((t, ti) => {
    drawTypeChip(
      ctx,
      t,
      defSpriteCX - (defTypes.length * 60) / 2 + ti * 62,
      chipY,
    )
  })

  // ── VS arrow in center ───────────────────────────────────────────────────────
  const vsCX = W / 2
  const vsCY = CONTENT_TOP + 20

  setFont(ctx, 13, '800', 'display')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ARENA_VIOLET + 'cc'
  ctx.fillText('VS', vsCX, vsCY)

  // ── Move columns ─────────────────────────────────────────────────────────────
  const MOVES_TOP = CONTENT_TOP + 44
  const SECTION_LABEL_H = 20

  // Attacker moves header
  setFont(ctx, 9, '700', 'display')
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = ARENA_PLASMA + 'cc'
  ctx.fillText(
    `${(input.attacker.name ?? 'ATTACKER').toUpperCase()} · MOVES`,
    LEFT_COL_X,
    MOVES_TOP,
  )

  // Defender moves header
  ctx.fillStyle = ARENA_CYAN + 'cc'
  ctx.fillText(
    `${(input.defender.name ?? 'DEFENDER').toUpperCase()} · MOVES`,
    RIGHT_COL_X,
    MOVES_TOP,
  )

  // Column divider line
  const divX = W / 2
  ctx.strokeStyle = ARENA_BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(divX, MOVES_TOP)
  ctx.lineTo(divX, MOVES_TOP + SECTION_LABEL_H + 4 * (38 + 4) + 8)
  ctx.stroke()

  // Draw move rows
  const rowsTop = MOVES_TOP + SECTION_LABEL_H + 4

  input.attackerMoves.slice(0, 4).forEach((entry, i) => {
    drawMoveRow(ctx, entry, i, LEFT_COL_X, rowsTop, COL_W, ARENA_PLASMA)
  })

  input.defenderMoves.slice(0, 4).forEach((entry, i) => {
    drawMoveRow(ctx, entry, i, RIGHT_COL_X, rowsTop, COL_W, ARENA_CYAN)
  })

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = H - FOOTER_H
  ctx.strokeStyle = ARENA_BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, footerY)
  ctx.lineTo(W, footerY)
  ctx.stroke()

  setFont(ctx, 10, 'normal', 'display')
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('vgcenter.app', W / 2, footerY + FOOTER_H / 2)

  // ── Export ───────────────────────────────────────────────────────────────────
  const dataUrl = canvas.toDataURL('image/png')

  if (
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard?.write !== undefined
  ) {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      useToastStore.getState().push('PNG copied to clipboard')
      return
    } catch {
      // fall through to download
    }
  }

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'vgcenter-calc.png'
  a.click()
  useToastStore.getState().push('PNG downloaded')
}
