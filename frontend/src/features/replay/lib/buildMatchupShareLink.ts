import {
  encodeCalcState,
  type ShareableState,
} from '../../calculator/share/encodeState'
import type {
  CombatantBuild,
  FieldRequest,
  SideConditions,
  Stats,
} from '../../calculator/types/api'
import type {
  ReplayBoardState,
  ReplayMoveChoice,
  ReplayPokemonState,
} from '../types'

const ZERO_STATS: Stats = {
  hp: 100,
  attack: 100,
  defense: 100,
  specialAttack: 100,
  specialDefense: 100,
  speed: 100,
}

const BLANK_SIDE: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

export function speciesNameToId(
  name: string | null | undefined,
): string | null {
  if (!name) return null
  return name
    .toLowerCase()
    .replace(/’/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildCombatant(state: ReplayPokemonState | null): CombatantBuild {
  const baseHp = state?.hpMax && state.hpMax > 0 ? state.hpMax : ZERO_STATS.hp
  const currentHp = state?.hpCurrent ?? baseHp
  const status = mapStatus(state?.status ?? null)
  return {
    speciesId: speciesNameToId(state?.speciesName ?? null),
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: mapBoosts(state),
    abilityId: null,
    itemId: null,
    status,
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: null,
    finalStats: null,
    types: null,
    grounded: true,
    currentHp,
  }
}

function mapStatus(s: string | null): CombatantBuild['status'] {
  if (!s) return 'NONE'
  const v = s.toUpperCase()
  if (v === 'BURN' || v === 'BRN') return 'BURN'
  if (v === 'POISON' || v === 'PSN' || v === 'TOX') return 'POISON'
  if (v === 'PARALYSIS' || v === 'PAR') return 'PARALYSIS'
  return 'NONE'
}

function mapBoosts(state: ReplayPokemonState | null): CombatantBuild['stages'] {
  const b = state?.boosts
  return {
    atk: b?.attack ?? 0,
    def: b?.defense ?? 0,
    spa: b?.specialAttack ?? 0,
    spd: b?.specialDefense ?? 0,
    spe: b?.speed ?? 0,
  }
}

function findActor(
  board: ReplayBoardState,
  slotId: string,
): { state: ReplayPokemonState | null; isSideA: boolean } {
  for (const p of board.sideA.activePokemon) {
    if (p.slotId === slotId) return { state: p, isSideA: true }
  }
  for (const p of board.sideB.activePokemon) {
    if (p.slotId === slotId) return { state: p, isSideA: false }
  }
  return { state: null, isSideA: true }
}

function sideToConditions(side: ReplayBoardState['sideA']): SideConditions {
  return {
    ...BLANK_SIDE,
    tailwind: side.tailwind,
    reflect: side.reflect,
    lightScreen: side.lightScreen,
    auroraVeil: side.auroraVeil,
  }
}

function mapWeather(w: string | null): FieldRequest['weather'] {
  switch ((w ?? '').toUpperCase()) {
    case 'SUN':
    case 'HARSH_SUNSHINE':
      return 'SUN'
    case 'RAIN':
    case 'HEAVY_RAIN':
      return 'RAIN'
    case 'SAND':
    case 'SANDSTORM':
      return 'SAND'
    case 'SNOW':
    case 'HAIL':
      return 'SNOW'
    default:
      return 'CLEAR'
  }
}

function mapTerrain(t: string | null): FieldRequest['terrain'] {
  switch ((t ?? '').toUpperCase()) {
    case 'GRASSY':
      return 'GRASSY'
    case 'ELECTRIC':
      return 'ELECTRIC'
    case 'MISTY':
      return 'MISTY'
    case 'PSYCHIC':
      return 'PSYCHIC'
    default:
      return 'NONE'
  }
}

export function buildMatchupShareLink(
  choice: ReplayMoveChoice,
  board: ReplayBoardState,
): string {
  const attacker = findActor(board, choice.actorSlotId)
  const defender = choice.targetSlotId
    ? findActor(board, choice.targetSlotId)
    : { state: null, isSideA: !attacker.isSideA }

  const attackerSide = attacker.isSideA
    ? sideToConditions(board.sideA)
    : sideToConditions(board.sideB)
  const defenderSide = attacker.isSideA
    ? sideToConditions(board.sideB)
    : sideToConditions(board.sideA)

  const state: ShareableState = {
    regulation: 'M-A',
    attacker: buildCombatant(attacker.state),
    defender: buildCombatant(defender.state),
    field: {
      weather: mapWeather(board.weather),
      terrain: mapTerrain(board.terrain),
      room: 'NONE',
    },
    attackerSide,
    defenderSide,
    criticalHit: false,
    targets: 1,
  }

  const encoded = encodeCalcState(state)
  return `/calc?s=${encoded}`
}
