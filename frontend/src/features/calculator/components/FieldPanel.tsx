import { useId } from 'react'

import { useCalculatorStore } from '../store/useCalculatorStore'
import { ROOM_OPTIONS, TERRAIN_OPTIONS, WEATHER_OPTIONS } from './shared'
import type { Room, Terrain, Weather } from '../types/api'

export function FieldPanel() {
  const field = useCalculatorStore((s) => s.field)
  const targets = useCalculatorStore((s) => s.targets)
  const attackerSide = useCalculatorStore((s) => s.attackerSide)
  const defenderSide = useCalculatorStore((s) => s.defenderSide)
  const setField = useCalculatorStore((s) => s.setField)
  const setAttackerSide = useCalculatorStore((s) => s.setAttackerSide)
  const setDefenderSide = useCalculatorStore((s) => s.setDefenderSide)
  const setTargets = useCalculatorStore((s) => s.setTargets)

  const ids = {
    weather: useId(),
    terrain: useId(),
    room: useId(),
    spread: useId(),
    reflect: useId(),
    lightScreen: useId(),
    auroraVeil: useId(),
    helpingHand: useId(),
    friendGuard: useId(),
  }

  const spread = targets > 1

  return (
    <article className="arena-panel arena-panel--ember p-6">
      <div className="relative z-10 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-arena-ember shadow-[0_0_14px_rgba(255,122,26,0.9)]" />
            <p className="arena-label text-arena-ember">Arena State · Live</p>
          </div>
          <span className="arena-chip text-arena-sun/90">BATTLE</span>
        </header>

        <h2 className="font-display text-2xl font-bold tracking-wide text-white">
          Field
        </h2>

        <div className="grid gap-4">
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
            className="flex items-center gap-3 rounded-sm border border-arena-ember/30 bg-arena-ember/10 px-4 py-3 transition hover:border-arena-ember/60"
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
          <ToggleRow
            id={ids.reflect}
            label="Reflect"
            checked={defenderSide.reflect}
            onChange={(v) => setDefenderSide({ reflect: v })}
          />
          <ToggleRow
            id={ids.lightScreen}
            label="Light Screen"
            checked={defenderSide.lightScreen}
            onChange={(v) => setDefenderSide({ lightScreen: v })}
          />
          <ToggleRow
            id={ids.auroraVeil}
            label="Aurora Veil"
            checked={defenderSide.auroraVeil}
            onChange={(v) => setDefenderSide({ auroraVeil: v })}
          />
          <ToggleRow
            id={ids.friendGuard}
            label="Friend Guard"
            checked={defenderSide.friendGuard}
            onChange={(v) => setDefenderSide({ friendGuard: v })}
          />
        </div>

        <div className="arena-divider" />

        <div className="space-y-3">
          <p className="arena-label text-arena-plasma">Attacker Side</p>
          <ToggleRow
            id={ids.helpingHand}
            label="Helping Hand"
            checked={attackerSide.helpingHand}
            onChange={(v) => setAttackerSide({ helpingHand: v })}
          />
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
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/5 px-3 py-2 transition hover:border-arena-violet/50"
    >
      <input
        id={id}
        type="checkbox"
        className="arena-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-body text-sm text-white/85">{label}</span>
    </label>
  )
}
