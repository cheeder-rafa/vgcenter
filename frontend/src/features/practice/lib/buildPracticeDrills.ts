import { META_SNAPSHOT, META_SOURCES } from '../../prep/data/metaSnapshot'
import type { ReplayPrepFinding } from '../../prep/store/usePrepNotebookStore'
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

export type PracticeDrillType = 'survival-check' | 'best-ko-move' | 'safest-lead'

export type PracticeDrill = {
  id: string
  type: PracticeDrillType
  title: string
  prompt: string
  answer: string
  explanation: string
  calcHref: string
  sources: string[]
}

export function buildPracticeDrills({
  mine,
  opponent,
  watchedThreatIds,
  replayFindings,
}: {
  mine: SavedPokemon[]
  opponent: SavedPokemon[]
  watchedThreatIds: string[]
  replayFindings: ReplayPrepFinding[]
}): PracticeDrill[] {
  if (mine.length === 0 || opponent.length === 0) return []

  const watched = new Set(watchedThreatIds)
  const watchedThreat =
    opponent.find((entry) => watched.has(entry.speciesId ?? '')) ?? opponent[0]
  const metaThreat = META_SNAPSHOT.usage[0]
  const replaySignal = replayFindings[0]
  const fastestMine = [...mine].sort((a, b) => speed(b) - speed(a))[0] ?? mine[0]
  const bulkiestMine = [...mine].sort((a, b) => bulk(b) - bulk(a))[0] ?? mine[0]
  const leadTwo = [...mine].sort((a, b) => speed(b) - speed(a)).slice(0, 2)
  const oppLeadTwo = [...opponent].sort((a, b) => speed(b) - speed(a)).slice(0, 2)

  if (!watchedThreat || !metaThreat || !fastestMine || !bulkiestMine) return []

  const threatMoveId = firstMoveId(watchedThreat) ?? 'protect'
  const koMoveId = firstMoveId(fastestMine) ?? 'protect'
  const leadTarget = oppLeadTwo[0] ?? watchedThreat

  const survivalDrill: PracticeDrill = {
    id: `survive-${bulkiestMine.speciesId}-${watchedThreat.speciesId}`,
    type: 'survival-check',
    title: 'Does this survive?',
    prompt: `${bulkiestMine.speciesName} into watched threat ${watchedThreat.speciesName}: survive clean-field hit?`,
    answer:
      bulk(bulkiestMine) >= offense(watchedThreat)
        ? `Likely survive one hit from ${watchedThreat.speciesName}.`
        : `High risk: ${bulkiestMine.speciesName} likely drops to ${watchedThreat.speciesName}.`,
    explanation:
      replaySignal === undefined
        ? `Calc-backed check: open matchup and verify 16-roll survival with current item, nature, and field.`
        : `Calc-backed check: replay note "${replaySignal.title}" suggests same board pattern. Re-run 16-roll survival in calc.`,
    calcHref: buildCalcEvidenceHref({
      attacker: toCombatant(watchedThreat, threatMoveId),
      defender: toCombatant(bulkiestMine, firstMoveId(bulkiestMine) ?? 'protect'),
    }),
    sources: ['Watched threats (Team Prep)', 'Saved teams', 'Replay findings'],
  }

  const koDrill: PracticeDrill = {
    id: `ko-${fastestMine.speciesId}-${watchedThreat.speciesId}`,
    type: 'best-ko-move',
    title: 'Which move has best KO odds?',
    prompt: `${fastestMine.speciesName} into ${watchedThreat.speciesName}: which move gives best KO chance?`,
    answer: `Start with ${humanizeMove(koMoveId)} on ${fastestMine.speciesName}; verify highest KO odds in calc roll table.`,
    explanation: `Calc-backed answer: compare move slots on same board state, then choose highest KO probability line. Meta anchor from ${metaThreat.speciesName} usage context.`,
    calcHref: buildCalcEvidenceHref({
      attacker: toCombatant(fastestMine, koMoveId),
      defender: toCombatant(watchedThreat, threatMoveId),
    }),
    sources: ['Saved teams', `Pikalytics (${META_SOURCES.pikalytics.sourceName})`],
  }

  const leadNames = leadTwo.map((entry) => entry.speciesName).join(' + ')
  const oppLeadNames = oppLeadTwo.map((entry) => entry.speciesName).join(' + ')
  const leadDrill: PracticeDrill = {
    id: `lead-${(leadTwo[0]?.speciesId ?? 'x')}-${(leadTwo[1]?.speciesId ?? 'y')}`,
    type: 'safest-lead',
    title: 'Which lead is safest?',
    prompt: `Is ${leadNames} safest into ${oppLeadNames || watchedThreat.speciesName}?`,
    answer: `Default safest lead: ${leadNames}. Re-check if opponent opens ${leadTarget.speciesName}.`,
    explanation:
      replaySignal === undefined
        ? 'Calc-backed check: open lead anchor matchup, verify damage race and speed control before lock-in.'
        : `Calc-backed check: combine replay adaptation note (turn ${replaySignal.turnNumber}) with lead damage race in calc.`,
    calcHref: buildCalcEvidenceHref({
      attacker: toCombatant(leadTwo[0] ?? fastestMine, firstMoveId(leadTwo[0] ?? fastestMine) ?? 'protect'),
      defender: toCombatant(leadTarget, firstMoveId(leadTarget) ?? 'protect'),
    }),
    sources: ['Saved teams', 'Watched threats', 'Replay findings', 'Meta threats'],
  }

  return [survivalDrill, koDrill, leadDrill]
}

function toCombatant(
  pokemon: SavedPokemon,
  moveId: string,
): CombatantBuild {
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
    moves: [{ moveId }, { moveId: null }, { moveId: null }, { moveId: null }],
    baseStats: pokemon.baseStats,
    finalStats: pokemon.finalStats,
    types: pokemon.types,
    grounded: pokemon.grounded,
    currentHp: pokemon.currentHp,
  }
}

function speed(pokemon: SavedPokemon): number {
  return pokemon.finalStats?.speed ?? pokemon.baseStats?.speed ?? 0
}

function offense(pokemon: SavedPokemon): number {
  const stats = pokemon.finalStats ?? pokemon.baseStats
  if (!stats) return 0
  return Math.max(stats.attack, stats.specialAttack)
}

function bulk(pokemon: SavedPokemon): number {
  const stats = pokemon.finalStats ?? pokemon.baseStats
  if (!stats) return 0
  return stats.hp + stats.defense + stats.specialDefense
}

function firstMoveId(pokemon: SavedPokemon): string | null {
  return pokemon.moves.find((move) => move.moveId !== null)?.moveId ?? null
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

function humanizeMove(moveId: string): string {
  return moveId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
