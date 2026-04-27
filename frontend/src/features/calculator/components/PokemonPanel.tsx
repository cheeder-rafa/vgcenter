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
import { computeBattleStats } from '../lib/computeBattleStats'
import { MoveSummaryStrip } from './MoveSummaryStrip'
import { MoveSlotRow } from './MoveSlotRow'
import { SpeciesSelect } from './SpeciesSelect'
import { SpriteBadge } from './SpriteBadge'
import { StatTable } from './StatTable'
import { MEGA_STONE_MAP } from '../data/megaStoneMap'
import { STATUS_OPTIONS } from './shared'
import { getTypeChipClasses } from './typeColors'

const DEFAULT_SPREAD: CombatantBuild['sp'] = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const DEFAULT_STAGES: CombatantBuild['stages'] = {
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const EMPTY_MOVE_SLOTS: CombatantBuild['moves'] = [
  { moveId: null },
  { moveId: null },
  { moveId: null },
  { moveId: null },
]

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
  const maxHp = combatant.finalStats?.hp ?? combatant.baseStats?.hp ?? 1

  function handleSpeciesChange(entry: PokedexEntry | null) {
    clearSideMovesAndResults(side)
    onFocusSlot(side, 0)

    if (entry === null) {
      setCombatant({
        speciesId: null,
        natureId: 'serious',
        sp: { ...DEFAULT_SPREAD },
        stages: { ...DEFAULT_STAGES },
        abilityId: null,
        itemId: null,
        status: 'NONE',
        baseStats: null,
        finalStats: null,
        types: null,
        megaActive: false,
        megaFormId: null,
        moves: EMPTY_MOVE_SLOTS,
        grounded: true,
        currentHp: combatant.currentHp,
      })
      return
    }

    const [primary, secondary] = entry.types
    const nextAbilityId = entry.abilityIds[0] ?? null
    const nextTypes: [string, string | null] = [primary, secondary ?? null]
    setCombatant({
      speciesId: entry.id,
      natureId: 'serious',
      sp: { ...DEFAULT_SPREAD },
      stages: { ...DEFAULT_STAGES },
      megaActive: false,
      megaFormId: null,
      abilityId: nextAbilityId,
      itemId: null,
      status: 'NONE',
      moves: EMPTY_MOVE_SLOTS,
      baseStats: entry.baseStats,
      finalStats: computeBattleStats(entry.baseStats, DEFAULT_SPREAD, null),
      types: nextTypes,
      grounded: isGrounded(nextTypes, nextAbilityId),
      currentHp: entry.baseStats.hp,
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
    const nextAbilityId = next
      ? megaForm.abilityId
      : (speciesEntry.abilityIds[0] ?? combatant.abilityId)
    const nextTypes: [string, string | null] = [primary, secondary ?? null]
    const nextBaseStats = next ? megaForm.baseStats : speciesEntry.baseStats
    const currentNature = natures.find((n) => n.id === combatant.natureId) ?? null
    setCombatant({
      megaActive: next,
      megaFormId: next ? megaForm.id : combatant.megaFormId,
      abilityId: nextAbilityId,
      itemId: next
        ? (MEGA_STONE_MAP[megaForm.id] ?? combatant.itemId)
        : combatant.itemId,
      baseStats: nextBaseStats,
      finalStats: computeBattleStats(nextBaseStats, combatant.sp, currentNature),
      types: nextTypes,
      grounded: isGrounded(nextTypes, nextAbilityId),
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
    const nextTypes: [string, string | null] = [primary, secondary ?? null]
    const currentNature = natures.find((n) => n.id === combatant.natureId) ?? null
    setCombatant({
      megaFormId: nextMegaFormId,
      megaActive: true,
      itemId: MEGA_STONE_MAP[nextMegaFormId] ?? combatant.itemId,
      abilityId: megaForm.abilityId,
      baseStats: megaForm.baseStats,
      finalStats: computeBattleStats(megaForm.baseStats, combatant.sp, currentNature),
      types: nextTypes,
      grounded: isGrounded(nextTypes, megaForm.abilityId),
    })
  }

  return (
    <article
      className={`arena-panel ${panelVariant} p-3 sm:p-4`}
      onFocusCapture={() => onActivateSide?.(side)}
      onPointerDownCapture={() => onActivateSide?.(side)}
    >
      <div className="relative z-10 space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 animate-pulse-glow rounded-full ${pulseColor}`}
            />
            <p className={`arena-label ${accentText}`}>
              {side === 'attacker' ? 'Side A -' : 'Side B -'}{' '}
              {isAttacking ? 'Attacker' : 'Defender'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MoveSummaryStrip results={results} accent={accent} />
            <span className={`arena-chip ${accentText}`}>
              {isAttacking ? 'ATTACKER' : 'DEFENDER'}
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
              className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl"
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
                <label
                  htmlFor={ids.mega}
                  className={`arena-chip cursor-pointer text-[0.62rem] tracking-[0.2em] ${accentText} ${combatant.megaActive ? 'ring-1 ring-white/20' : ''}`}
                  data-testid={`mega-available-${side}`}
                >
                  <input
                    id={ids.mega}
                    type="checkbox"
                    className="sr-only"
                    aria-label="Mega Evolution"
                    checked={combatant.megaActive}
                    onChange={(event) => handleMegaToggle(event.target.checked)}
                  />
                  {combatant.megaActive ? '✓ Mega Active' : 'Mega Evolution'}
                </label>
              ) : null}
            </div>
            {speciesEntry &&
            speciesEntry.megaForms.length > 1 &&
            combatant.megaActive ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                setCombatant((() => {
                  const abilityId =
                    event.target.value === '' ? null : event.target.value
                  return {
                    abilityId,
                    grounded: isGrounded(combatant.types, abilityId),
                  }
                })())
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
              onChange={(event) => {
                const nextNatureId = event.target.value
                const nextNature = natures.find((n) => n.id === nextNatureId) ?? null
                const nextFinalStats =
                  combatant.baseStats !== null
                    ? computeBattleStats(combatant.baseStats, combatant.sp, nextNature)
                    : null
                setCombatant({ natureId: nextNatureId, finalStats: nextFinalStats })
              }}
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
          <div className="flex flex-col gap-1.5">
            <label className="arena-label text-arena-violet" htmlFor={`${ids.heading}-current-hp`}>
              Current HP
            </label>
            <input
              id={`${ids.heading}-current-hp`}
              type="number"
              min={1}
              max={maxHp}
              value={combatant.currentHp}
              className="arena-input"
              onChange={(event) =>
                setCombatant({
                  currentHp: clampCurrentHp(Number(event.target.value), maxHp),
                })
              }
            />
          </div>
        </div>

        <div className="arena-divider" />

        <StatTable
          sp={combatant.sp}
          stages={combatant.stages}
          baseStats={combatant.baseStats}
          finalStats={combatant.finalStats}
          status={combatant.status}
          accent={accent}
          onSpChange={(patch) => {
            const nextSp = { ...combatant.sp, ...patch }
            const currentNature = natures.find((n) => n.id === combatant.natureId) ?? null
            const nextFinalStats =
              combatant.baseStats !== null
                ? computeBattleStats(combatant.baseStats, nextSp, currentNature)
                : null
            setCombatant({ sp: nextSp, finalStats: nextFinalStats })
          }}
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

function formatTypes(combatant: CombatantBuild): string[] {
  if (combatant.types === null) {
    return []
  }
  return combatant.types.filter((value): value is string => value !== null)
}

function isGrounded(
  types: CombatantBuild['types'],
  abilityId: string | null,
): boolean {
  if (types === null) {
    return true
  }
  return !types.includes('FLYING') && abilityId !== 'levitate'
}

function clampCurrentHp(value: number, maxHp: number): number {
  if (!Number.isFinite(value)) {
    return maxHp
  }
  return Math.max(1, Math.min(Math.trunc(value), maxHp))
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
