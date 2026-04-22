import { useId, useMemo } from 'react'

import type { CalculatorSide } from '../store/useCalculatorStore'
import { useCalculatorStore } from '../store/useCalculatorStore'
import type {
  CombatantBuild,
  DamageResult,
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
import { MEGA_STONE_MAP } from '../data/megaStoneMap'
import { STATUS_OPTIONS } from './shared'
import { getTypeChipClasses } from './typeColors'

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
  onActivateSide?: (side: CalculatorSide) => void
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
  onActivateSide,
}: Props) {
  const combatant = useCalculatorStore((s) => s[side])
  const results = useCalculatorStore((s) =>
    side === 'attacker' ? s.results.attackerMoves : s.results.defenderMoves,
  )
  const setCombatant = useCalculatorStore((s) =>
    side === 'attacker' ? s.setAttacker : s.setDefender,
  )
  const clearSideMovesAndResults = useCalculatorStore(
    (s) => s.clearSideMovesAndResults,
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

  const isAttacking = side === focusedSide
  const accent: 'plasma' | 'cyan' = isAttacking ? 'plasma' : 'cyan'
  const panelVariant = isAttacking ? 'arena-panel--plasma' : 'arena-panel--cyan'
  const accentText = isAttacking ? 'text-arena-plasma' : 'text-arena-cyan'
  const pulseColor = isAttacking
    ? 'bg-arena-plasma shadow-[0_0_14px_rgba(255,43,142,0.9)]'
    : 'bg-arena-cyan shadow-[0_0_14px_rgba(34,211,238,0.9)]'

  const speciesEntry = useMemo(
    () =>
      combatant.speciesId === null
        ? null
        : (pokedex.find((entry) => entry.id === combatant.speciesId) ?? null),
    [combatant.speciesId, pokedex],
  )

  const activeMegaForm = useMemo(() => {
    if (
      speciesEntry === null ||
      !combatant.megaActive ||
      speciesEntry.megaForms.length === 0
    ) {
      return null
    }
    return (
      speciesEntry.megaForms.find(
        (candidate) => candidate.id === combatant.megaFormId,
      ) ?? speciesEntry.megaForms[0]
    )
  }, [speciesEntry, combatant.megaActive, combatant.megaFormId])

  const legalAbilityIds = useMemo(() => {
    if (speciesEntry === null) {
      return null
    }
    if (activeMegaForm !== null) {
      return [activeMegaForm.abilityId]
    }
    return speciesEntry.abilityIds
  }, [speciesEntry, activeMegaForm])

  const abilityOptions = useMemo(() => {
    if (legalAbilityIds === null) {
      return abilities
    }
    const legalSet = new Set(legalAbilityIds.map((id) => id.toLowerCase()))
    return abilities.filter((ability) => legalSet.has(ability.id.toLowerCase()))
  }, [abilities, legalAbilityIds])

  const typesLabel = formatTypes(combatant)
  const speciesName = speciesEntry?.name ?? null
  const displayName =
    combatant.megaActive && speciesName !== null
      ? `Mega ${speciesName}`
      : speciesName

  function handleSpeciesChange(entry: PokedexEntry | null) {
    clearSideMovesAndResults(side)
    onFocusSlot(side, 0)

    if (entry === null) {
      setCombatant({
        speciesId: null,
        baseStats: null,
        finalStats: null,
        types: null,
        megaActive: false,
        megaFormId: null,
      })
      return
    }

    const [primary, secondary] = entry.types
    setCombatant({
      speciesId: entry.id,
      megaActive: false,
      megaFormId: null,
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
    const megaForm =
      speciesEntry.megaForms.find(
        (candidate) => candidate.id === combatant.megaFormId,
      ) ?? speciesEntry.megaForms[0]
    const [primary, secondary] = next ? megaForm.types : speciesEntry.types
    setCombatant({
      megaActive: next,
      megaFormId: next ? megaForm.id : combatant.megaFormId,
      abilityId: next
        ? megaForm.abilityId
        : (speciesEntry.abilityIds[0] ?? combatant.abilityId),
      itemId: next
        ? (MEGA_STONE_MAP[megaForm.id] ?? combatant.itemId)
        : combatant.itemId,
      baseStats: next ? megaForm.baseStats : speciesEntry.baseStats,
      finalStats: null,
      types: [primary, secondary ?? null],
      grounded: !(primary === 'FLYING' || secondary === 'FLYING'),
    })
  }

  function handleMegaVariantChange(nextMegaFormId: string) {
    if (speciesEntry === null) {
      return
    }
    const megaForm = speciesEntry.megaForms.find(
      (candidate) => candidate.id === nextMegaFormId,
    )
    if (!megaForm) {
      return
    }
    const [primary, secondary] = megaForm.types
    setCombatant({
      megaFormId: nextMegaFormId,
      megaActive: true,
      itemId: MEGA_STONE_MAP[nextMegaFormId] ?? combatant.itemId,
      abilityId: megaForm.abilityId,
      baseStats: megaForm.baseStats,
      finalStats: null,
      types: [primary, secondary ?? null],
      grounded: !(primary === 'FLYING' || secondary === 'FLYING'),
    })
  }

  return (
    <article
      className={`arena-panel ${panelVariant} p-4`}
      onFocusCapture={() => onActivateSide?.(side)}
      onPointerDownCapture={() => onActivateSide?.(side)}
    >
      <div className="relative z-10 space-y-3">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 animate-pulse-glow rounded-full ${pulseColor}`}
            />
            <p className={`arena-label ${accentText}`}>
              {side === 'attacker' ? 'Side A -' : 'Side B -'}{' '}
              {isAttacking ? 'Attacker' : 'Defender'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MoveSummaryStrip results={results} accent={accent} />
            <span className={`arena-chip ${accentText}`}>
              {isAttacking ? 'ATTACKER' : 'DEFENDER'}
            </span>
          </div>
        </header>

        <div className="flex items-start gap-3">
          <SpriteBadge
            speciesId={combatant.speciesId}
            speciesName={speciesName}
            megaActive={combatant.megaActive}
            megaFormId={combatant.megaFormId}
            accent={accent}
            size="lg"
          />
          <div className="flex-1 space-y-2">
            <h2
              id={ids.heading}
              className="font-display text-2xl font-bold tracking-wide text-white"
            >
              {displayName ?? (side === 'attacker' ? 'Attacker' : 'Defender')}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {typesLabel.map((type) => (
                <span
                  key={type}
                  className={`arena-chip text-[0.62rem] tracking-[0.2em] ${getTypeChipClasses(type)}`}
                  data-testid={`types-${side}-${type}`}
                >
                  {type}
                </span>
              ))}
              {speciesEntry?.megaForms.length ? (
                <span
                  className={`arena-chip text-[0.62rem] tracking-[0.2em] ${accentText}`}
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

        <div className="min-h-[56px]">
          {speciesEntry?.megaForms.length ? (
            <div className="flex flex-col gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-2">
              <label
                htmlFor={ids.mega}
                className={`flex items-center gap-3 transition ${
                  combatant.megaActive ? 'text-white' : 'hover:text-white/90'
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
                <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/55">
                  mid-battle toggle
                </span>
              </label>
              {speciesEntry.megaForms.length > 1 && combatant.megaActive ? (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`${ids.mega}-variant`}
                    className="arena-label text-arena-violet"
                  >
                    Mega Variant
                  </label>
                  <select
                    id={`${ids.mega}-variant`}
                    className="arena-select flex-1"
                    value={activeMegaForm?.id ?? speciesEntry.megaForms[0].id}
                    onChange={(event) =>
                      handleMegaVariantChange(event.target.value)
                    }
                  >
                    {speciesEntry.megaForms.map((megaForm) => (
                      <option
                        key={megaForm.id}
                        value={megaForm.id}
                        className="bg-arena-void"
                      >
                        {megaForm.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="arena-divider" />

        <StatTable
          sp={combatant.sp}
          stages={combatant.stages}
          baseStats={combatant.baseStats}
          finalStats={combatant.finalStats}
          status={combatant.status}
          accent={accent}
          onSpChange={(patch) => setCombatant({ sp: patch, finalStats: null })}
          onStageChange={(patch) => setCombatant({ stages: patch })}
        />

        <div className="arena-divider" />

        <div className="space-y-1.5">
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

type SideResults = (DamageResult | null)[]

function MoveSummaryStrip({
  results,
  accent,
}: {
  results: SideResults
  accent: 'plasma' | 'cyan'
}) {
  const hasAny = results.some((r) => r !== null)
  if (!hasAny) return null

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
        const isLethal = clampedMax >= 100

        const trackColor = isLethal
          ? 'rgba(255,80,80,0.18)'
          : clampedMax >= 50
            ? 'rgba(255,140,30,0.15)'
            : accentTrack
        const pinColor = isLethal
          ? 'rgba(255,75,75,0.9)'
          : clampedMax >= 50
            ? 'rgba(255,122,26,0.88)'
            : accentFill

        return (
          <div
            key={i}
            className="relative h-[18px] w-[28px] overflow-hidden rounded-[2px]"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            title={`M${i + 1}: ${result.minPct.toFixed(1)}–${result.maxPct.toFixed(1)}%`}
          >
            <div
              className="absolute inset-y-0"
              style={{
                left: `${clampedMin}%`,
                width: `${Math.max(0, clampedMax - clampedMin)}%`,
                background: trackColor,
              }}
            />
            <div
              className="absolute inset-y-0 w-[2px]"
              style={{
                left: `${Math.max(0.5, clampedMin)}%`,
                background: pinColor,
              }}
            />
            <div
              className="absolute inset-y-0 w-[2px]"
              style={{
                left: `${Math.min(99.5, clampedMax)}%`,
                background: pinColor,
              }}
            />
          </div>
        )
      })}
    </div>
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
