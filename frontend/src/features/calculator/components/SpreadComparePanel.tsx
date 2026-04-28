import { useEffect, useId, useState } from 'react'

import { calculateDamage } from '../api/damageApi'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSpring } from '../hooks/useSpring'
import { useCompareStore, type PinnedDefender } from '../store/useCompareStore'
import { useCalculatorStore } from '../store/useCalculatorStore'
import type {
  CalculateDamageResponse,
  CombatantBuild,
  DamageCalculationRequest,
  MoveDefinition,
} from '../types/api'
import { DamageBar } from './DamageBar'

type Props = {
  defenderName: string | null
}

type ColStatus =
  | { kind: 'loading' }
  | { kind: 'no-move' }
  | { kind: 'ready'; result: CalculateDamageResponse }
  | { kind: 'error' }

function compactTypes(types: CombatantBuild['types']): string[] {
  if (types === null) return []
  return types.filter((v): v is string => v !== null)
}

function toMoveRequest(move: MoveDefinition) {
  return {
    type: move.type,
    category: move.category,
    basePower: move.basePower,
    spread: move.spread,
    contact: move.contact,
    doublePowerWhenUserStatused: move.doublePowerWhenUserStatused,
    ignoreBurnPenaltyWhenUserStatused: move.ignoreBurnPenaltyWhenUserStatused,
  }
}

function buildCompareRequest(
  attacker: CombatantBuild,
  pinned: CombatantBuild,
  pinnedMoveId: string,
  state: {
    regulation: string
    moveCatalog: MoveDefinition[]
    field: ReturnType<typeof useCalculatorStore.getState>['field']
    attackerSide: ReturnType<typeof useCalculatorStore.getState>['attackerSide']
    defenderSide: ReturnType<typeof useCalculatorStore.getState>['defenderSide']
    criticalHit: boolean
    targets: number
  },
): DamageCalculationRequest | null {
  if (
    !attacker.finalStats ||
    !attacker.types ||
    !pinned.finalStats ||
    !pinned.types
  )
    return null

  const move = state.moveCatalog.find((m) => m.id === pinnedMoveId)
  if (!move || move.category === 'STATUS' || move.basePower <= 0) return null

  return {
    regulation: state.regulation as 'M-A',
    attacker: {
      level: 50,
      stats: attacker.finalStats,
      types: compactTypes(attacker.types),
      abilityId: attacker.abilityId,
      itemId: attacker.itemId,
      status: attacker.status,
      stages: attacker.stages,
      grounded: attacker.grounded,
      currentHp: attacker.currentHp,
    },
    defender: {
      level: 50,
      stats: pinned.finalStats,
      types: compactTypes(pinned.types),
      abilityId: pinned.abilityId,
      itemId: pinned.itemId,
      status: pinned.status,
      stages: pinned.stages,
      grounded: pinned.grounded,
      currentHp: pinned.currentHp,
    },
    move: toMoveRequest(move),
    field: state.field,
    attackerSide: state.attackerSide,
    defenderSide: state.defenderSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  }
}

const EMPTY_PINS: PinnedDefender[] = []
const SPRING_CFG = { stiffness: 420, damping: 32 } as const

function PinnedDefenderColumn({
  pin,
  onUnpin,
}: {
  pin: PinnedDefender
  onUnpin: (id: string) => void
}) {
  const field = useCalculatorStore((s) => s.field)
  const attackerSide = useCalculatorStore((s) => s.attackerSide)
  const defenderSide = useCalculatorStore((s) => s.defenderSide)
  const criticalHit = useCalculatorStore((s) => s.criticalHit)
  const targets = useCalculatorStore((s) => s.targets)
  const regulation = useCalculatorStore((s) => s.regulation)
  const moveCatalog = useCalculatorStore((s) => s.moveCatalog)

  const moveName = moveCatalog.find((m) => m.id === pin.moveId)?.name ?? null

  const [colStatus, setColStatus] = useState<ColStatus>({ kind: 'loading' })

  // Spring entrance animation
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const progress = useSpring(mounted ? 1 : 0, SPRING_CFG)
  const animProgress = reduced ? 1 : progress
  const settling = animProgress < 0.999

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const request = buildCompareRequest(pin.attackerBuild, pin.build, pin.moveId, {
        regulation,
        moveCatalog,
        field,
        attackerSide,
        defenderSide,
        criticalHit,
        targets,
      })
      if (!request) {
        await Promise.resolve()
        if (!cancelled) setColStatus({ kind: 'no-move' })
        return
      }
      try {
        const result = await calculateDamage(request)
        if (!cancelled) setColStatus({ kind: 'ready', result })
      } catch {
        if (!cancelled) setColStatus({ kind: 'error' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    pin.attackerBuild,
    pin.build,
    pin.moveId,
    field,
    attackerSide,
    defenderSide,
    criticalHit,
    targets,
    regulation,
    moveCatalog,
  ])

  return (
    <li
      role="listitem"
      className="flex w-[160px] shrink-0 flex-col gap-2 rounded border border-white/10 bg-white/[0.03] p-2.5"
      data-testid={`compare-column-${pin.id}`}
      style={{
        opacity: animProgress,
        transform: `translateY(${(1 - animProgress) * -7}px)`,
        willChange: settling ? 'transform, opacity' : 'auto',
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="truncate font-display text-xs font-semibold text-white/90">
          {pin.label}
        </span>
        <button
          type="button"
          onClick={() => onUnpin(pin.id)}
          aria-label={`Unpin ${pin.label}`}
          className="shrink-0 font-mono text-[0.6rem] text-white/25 transition hover:text-arena-plasma/80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-cyan"
        >
          ×
        </button>
      </div>

      {moveName && (
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/30">
          {moveName}
        </span>
      )}

      {colStatus.kind === 'loading' && (
        <span
          className="animate-pulse font-mono text-[0.65rem] text-white/20"
          aria-label="Computing…"
        >
          ···
        </span>
      )}

      {colStatus.kind === 'no-move' && (
        <span className="font-mono text-[0.65rem] text-white/25">
          No move set
        </span>
      )}

      {colStatus.kind === 'error' && (
        <span className="font-mono text-[0.65rem] text-arena-plasma/60">
          Error
        </span>
      )}

      {colStatus.kind === 'ready' && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.7rem] tabular-nums text-arena-plasma">
            {colStatus.result.minPct.toFixed(1)}–
            {colStatus.result.maxPct.toFixed(1)}%
          </span>
          <DamageBar
            minPct={colStatus.result.minPct}
            maxPct={colStatus.result.maxPct}
          />
          <span className="font-mono text-[0.6rem] text-white/50">
            {colStatus.result.koChance.description}
          </span>
        </div>
      )}
    </li>
  )
}

export function SpreadComparePanel({ defenderName }: Props) {
  const pins = useCompareStore((s) => s.pins ?? EMPTY_PINS)
  const pinDefender = useCompareStore((s) => s.pin)
  const unpinDefender = useCompareStore((s) => s.unpin)
  const clearAll = useCompareStore((s) => s.clear)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  const defender = useCalculatorStore((s) => s.defender)
  const attacker = useCalculatorStore((s) => s.attacker)

  const panelId = useId()
  const columnsId = `${panelId}-columns`

  const firstMoveId = attacker.moves.find((m) => m.moveId !== null)?.moveId ?? null
  const canPin = !!defender.speciesId && !!firstMoveId && pins.length < 4
  const atMax = pins.length >= 4
  const showColumns = open && pins.length > 0

  function handlePin() {
    if (!canPin || !firstMoveId) return
    const id = `${defender.speciesId ?? 'def'}-${Date.now()}`
    pinDefender({
      id,
      label: defenderName ?? (defender.speciesId as string),
      build: { ...defender },
      attackerBuild: { ...attacker, moves: attacker.moves.map((m) => ({ ...m })) as typeof attacker.moves },
      moveId: firstMoveId,
    })
    setOpen(true)
  }

  return (
    <div
      className="rounded border border-white/[0.07] bg-white/[0.02] p-3"
      data-testid="spread-compare-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePin}
          disabled={!canPin}
          aria-label="Pin current defender"
          aria-disabled={!canPin}
          className="arena-chip cursor-pointer text-arena-cyan transition hover:bg-arena-cyan/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
        >
          + Pin defender
        </button>

        {pins.length === 0 && (
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/20">
            up to 4 builds
          </span>
        )}

        {atMax && (
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
            4 / 4
          </span>
        )}

        {pins.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={columnsId}
              className="arena-chip cursor-pointer text-arena-violet transition hover:bg-arena-violet/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            >
              Compare <span className="tabular-nums">({pins.length})</span>
              <span
                className="ml-0.5 inline-block transition-transform duration-150"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {open && (
              <button
                type="button"
                onClick={clearAll}
                aria-label="Clear all pinned defenders"
                className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/30 transition hover:text-white/60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-cyan"
              >
                clear all
              </button>
            )}
          </>
        )}
      </div>

      {/* grid-template-rows collapse — avoids animating height directly */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showColumns ? '1fr' : '0fr',
          transition: reduced
            ? 'none'
            : 'grid-template-rows 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        aria-hidden={!showColumns}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            id={columnsId}
            className="mt-3 overflow-x-auto"
            aria-live="polite"
            aria-label="Pinned defender comparison columns"
          >
            <ul
              role="list"
              className="flex gap-2 pb-1"
              aria-label={`${pins.length} pinned defender${pins.length === 1 ? '' : 's'}`}
            >
              {pins.map((pin) => (
                <PinnedDefenderColumn
                  key={pin.id}
                  pin={pin}
                  onUnpin={unpinDefender}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
