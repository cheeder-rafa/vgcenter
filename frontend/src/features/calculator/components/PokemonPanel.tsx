import { useId, useMemo } from 'react'

import type { CalculatorSide } from '../store/useCalculatorStore'
import { useCalculatorStore } from '../store/useCalculatorStore'
import type {
  CombatantBuild,
  MoveDefinition,
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
  StatusCondition,
} from '../types/api'
import { MoveSlotRow } from './MoveSlotRow'
import { SpeciesSelect } from './SpeciesSelect'
import { SpriteBadge } from './SpriteBadge'
import { StatTable } from './StatTable'
import { STATUS_OPTIONS } from './shared'

type Props = {
  side: CalculatorSide
  pokedex: PokedexEntry[]
  abilities: NamedDatasetEntry[]
  items: NamedDatasetEntry[]
  natures: NatureResponse[]
  moves: MoveDefinition[]
  focusedSide: CalculatorSide
  focusedMoveIndex: number
  onFocusSlot: (side: CalculatorSide, index: number) => void
}

export function PokemonPanel({
  side,
  pokedex,
  abilities,
  items,
  natures,
  moves,
  focusedSide,
  focusedMoveIndex,
  onFocusSlot,
}: Props) {
  const combatant = useCalculatorStore((s) => s[side])
  const results = useCalculatorStore((s) =>
    side === 'attacker' ? s.results.attackerMoves : s.results.defenderMoves,
  )
  const setCombatant = useCalculatorStore((s) =>
    side === 'attacker' ? s.setAttacker : s.setDefender,
  )
  const setMoveSlot = useCalculatorStore((s) => s.setMoveSlot)

  const ids = {
    ability: useId(),
    item: useId(),
    nature: useId(),
    status: useId(),
    mega: useId(),
    heading: useId(),
  }

  const accent: 'plasma' | 'cyan' = side === 'attacker' ? 'plasma' : 'cyan'
  const panelVariant =
    side === 'attacker' ? 'arena-panel--plasma' : 'arena-panel--cyan'
  const accentText =
    side === 'attacker' ? 'text-arena-plasma' : 'text-arena-cyan'
  const pulseColor =
    side === 'attacker'
      ? 'bg-arena-plasma shadow-[0_0_14px_rgba(255,43,142,0.9)]'
      : 'bg-arena-cyan shadow-[0_0_14px_rgba(34,211,238,0.9)]'

  const speciesEntry = useMemo(
    () =>
      combatant.speciesId === null
        ? null
        : (pokedex.find((entry) => entry.id === combatant.speciesId) ?? null),
    [combatant.speciesId, pokedex],
  )

  const legalAbilityIds = useMemo(() => {
    if (speciesEntry === null) {
      return null
    }
    if (combatant.megaActive && speciesEntry.megaForms.length > 0) {
      return [speciesEntry.megaForms[0].abilityId]
    }
    return speciesEntry.abilityIds
  }, [speciesEntry, combatant.megaActive])

  const abilityOptions = useMemo(() => {
    if (legalAbilityIds === null) {
      return abilities
    }
    const legalSet = new Set(legalAbilityIds.map((id) => id.toLowerCase()))
    return abilities.filter((ability) => legalSet.has(ability.id.toLowerCase()))
  }, [abilities, legalAbilityIds])

  const typesLabel = formatTypes(combatant)
  const speciesName = speciesEntry?.name ?? null

  function handleSpeciesChange(entry: PokedexEntry | null) {
    if (entry === null) {
      setCombatant({
        speciesId: null,
        baseStats: null,
        finalStats: null,
        types: null,
        megaActive: false,
      })
      return
    }

    const [primary, secondary] = entry.types
    setCombatant({
      speciesId: entry.id,
      megaActive: false,
      abilityId: entry.abilityIds[0] ?? null,
      baseStats: entry.baseStats,
      finalStats: null,
      types: [primary, secondary ?? null],
      grounded: !(primary === 'FLYING' || secondary === 'FLYING'),
    })
  }

  function handleMegaToggle(next: boolean) {
    if (speciesEntry === null || speciesEntry.megaForms.length === 0) {
      return
    }
    const megaForm = speciesEntry.megaForms[0]
    const [primary, secondary] = next ? megaForm.types : speciesEntry.types
    setCombatant({
      megaActive: next,
      abilityId: next
        ? megaForm.abilityId
        : (speciesEntry.abilityIds[0] ?? combatant.abilityId),
      baseStats: next ? megaForm.baseStats : speciesEntry.baseStats,
      finalStats: null,
      types: [primary, secondary ?? null],
      grounded: !(primary === 'FLYING' || secondary === 'FLYING'),
    })
  }

  return (
    <article className={`arena-panel ${panelVariant} p-5`}>
      <div className="relative z-10 space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 animate-pulse-glow rounded-full ${pulseColor}`}
            />
            <p className={`arena-label ${accentText}`}>
              {side === 'attacker' ? 'Side A · Offense' : 'Side B · Counter'}
            </p>
          </div>
          <span className={`arena-chip ${accentText}`}>
            {side === 'attacker' ? 'STRIKE' : 'SHIELD'}
          </span>
        </header>

        <div className="flex items-start gap-4">
          <SpriteBadge
            speciesId={combatant.speciesId}
            speciesName={speciesName}
            accent={accent}
            size="lg"
          />
          <div className="flex-1 space-y-2">
            <h2
              id={ids.heading}
              className="font-display text-2xl font-bold tracking-wide text-white"
            >
              {speciesName ?? (side === 'attacker' ? 'Attacker' : 'Defender')}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {typesLabel.map((type) => (
                <span
                  key={type}
                  className="arena-chip text-white/80"
                  data-testid={`types-${side}-${type}`}
                >
                  {type}
                </span>
              ))}
              {speciesEntry?.megaForms.length ? (
                <span
                  className={`arena-chip ${accentText}`}
                  data-testid={`mega-available-${side}`}
                >
                  MEGA READY
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <SpeciesSelect
          pokedex={pokedex}
          speciesId={combatant.speciesId}
          accent={accent}
          onChange={handleSpeciesChange}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={ids.ability}
              className="arena-label text-arena-violet"
            >
              Ability
            </label>
            <select
              id={ids.ability}
              className="arena-select"
              value={combatant.abilityId ?? ''}
              onChange={(event) =>
                setCombatant({
                  abilityId:
                    event.target.value === '' ? null : event.target.value,
                })
              }
            >
              <option value="" className="bg-arena-void">
                — None —
              </option>
              {abilityOptions.map((ability) => (
                <option
                  key={ability.id}
                  value={ability.id}
                  className="bg-arena-void"
                >
                  {ability.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.item} className="arena-label text-arena-violet">
              Item
            </label>
            <select
              id={ids.item}
              className="arena-select"
              value={combatant.itemId ?? ''}
              onChange={(event) =>
                setCombatant({
                  itemId: event.target.value === '' ? null : event.target.value,
                })
              }
            >
              <option value="" className="bg-arena-void">
                — None —
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id} className="bg-arena-void">
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={ids.nature}
              className="arena-label text-arena-violet"
            >
              Nature
            </label>
            <select
              id={ids.nature}
              className="arena-select"
              value={combatant.natureId}
              onChange={(event) =>
                setCombatant({ natureId: event.target.value, finalStats: null })
              }
            >
              {natures.map((nature) => (
                <option
                  key={nature.id}
                  value={nature.id}
                  className="bg-arena-void"
                >
                  {formatNatureLabel(nature)}
                </option>
              ))}
              {natures.length === 0 ? (
                <option value="serious" className="bg-arena-void">
                  Serious
                </option>
              ) : null}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={ids.status}
              className="arena-label text-arena-violet"
            >
              Status
            </label>
            <select
              id={ids.status}
              className="arena-select"
              value={combatant.status}
              onChange={(event) =>
                setCombatant({ status: event.target.value as StatusCondition })
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-arena-void"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {speciesEntry?.megaForms.length ? (
          <label
            htmlFor={ids.mega}
            className={`flex items-center gap-3 rounded-sm border px-3 py-2 transition ${
              combatant.megaActive
                ? 'border-arena-violet/60 bg-arena-violet/15'
                : 'border-white/10 bg-white/5 hover:border-arena-violet/40'
            }`}
          >
            <input
              id={ids.mega}
              type="checkbox"
              className="arena-checkbox"
              checked={combatant.megaActive}
              onChange={(event) => handleMegaToggle(event.target.checked)}
            />
            <span className="arena-label text-arena-violet">
              Mega Evolution
            </span>
            <span className="ml-auto font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
              mid-battle toggle
            </span>
          </label>
        ) : null}

        <div className="arena-divider" />

        <StatTable
          sp={combatant.sp}
          baseStats={combatant.baseStats}
          finalStats={combatant.finalStats}
          accent={accent}
          onSpChange={(patch) => setCombatant({ sp: patch, finalStats: null })}
        />

        <div className="arena-divider" />

        <div className="space-y-2">
          <p className={`arena-label ${accentText}`}>Moves · 4 slots</p>
          <div className="flex flex-col gap-1.5">
            {combatant.moves.map((slot, index) => (
              <MoveSlotRow
                key={index}
                index={index}
                moveId={slot.moveId}
                legalMoveIds={speciesEntry?.moveIds ?? null}
                allMoves={moves}
                result={results[index] ?? null}
                focused={focusedSide === side && focusedMoveIndex === index}
                accent={accent}
                onMoveChange={(nextId) => setMoveSlot(side, index, nextId)}
                onFocus={() => onFocusSlot(side, index)}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function formatTypes(combatant: CombatantBuild): string[] {
  if (combatant.types === null) {
    return []
  }
  return combatant.types.filter((value): value is string => value !== null)
}

function formatNatureLabel(nature: NatureResponse): string {
  if (nature.increasedStat === null && nature.decreasedStat === null) {
    return `${nature.name} (neutral)`
  }
  const up = nature.increasedStat ? `+${abbrev(nature.increasedStat)}` : ''
  const down = nature.decreasedStat ? `−${abbrev(nature.decreasedStat)}` : ''
  const parts = [up, down].filter((piece) => piece !== '')
  return parts.length === 0
    ? nature.name
    : `${nature.name} (${parts.join(' / ')})`
}

function abbrev(stat: string): string {
  const normalized = stat.toUpperCase()
  switch (normalized) {
    case 'ATTACK':
      return 'Atk'
    case 'DEFENSE':
      return 'Def'
    case 'SPECIAL_ATTACK':
    case 'SPECIALATTACK':
      return 'SpA'
    case 'SPECIAL_DEFENSE':
    case 'SPECIALDEFENSE':
      return 'SpD'
    case 'SPEED':
      return 'Spe'
    case 'HP':
      return 'HP'
    default:
      return stat
  }
}
