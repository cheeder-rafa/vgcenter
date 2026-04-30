import type { SavedPokemon } from '../../../store/useTeamsStore'
import {
  buildCounterfinder,
  type CounterfinderReport,
} from './buildCounterfinder'

type Rail = [
  SavedPokemon | null,
  SavedPokemon | null,
  SavedPokemon | null,
  SavedPokemon | null,
  SavedPokemon | null,
  SavedPokemon | null,
]

export type ReadinessLevel = 'empty' | 'partial' | 'ready'

export type PrepThreat = {
  id: string
  speciesName: string
  spriteId: string | null
  speed: number
  offensiveStat: number
  types: string[]
  watched: boolean
}

export type PracticePrompt = {
  title: string
  detail: string
  href: string
  actionLabel: string
}

export type PrepReport = {
  myCount: number
  opponentCount: number
  readinessLevel: ReadinessLevel
  nextAction: string
  fastestMine: SavedPokemon | null
  fastestOpponent: SavedPokemon | null
  averageSpeedMine: number | null
  averageSpeedOpponent: number | null
  typeTags: string[]
  threats: PrepThreat[]
  practicePrompts: PracticePrompt[]
  counterfinder: CounterfinderReport
}

export function analyzePrep({
  mine,
  opponent,
  watchedThreatIds,
}: {
  mine: Rail
  opponent: Rail
  watchedThreatIds: string[]
}): PrepReport {
  const myTeam = compactRail(mine)
  const opponentTeam = compactRail(opponent)
  const watched = new Set(watchedThreatIds)
  const myCount = myTeam.length
  const opponentCount = opponentTeam.length
  const readinessLevel = getReadinessLevel(myCount, opponentCount)
  const fastestMine = fastest(myTeam)
  const fastestOpponent = fastest(opponentTeam)
  const threats = opponentTeam
    .map((pokemon) => toThreat(pokemon, watched))
    .sort((a, b) => b.offensiveStat - a.offensiveStat || b.speed - a.speed)
  const typeTags = [...new Set([...myTeam, ...opponentTeam].flatMap(getTypes))]
    .filter(Boolean)
    .sort()

  return {
    myCount,
    opponentCount,
    readinessLevel,
    nextAction: getNextAction(readinessLevel, myCount, opponentCount),
    fastestMine,
    fastestOpponent,
    averageSpeedMine: averageSpeed(myTeam),
    averageSpeedOpponent: averageSpeed(opponentTeam),
    typeTags,
    threats,
    practicePrompts: buildPracticePrompts({
      myTeam,
      opponentTeam,
      fastestMine,
      fastestOpponent,
      threats,
    }),
    counterfinder: buildCounterfinder({
      mine: myTeam,
      threats,
    }),
  }
}

function compactRail(rail: Rail): SavedPokemon[] {
  return rail.filter((pokemon): pokemon is SavedPokemon => pokemon !== null)
}

function getReadinessLevel(
  myCount: number,
  opponentCount: number,
): ReadinessLevel {
  if (myCount === 0 && opponentCount === 0) return 'empty'
  if (myCount === 6 && opponentCount === 6) return 'ready'
  return 'partial'
}

function getNextAction(
  readinessLevel: ReadinessLevel,
  myCount: number,
  opponentCount: number,
): string {
  if (readinessLevel === 'ready') {
    return 'Run Preview Coach, mark the threats you respect, then review one replay pattern.'
  }
  if (myCount === 0) {
    return 'Import your team from Calc so this workspace can rank threats and build drills.'
  }
  if (opponentCount === 0) {
    return 'Import or save the opposing team to unlock threat ranking and practice prompts.'
  }
  return 'Fill the missing team slots or continue with a partial scouting profile.'
}

function getSpeed(pokemon: SavedPokemon): number {
  return pokemon.finalStats?.speed ?? pokemon.baseStats?.speed ?? 0
}

function getOffensiveStat(pokemon: SavedPokemon): number {
  const stats = pokemon.finalStats ?? pokemon.baseStats
  if (stats === null) return 0
  return Math.max(stats.attack, stats.specialAttack)
}

function fastest(team: SavedPokemon[]): SavedPokemon | null {
  if (team.length === 0) return null
  return team.reduce((current, next) =>
    getSpeed(next) > getSpeed(current) ? next : current,
  )
}

function averageSpeed(team: SavedPokemon[]): number | null {
  if (team.length === 0) return null
  const total = team.reduce((sum, pokemon) => sum + getSpeed(pokemon), 0)
  return Math.round(total / team.length)
}

function getTypes(pokemon: SavedPokemon): string[] {
  return pokemon.types?.filter((type): type is string => type !== null) ?? []
}

function toThreat(pokemon: SavedPokemon, watched: Set<string>): PrepThreat {
  const id = pokemon.speciesId ?? pokemon.speciesName
  return {
    id,
    speciesName: pokemon.speciesName,
    spriteId: pokemon.spriteId,
    speed: getSpeed(pokemon),
    offensiveStat: getOffensiveStat(pokemon),
    types: getTypes(pokemon),
    watched: watched.has(id),
  }
}

function buildPracticePrompts({
  myTeam,
  opponentTeam,
  fastestMine,
  fastestOpponent,
  threats,
}: {
  myTeam: SavedPokemon[]
  opponentTeam: SavedPokemon[]
  fastestMine: SavedPokemon | null
  fastestOpponent: SavedPokemon | null
  threats: PrepThreat[]
}): PracticePrompt[] {
  if (myTeam.length === 0 || opponentTeam.length === 0) {
    return [
      {
        title: 'Build the scouting board',
        detail:
          'Save both teams from Calc to turn this page into matchup prep.',
        href: '/calc',
        actionLabel: 'Open Calc',
      },
    ]
  }

  const topThreat = threats[0]
  const prompts: PracticePrompt[] = []

  if (topThreat !== undefined) {
    prompts.push({
      title: `Can you safely answer ${topThreat.speciesName}?`,
      detail:
        'Open the calculator and check the clean-field roll before adding screens or weather.',
      href: '/calc',
      actionLabel: 'Open Calc',
    })
  }

  if (fastestMine !== null && fastestOpponent !== null) {
    prompts.push({
      title: `${fastestMine.speciesName} vs ${fastestOpponent.speciesName} speed check`,
      detail:
        'Validate Tailwind, Trick Room, and item assumptions before choosing leads.',
      href: '/speed',
      actionLabel: 'Open Speed',
    })
  }

  prompts.push({
    title: 'Choose the first two turns',
    detail:
      'Use Preview Coach to compare lead pairs into the saved opposing team.',
    href: '/preview',
    actionLabel: 'Preview Coach',
  })
  prompts.push({
    title: 'Review one replay pattern',
    detail:
      'After ladder games, paste a replay and save the turning-point note here.',
    href: '/replay',
    actionLabel: 'Replay Review',
  })

  return prompts
}
