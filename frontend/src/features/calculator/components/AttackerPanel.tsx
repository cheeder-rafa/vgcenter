import { useId } from 'react'

import { useCalculatorStore } from '../store/useCalculatorStore'
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from './shared'
import type { MoveCategory, StatusCondition } from '../types/api'

export function AttackerPanel() {
  const attacker = useCalculatorStore((s) => s.attacker)
  const move = useCalculatorStore((s) => s.move)
  const criticalHit = useCalculatorStore((s) => s.criticalHit)
  const setAttacker = useCalculatorStore((s) => s.setAttacker)
  const setMove = useCalculatorStore((s) => s.setMove)
  const toggleCriticalHit = useCalculatorStore((s) => s.toggleCriticalHit)

  const ids = {
    level: useId(),
    ability: useId(),
    item: useId(),
    status: useId(),
    type: useId(),
    hp: useId(),
    atk: useId(),
    spa: useId(),
    moveType: useId(),
    moveCat: useId(),
    movePower: useId(),
    crit: useId(),
  }

  return (
    <article className="arena-panel arena-panel--plasma p-6">
      <div className="relative z-10 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-arena-plasma shadow-[0_0_14px_rgba(255,43,142,0.9)]" />
            <p className="arena-label text-arena-plasma">Side A · Offense</p>
          </div>
          <span className="arena-chip text-arena-plasma/90">STRIKE</span>
        </header>

        <h2 className="font-display text-2xl font-bold tracking-wide text-white">
          Attacker
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledInput
            id={ids.level}
            label="Level"
            type="number"
            value={50}
            onChange={() => {}}
            disabled
          />
          <LabeledSelect
            id={ids.type}
            label="Primary Type"
            value={attacker.types?.[0] ?? 'NORMAL'}
            onChange={(v) =>
              setAttacker({
                types: [v, attacker.types?.[1] ?? null],
                grounded:
                  v !== 'FLYING' && (attacker.types?.[1] === null || attacker.types?.[1] !== 'FLYING'),
              })
            }
            options={TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
          <LabeledInput
            id={ids.ability}
            label="Ability"
            value={attacker.abilityId ?? ''}
            onChange={(v) => setAttacker({ abilityId: v.trim() === '' ? null : v })}
            placeholder="e.g. blaze"
          />
          <LabeledInput
            id={ids.item}
            label="Item"
            value={attacker.itemId ?? ''}
            onChange={(v) => setAttacker({ itemId: v.trim() === '' ? null : v })}
            placeholder="e.g. life-orb"
          />
          <LabeledSelect
            id={ids.status}
            label="Status"
            value={attacker.status}
            onChange={(v) => setAttacker({ status: v as StatusCondition })}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div className="arena-divider" />

        <div className="grid gap-4 sm:grid-cols-3">
          <LabeledInput
            id={ids.hp}
            label="HP"
            type="number"
            value={attacker.finalStats?.hp ?? 1}
            onChange={(v) => setAttacker({ finalStats: { hp: toInt(v, 1) } })}
          />
          <LabeledInput
            id={ids.atk}
            label="Attack"
            type="number"
            value={attacker.finalStats?.attack ?? 1}
            onChange={(v) => setAttacker({ finalStats: { attack: toInt(v, 1) } })}
          />
          <LabeledInput
            id={ids.spa}
            label="Special Attack"
            type="number"
            value={attacker.finalStats?.specialAttack ?? 1}
            onChange={(v) => setAttacker({ finalStats: { specialAttack: toInt(v, 1) } })}
          />
        </div>

        <div className="arena-divider" />

        <div className="grid gap-4 sm:grid-cols-3">
          <LabeledSelect
            id={ids.moveType}
            label="Move Type"
            value={move.type}
            onChange={(v) => setMove({ type: v })}
            options={TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
          <LabeledSelect
            id={ids.moveCat}
            label="Category"
            value={move.category}
            onChange={(v) => setMove({ category: v as MoveCategory })}
            options={CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <LabeledInput
            id={ids.movePower}
            label="Base Power"
            type="number"
            min={1}
            value={move.basePower}
            onChange={(v) => setMove({ basePower: toInt(v, 1) })}
          />
        </div>

        <label
          htmlFor={ids.crit}
          className="group flex items-center gap-3 rounded-sm border border-arena-plasma/30 bg-arena-plasma/10 px-4 py-3 transition hover:border-arena-plasma/60"
        >
          <input
            id={ids.crit}
            type="checkbox"
            className="arena-checkbox"
            checked={criticalHit}
            onChange={toggleCriticalHit}
          />
          <span className="arena-label text-arena-plasma">Critical Hit</span>
          <span className="ml-auto font-mono text-xs text-white/60">×1.5 multiplier</span>
        </label>
      </div>
    </article>
  )
}

function toInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

type LabeledInputProps = {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  min?: number
  max?: number
  placeholder?: string
  disabled?: boolean
}

function LabeledInput({ id, label, value, onChange, ...rest }: LabeledInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="arena-label text-arena-violet">
        {label}
      </label>
      <input
        id={id}
        className="arena-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}

type LabeledSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
}

function LabeledSelect({ id, label, value, onChange, options }: LabeledSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="arena-label text-arena-violet">
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
