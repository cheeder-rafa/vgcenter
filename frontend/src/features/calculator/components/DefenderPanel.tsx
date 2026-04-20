import { useId } from 'react'

import { useCalculatorStore } from '../store/useCalculatorStore'
import { STATUS_OPTIONS, TYPE_OPTIONS } from './shared'
import type { StatusCondition } from '../types/api'

export function DefenderPanel() {
  const defender = useCalculatorStore((s) => s.defender)
  const setDefender = useCalculatorStore((s) => s.setDefender)

  const ids = {
    level: useId(),
    primary: useId(),
    secondary: useId(),
    ability: useId(),
    item: useId(),
    status: useId(),
    hp: useId(),
    def: useId(),
    spd: useId(),
  }

  return (
    <article className="arena-panel arena-panel--cyan p-6">
      <div className="relative z-10 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-arena-cyan shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
            <p className="arena-label text-arena-cyan">Side B · Guard</p>
          </div>
          <span className="arena-chip text-arena-cyan/90">SHIELD</span>
        </header>

        <h2 className="font-display text-2xl font-bold tracking-wide text-white">
          Defender
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={ids.level} label="Level">
            <input
              id={ids.level}
              type="number"
              min={1}
              max={100}
              className="arena-input"
              value={defender.level}
              onChange={(e) => setDefender({ level: toInt(e.target.value, 50) })}
            />
          </Field>
          <Field id={ids.primary} label="Primary Type">
            <select
              id={ids.primary}
              className="arena-select"
              value={defender.types[0] ?? 'NORMAL'}
              onChange={(e) =>
                setDefender({ types: [e.target.value, ...defender.types.slice(1)] })
              }
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-arena-void">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field id={ids.secondary} label="Secondary Type">
            <select
              id={ids.secondary}
              className="arena-select"
              value={defender.types[1] ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const next = value === '' ? [defender.types[0] ?? 'NORMAL'] : [defender.types[0] ?? 'NORMAL', value]
                setDefender({ types: next })
              }}
            >
              <option value="" className="bg-arena-void">
                None
              </option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-arena-void">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field id={ids.ability} label="Ability">
            <input
              id={ids.ability}
              className="arena-input"
              value={defender.abilityId ?? ''}
              placeholder="e.g. multiscale"
              onChange={(e) =>
                setDefender({ abilityId: e.target.value.trim() === '' ? null : e.target.value })
              }
            />
          </Field>
          <Field id={ids.item} label="Item">
            <input
              id={ids.item}
              className="arena-input"
              value={defender.itemId ?? ''}
              placeholder="e.g. assault-vest"
              onChange={(e) =>
                setDefender({ itemId: e.target.value.trim() === '' ? null : e.target.value })
              }
            />
          </Field>
          <Field id={ids.status} label="Status">
            <select
              id={ids.status}
              className="arena-select"
              value={defender.status}
              onChange={(e) => setDefender({ status: e.target.value as StatusCondition })}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-arena-void">
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="arena-divider" />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id={ids.hp} label="HP">
            <input
              id={ids.hp}
              type="number"
              className="arena-input"
              value={defender.stats.hp}
              onChange={(e) =>
                setDefender({ stats: { ...defender.stats, hp: toInt(e.target.value, 1) } })
              }
            />
          </Field>
          <Field id={ids.def} label="Defense">
            <input
              id={ids.def}
              type="number"
              className="arena-input"
              value={defender.stats.defense}
              onChange={(e) =>
                setDefender({ stats: { ...defender.stats, defense: toInt(e.target.value, 1) } })
              }
            />
          </Field>
          <Field id={ids.spd} label="Special Defense">
            <input
              id={ids.spd}
              type="number"
              className="arena-input"
              value={defender.stats.specialDefense}
              onChange={(e) =>
                setDefender({
                  stats: { ...defender.stats, specialDefense: toInt(e.target.value, 1) },
                })
              }
            />
          </Field>
        </div>
      </div>
    </article>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="arena-label text-arena-cyan/80">
        {label}
      </label>
      {children}
    </div>
  )
}

function toInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}
