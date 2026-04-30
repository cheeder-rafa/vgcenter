import type {
  DamageResult,
  MoveCategory,
  Spread,
  StatStages,
} from '../types/api'

type ReadoutContext = {
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
  result: DamageResult
  throughProtect?: boolean
  attackerMegaActive?: boolean
  defenderMegaActive?: boolean
  moveCategory?: MoveCategory | null
  attackerSp?: Spread | null
  defenderSp?: Spread | null
  attackerNatureId?: string | null
  defenderNatureId?: string | null
  attackerStages?: StatStages | null
  defenderStages?: StatStages | null
}

const EMPTY_SPREAD: Spread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

export function formatReadoutText({
  attackerName,
  defenderName,
  moveName,
  result,
  throughProtect = false,
  attackerMegaActive = false,
  defenderMegaActive = false,
  moveCategory,
  attackerSp,
  defenderSp,
  attackerNatureId,
  defenderNatureId,
  attackerStages,
  defenderStages,
}: ReadoutContext): string {
  const summary = formatSummaryText({
    attackerName,
    defenderName,
    moveName,
    result,
    throughProtect,
    attackerMegaActive,
    defenderMegaActive,
    moveCategory,
    attackerSp,
    defenderSp,
    attackerNatureId,
    defenderNatureId,
    attackerStages,
    defenderStages,
  })
  return `${summary}\n${formatRollsText(result)}`
}

export function formatSummaryText({
  attackerName,
  defenderName,
  moveName,
  result,
  throughProtect = false,
  attackerMegaActive = false,
  defenderMegaActive = false,
  moveCategory,
  attackerSp,
  defenderSp,
  attackerNatureId,
  defenderNatureId,
  attackerStages,
  defenderStages,
}: ReadoutContext): string {
  const attacker = formatSpeciesName(attackerName, attackerMegaActive)
  const defender = formatSpeciesName(defenderName, defenderMegaActive)
  const move = moveName ?? '—'
  const defenderSuffix = throughProtect ? ' through Protect' : ''
  const percentRange = `${result.minPct.toFixed(1)} - ${result.maxPct.toFixed(1)}%`
  const koChanceText = formatKoChance(result)
  const includeStatContext = shouldIncludeStatContext(
    moveCategory,
    attackerStages,
    defenderStages,
  )
  const attackerLead = includeStatContext
    ? formatAttackerLead(moveCategory, attackerSp, attackerNatureId, attacker)
    : attacker
  const defenderLead = includeStatContext
    ? formatDefenderLead(moveCategory, defenderSp, defenderNatureId, defender)
    : defender
  const attackerStageNote = includeStatContext
    ? formatStageNote(
        relevantStage(attackerStages, moveCategory ?? 'STATUS', 'attacker'),
        moveCategory === 'SPECIAL' ? 'SpA' : 'Atk',
      )
    : null
  const defenderStageNote = includeStatContext
    ? formatStageNote(
        relevantStage(defenderStages, moveCategory ?? 'STATUS', 'defender'),
        moveCategory === 'SPECIAL' ? 'SpD' : 'Def',
      )
    : null
  const attackerSegment = joinSegments(attackerLead, attackerStageNote)
  const defenderSegment = joinSegments(defenderLead, defenderStageNote)
  return `${attackerSegment} ${move} vs. ${defenderSegment}${defenderSuffix}: ${result.min}-${result.max} (${percentRange}) -- ${koChanceText}`
}

export function formatRollsText(result: DamageResult): string {
  return `(${result.rolls.join(', ')})`
}

function formatKoChance(result: DamageResult): string {
  const { description, probability, hits } = result.koChance

  if (
    description.includes('guaranteed') ||
    description.includes('chance to') ||
    description.includes('after ')
  ) {
    return description
  }

  if (probability > 0 && probability < 1) {
    return `${formatPercent(probability)} chance to ${formatHits(hits)}`
  }

  if (probability === 1) {
    return `guaranteed ${formatHits(hits)}`
  }

  return description
}

function formatPercent(probability: number): string {
  return `${(probability * 100).toFixed(2).replace(/\.00$/, '')}%`
}

function formatHits(hits: number): string {
  return hits === 1 ? 'OHKO' : `${hits}HKO`
}

function formatSpeciesName(name: string | null, megaActive: boolean): string {
  const resolvedName = name ?? '—'
  if (!megaActive || resolvedName === '—' || resolvedName.startsWith('Mega ')) {
    return resolvedName
  }
  return `Mega ${resolvedName}`
}

function shouldIncludeStatContext(
  category: MoveCategory | null | undefined,
  attackerStages: StatStages | null | undefined,
  defenderStages: StatStages | null | undefined,
): boolean {
  if (!category || category === 'STATUS') {
    return false
  }

  return (
    category === 'PHYSICAL' || category === 'SPECIAL' ||
    relevantStage(attackerStages, category, 'attacker') !== 0 ||
    relevantStage(defenderStages, category, 'defender') !== 0
  )
}

function formatAttackerLead(
  category: MoveCategory | null | undefined,
  spread: Spread | null | undefined,
  natureId: string | null | undefined,
  name: string,
): string {
  const resolvedSpread = spread ?? EMPTY_SPREAD
  if (category === 'SPECIAL') {
    return joinSegments(
      `${resolvedSpread.spa}${natureModifier(natureId, 'spa')} SpA`,
      name,
    )
  }

  return joinSegments(
    `${resolvedSpread.atk}${natureModifier(natureId, 'atk')} Atk`,
    name,
  )
}

function formatDefenderLead(
  category: MoveCategory | null | undefined,
  spread: Spread | null | undefined,
  natureId: string | null | undefined,
  name: string,
): string {
  const resolvedSpread = spread ?? EMPTY_SPREAD
  const defenseLabel = category === 'SPECIAL' ? 'SpD' : 'Def'
  const defenseValue =
    category === 'SPECIAL' ? resolvedSpread.spd : resolvedSpread.def

  return joinSegments(
    `${resolvedSpread.hp} HP / ${defenseValue}${natureModifier(natureId, category === 'SPECIAL' ? 'spd' : 'def')} ${defenseLabel}`,
    name,
  )
}

function relevantStage(
  stages: StatStages | null | undefined,
  category: MoveCategory,
  role: 'attacker' | 'defender',
): number {
  if (!stages || category === 'STATUS') {
    return 0
  }

  if (role === 'attacker') {
    return category === 'SPECIAL' ? stages.spa : stages.atk
  }

  return category === 'SPECIAL' ? stages.spd : stages.def
}

function formatStageNote(stage: number, statLabel: 'Atk' | 'Def' | 'SpA' | 'SpD'): string | null {
  if (stage === 0) {
    return null
  }
  return `(${stage > 0 ? '+' : ''}${stage} ${statLabel})`
}

function natureModifier(
  natureId: string | null | undefined,
  stat: 'atk' | 'def' | 'spa' | 'spd',
): string {
  switch ((natureId ?? '').toLowerCase()) {
    case 'adamant':
    case 'lonely':
    case 'brave':
    case 'naughty':
      return stat === 'atk' ? '+' : stat === 'spa' ? '-' : ''
    case 'bold':
    case 'impish':
    case 'lax':
    case 'relaxed':
      return stat === 'def' ? '+' : stat === 'atk' ? '-' : ''
    case 'modest':
    case 'mild':
    case 'rash':
    case 'quiet':
      return stat === 'spa' ? '+' : stat === 'atk' ? '-' : ''
    case 'calm':
    case 'careful':
    case 'gentle':
    case 'sassy':
      return stat === 'spd' ? '+' : stat === 'atk' ? '-' : ''
    default:
      return ''
  }
}

function joinSegments(...parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => part !== null && part !== undefined)
    .join(' ')
}
