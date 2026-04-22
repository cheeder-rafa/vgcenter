import { useId, useMemo } from 'react'

import type { CalculatorSide } from '../store/useCalculatorStore'
import { useCalculatorStore } from '../store/useCalculatorStore'
import { ROOM_OPTIONS, TERRAIN_OPTIONS, WEATHER_OPTIONS } from './shared'
import type { Room, Terrain, Weather } from '../types/api'
import { SpeedTierRibbon, type SpeedCombatant } from './SpeedTierRibbon'

function stagedSpeed(baseSpeed: number, spe: number): number {
  if (spe === 0) return baseSpeed
  const mult = spe > 0 ? (2 + spe) / 2 : 2 / (2 - spe)
  return Math.floor(baseSpeed * mult)
}

export function FieldPanel({
  focusedSide,
  attackerName = null,
  defenderName = null,
}: {
  focusedSide: CalculatorSide
  attackerName?: string | null
  defenderName?: string | null
}) {
  const field = useCalculatorStore((s) => s.field)
  const targets = useCalculatorStore((s) => s.targets)
  const attackerSide = useCalculatorStore((s) => s.attackerSide)
  const defenderSide = useCalculatorStore((s) => s.defenderSide)
  const setField = useCalculatorStore((s) => s.setField)
  const setAttackerSide = useCalculatorStore((s) => s.setAttackerSide)
  const setDefenderSide = useCalculatorStore((s) => s.setDefenderSide)
  const setTargets = useCalculatorStore((s) => s.setTargets)

  const attackerRaw = useCalculatorStore((s) => s.attacker)
  const defenderRaw = useCalculatorStore((s) => s.defender)

  const attackerCombatant = useMemo((): SpeedCombatant | null => {
    const spd = attackerRaw.finalStats?.speed ?? null
    if (spd === null) return null
    return {
      name: attackerName ?? attackerRaw.speciesId ?? 'Attacker',
      baseSpeed: spd,
      stagedSpeed: stagedSpeed(spd, attackerRaw.stages.spe),
      itemId: attackerRaw.itemId ?? null,
      status: attackerRaw.status,
      tailwind: attackerSide.tailwind,
    }
  }, [attackerName, attackerRaw, attackerSide.tailwind])

  const defenderCombatant = useMemo((): SpeedCombatant | null => {
    const spd = defenderRaw.finalStats?.speed ?? null
    if (spd === null) return null
    return {
      name: defenderName ?? defenderRaw.speciesId ?? 'Defender',
      baseSpeed: spd,
      stagedSpeed: stagedSpeed(spd, defenderRaw.stages.spe),
      itemId: defenderRaw.itemId ?? null,
      status: defenderRaw.status,
      tailwind: defenderSide.tailwind,
    }
  }, [defenderName, defenderRaw, defenderSide.tailwind])

  const ids = {
    weather: useId(),
    terrain: useId(),
    room: useId(),
    spread: useId(),
    reflect: useId(),
    lightScreen: useId(),
    auroraVeil: useId(),
    helpingHand: useId(),
    attackingTailwind: useId(),
    defendingTailwind: useId(),
    friendGuard: useId(),
    protect: useId(),
  }

  const spread = targets > 1
  const attackingConditions =
    focusedSide === 'attacker' ? attackerSide : defenderSide
  const defendingConditions =
    focusedSide === 'attacker' ? defenderSide : attackerSide
  const setAttackingConditions =
    focusedSide === 'attacker' ? setAttackerSide : setDefenderSide
  const setDefendingConditions =
    focusedSide === 'attacker' ? setDefenderSide : setAttackerSide

  return (
    <article
      className="arena-panel arena-panel--ember p-3 sm:p-4"
      data-testid="field-panel"
    >
      <div className="relative z-10 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-arena-ember shadow-[0_0_14px_rgba(255,122,26,0.9)]" />
            <p className="arena-label text-arena-ember">Field</p>
          </div>
          <span className="arena-chip text-arena-sun/90">BATTLE</span>
        </header>

        <SpeedTierRibbon
          attacker={attackerCombatant}
          defender={defenderCombatant}
          trickRoom={field.room === 'TRICK'}
        />

        <h2 className="font-display text-2xl font-bold tracking-wide text-white">
          Modifiers
        </h2>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Select
            id={ids.weather}
            label="Weather"
            value={field.weather}
            onChange={(v) => setField({ weather: v as Weather })}
            options={WEATHER_OPTIONS}
          />
          <Select
            id={ids.terrain}
            label="Terrain"
            value={field.terrain}
            onChange={(v) => setField({ terrain: v as Terrain })}
            options={TERRAIN_OPTIONS}
          />
          <Select
            id={ids.room}
            label="Room"
            value={field.room}
            onChange={(v) => setField({ room: v as Room })}
            options={ROOM_OPTIONS}
          />
        </div>

        <div className="arena-divider" />

        <div className="space-y-3">
          <p className="arena-label text-arena-sun">Targets</p>
          <label
            htmlFor={ids.spread}
            className="flex items-center gap-3 rounded-sm border border-arena-ember/30 bg-arena-ember/10 px-3 py-2.5 transition hover:border-arena-ember/60"
          >
            <input
              id={ids.spread}
              type="checkbox"
              className="arena-checkbox"
              checked={spread}
              onChange={(e) => setTargets(e.target.checked ? 2 : 1)}
            />
            <span className="font-body text-sm text-white/90">
              Spread move (2 targets)
            </span>
            <span className="ml-auto font-mono text-xs text-white/60">
              ×0.75
            </span>
          </label>
        </div>

        <div className="arena-divider" />

        <div className="space-y-3">
          <p className="arena-label text-arena-cyan">Defender Side</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <ToggleRow
              id={ids.reflect}
              label="Reflect"
              checked={defendingConditions.reflect}
              onChange={(v) => setDefendingConditions({ reflect: v })}
            />
            <ToggleRow
              id={ids.lightScreen}
              label="Light Screen"
              checked={defendingConditions.lightScreen}
              onChange={(v) => setDefendingConditions({ lightScreen: v })}
            />
            <ToggleRow
              id={ids.auroraVeil}
              label="Aurora Veil"
              checked={defendingConditions.auroraVeil}
              onChange={(v) => setDefendingConditions({ auroraVeil: v })}
            />
            <ToggleRow
              id={ids.friendGuard}
              label="Friend Guard"
              checked={defendingConditions.friendGuard}
              onChange={(v) => setDefendingConditions({ friendGuard: v })}
            />
            <ToggleRow
              id={ids.defendingTailwind}
              label="Tailwind"
              ariaLabel="Defender Tailwind"
              checked={defendingConditions.tailwind}
              onChange={(v) => setDefendingConditions({ tailwind: v })}
            />
            <ToggleRow
              id={ids.protect}
              label="Protect"
              checked={defendingConditions.protect}
              onChange={(v) => setDefendingConditions({ protect: v })}
            />
          </div>
        </div>

        <div className="arena-divider" />

        <div className="space-y-3">
          <p className="arena-label text-arena-plasma">Attacker Side</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <ToggleRow
              id={ids.helpingHand}
              label="Helping Hand"
              checked={attackingConditions.helpingHand}
              onChange={(v) => setAttackingConditions({ helpingHand: v })}
            />
            <ToggleRow
              id={ids.attackingTailwind}
              label="Tailwind"
              ariaLabel="Attacker Tailwind"
              checked={attackingConditions.tailwind}
              onChange={(v) => setAttackingConditions({ tailwind: v })}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

type SelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
}

function Select({ id, label, value, onChange, options }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="arena-label text-arena-sun">
        {label}
      </label>
      <select
        id={id}
        className="arena-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-arena-void">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  ariaLabel,
  checked,
  onChange,
}: {
  id: string
  label: string
  ariaLabel?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 items-center gap-3 rounded-sm border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-arena-violet/50"
    >
      <input
        id={id}
        type="checkbox"
        className="arena-checkbox"
        aria-label={ariaLabel}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-body text-sm text-white/85">{label}</span>
    </label>
  )
}
