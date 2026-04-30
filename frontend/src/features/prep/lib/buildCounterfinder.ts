import { META_SNAPSHOT, META_SOURCES } from '../data/metaSnapshot'
import { META_SETS } from '../../calculator/data/metaSets'
import {
  encodeCalcState,
  type ShareableState,
} from '../../calculator/share/encodeState'
import type {
  CombatantBuild,
  FieldRequest,
  SideConditions,
} from '../../calculator/types/api'
import type { SavedPokemon } from '../../../store/useTeamsStore'
import type { PrepThreat } from './analyzePrep'

const EMPTY_FIELD: FieldRequest = {
  weather: 'CLEAR',
  terrain: 'NONE',
  room: 'NONE',
}

const EMPTY_SIDE: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

const UTILITY_MOVE_IDS = new Set([
  'tailwind',
  'wide-guard',
  'quick-guard',
  'will-o-wisp',
  'encore',
  'helping-hand',
  'follow-me',
  'rage-powder',
  'trick-room',
  'protect',
])

export type CounterfinderRecommendation = {
  id: string
  title: string
  reason: string
  evidence: {
    label: string
    href: string
    sourceName: string
  }
}

export type CounterfinderReport = {
  spreads: CounterfinderRecommendation[]
  techMoves: CounterfinderRecommendation[]
  replacements: CounterfinderRecommendation[]
}

export function buildCounterfinder({
  mine,
  threats,
}: {
  mine: SavedPokemon[]
  threats: PrepThreat[]
}): CounterfinderReport {
  return {
    spreads: buildSpreadRecommendations(mine, threats),
    techMoves: buildTechMoveRecommendations(mine, threats),
    replacements: buildReplacementRecommendations(mine, threats),
  }
}

function buildSpreadRecommendations(
  mine: SavedPokemon[],
  threats: PrepThreat[],
): CounterfinderRecommendation[] {
  if (mine.length === 0 || threats.length === 0) return []
  const targetThreats = threats.filter((threat) => threat.watched).slice(0, 2)
  const bulkSorted = [...mine].sort((a, b) => bulkScore(b) - bulkScore(a))
  const anchor = bulkSorted[0]
  if (!anchor) return []
  const selectedThreats = targetThreats.length > 0 ? targetThreats : threats.slice(0, 2)

  return selectedThreats.map((threat) => {
    const moveId = META_SETS[toSpeciesId(threat.speciesName)]?.moveIds[0] ?? 'protect'
    const href = buildCalcEvidenceHref({
      attacker: toThreatBuild(threat, moveId),
      defender: toCombatant(anchor),
    })
    return {
      id: `spread-${anchor.speciesName}-${threat.id}`,
      title: `Tune ${anchor.speciesName} into ${threat.speciesName}`,
      reason: `${threat.speciesName} pressure high (Off ${threat.offensiveStat}, Spe ${threat.speed}). Run multi-threat optimizer with this matchup anchor and keep final spread at 66 SP.`,
      evidence: {
        label: `Open calc evidence: ${threat.speciesName} -> ${anchor.speciesName}`,
        href,
        sourceName: 'VGCenter calculator',
      },
    }
  })
}

function buildTechMoveRecommendations(
  mine: SavedPokemon[],
  threats: PrepThreat[],
): CounterfinderRecommendation[] {
  const threatLabel =
    threats.filter((threat) => threat.watched).map((threat) => threat.speciesName)[0] ??
    threats[0]?.speciesName ??
    'top threats'

  const recs = mine
    .map((pokemon) => {
      const metaSet = pokemon.speciesId ? META_SETS[pokemon.speciesId] : undefined
      if (!metaSet) return null
      const ownedMoves = new Set(pokemon.moves.map((slot) => slot.moveId).filter(Boolean))
      const utilityMove = metaSet.moveIds.find(
        (moveId) => UTILITY_MOVE_IDS.has(moveId) && !ownedMoves.has(moveId),
      )
      const fallbackMove = metaSet.moveIds.find((moveId) => !ownedMoves.has(moveId))
      const suggestedMove = utilityMove ?? fallbackMove
      if (!suggestedMove) return null
      return {
        id: `tech-${pokemon.speciesId}-${suggestedMove}`,
        title: `Add ${readableMove(suggestedMove)} on ${pokemon.speciesName}`,
        reason: `${readableMove(suggestedMove)} appears in common tournament set for ${pokemon.speciesName} and gives cleaner lines into ${threatLabel}.`,
        evidence: {
          label: 'Open source',
          href: metaSet.sourceUrl,
          sourceName: metaSet.sourceName,
        },
      } satisfies CounterfinderRecommendation
    })
    .filter((entry): entry is CounterfinderRecommendation => entry !== null)

  return recs.slice(0, 2)
}

function buildReplacementRecommendations(
  mine: SavedPokemon[],
  threats: PrepThreat[],
): CounterfinderRecommendation[] {
  const mineNames = new Set(mine.map((pokemon) => pokemon.speciesName.toLowerCase()))
  const threatLabel =
    threats.filter((threat) => threat.watched).map((threat) => threat.speciesName)[0] ??
    threats[0]?.speciesName ??
    'meta threats'

  return META_SNAPSHOT.usage
    .filter((entry) => !mineNames.has(entry.speciesName.toLowerCase()))
    .slice(0, 2)
    .map((entry) => ({
      id: `replace-${entry.rank}-${entry.speciesName}`,
      title: `Test ${entry.speciesName} slot`,
      reason: `${entry.speciesName} sits at #${entry.rank} usage (${entry.usagePercent.toFixed(2)}%). Validate if this slot improves ${threatLabel} matchup flow.`,
      evidence: {
        label: 'Open source',
        href: META_SOURCES.pikalytics.sourceUrl,
        sourceName: META_SOURCES.pikalytics.sourceName,
      },
    }))
}

function toCombatant(pokemon: SavedPokemon): CombatantBuild {
  return {
    speciesId: pokemon.speciesId,
    natureId: pokemon.natureId,
    sp: pokemon.sp,
    stages: pokemon.stages,
    abilityId: pokemon.abilityId,
    itemId: pokemon.itemId,
    status: pokemon.status,
    megaActive: pokemon.megaActive,
    megaFormId: pokemon.megaFormId,
    moves: pokemon.moves,
    baseStats: null,
    finalStats: null,
    types: pokemon.types,
    grounded: pokemon.grounded,
    currentHp: pokemon.currentHp,
  }
}

function toThreatBuild(threat: PrepThreat, moveId: string): CombatantBuild {
  return {
    speciesId: toSpeciesId(threat.speciesName),
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [{ moveId }, { moveId: null }, { moveId: null }, { moveId: null }],
    baseStats: null,
    finalStats: null,
    types: threat.types.length > 0 ? [threat.types[0], threat.types[1] ?? null] : null,
    grounded: true,
    currentHp: 100,
  }
}

function buildCalcEvidenceHref({
  attacker,
  defender,
}: {
  attacker: CombatantBuild
  defender: CombatantBuild
}): string {
  const state: ShareableState = {
    regulation: 'M-A',
    attacker,
    defender,
    field: EMPTY_FIELD,
    attackerSide: EMPTY_SIDE,
    defenderSide: EMPTY_SIDE,
    criticalHit: false,
    targets: 1,
  }
  return `/calc?s=${encodeCalcState(state)}`
}

function bulkScore(pokemon: SavedPokemon): number {
  const stats = pokemon.finalStats ?? pokemon.baseStats
  if (!stats) return 0
  return stats.hp + stats.defense + stats.specialDefense
}

function toSpeciesId(name: string): string {
  return name.toLowerCase().replace(/’/g, '').replace(/[^a-z0-9]+/g, '-')
}

function readableMove(moveId: string): string {
  return moveId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
