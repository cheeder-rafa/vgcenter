import type { StatusCondition } from '../types/api'

export type SpeedCombatant = {
  name: string
  /** finalStats.speed — SP/nature already applied, no stage or item */
  baseSpeed: number
  /** Staged speed: baseSpeed adjusted for stat stage (computed before this component) */
  stagedSpeed: number
  itemId: string | null
  status: StatusCondition
}

type Props = {
  attacker: SpeedCombatant | null
  defender: SpeedCombatant | null
  trickRoom: boolean
}

function effectiveSpeed(combatant: SpeedCombatant): number {
  let spd = combatant.stagedSpeed
  if (combatant.itemId === 'choice-scarf') spd = Math.floor(spd * 1.5)
  if (combatant.status === 'PARALYSIS') spd = Math.floor(spd * 0.5)
  return spd
}

export function SpeedTierRibbon({ attacker, defender, trickRoom }: Props) {
  if (attacker === null || defender === null) {
    return (
      <div
        data-testid="speed-ribbon-empty"
        className="flex h-7 items-center justify-center rounded-sm border border-white/[0.07] bg-white/[0.03]"
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-white/20">
          Speed tier · select both Pokémon
        </span>
      </div>
    )
  }

  const atkEff = effectiveSpeed(attacker)
  const defEff = effectiveSpeed(defender)

  const isTie = atkEff === defEff
  // In Trick Room, the slower (lower effective speed) moves first
  const atkWins = trickRoom ? atkEff < defEff : atkEff > defEff
  const winner = isTie ? null : atkWins ? attacker : defender
  const loser = isTie ? null : atkWins ? defender : attacker

  const winnerColor = atkWins ? 'rgba(255,43,142,0.9)' : 'rgba(34,211,238,0.9)'
  const loserColor = 'rgba(255,255,255,0.28)'

  return (
    <div
      data-testid="speed-ribbon"
      className="flex items-center gap-2 rounded-sm border border-white/[0.08] bg-white/[0.03] px-3 py-1"
    >
      <span
        data-testid="speed-attacker-effective"
        className="w-[3ch] shrink-0 text-right font-mono text-[0.7rem] tabular-nums"
        style={{
          color: atkWins
            ? winnerColor
            : isTie
              ? 'rgba(255,255,255,0.45)'
              : loserColor,
        }}
      >
        {atkEff}
      </span>

      {/* Arrow / tie display */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        {isTie ? (
          <span
            data-testid="speed-tie"
            className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/35"
          >
            Speed tie
          </span>
        ) : (
          <>
            <span
              className="truncate font-mono text-[0.65rem]"
              style={{ color: loserColor }}
            >
              {loser?.name}
            </span>
            <svg
              aria-hidden="true"
              focusable="false"
              width="28"
              height="10"
              viewBox="0 0 28 10"
              fill="none"
              className="shrink-0"
            >
              <line
                x1="0"
                y1="5"
                x2="20"
                y2="5"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              <polyline
                points="16,1 22,5 16,9"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
            <span
              data-testid="speed-winner"
              className="truncate font-mono text-[0.65rem] font-semibold"
              style={{ color: winnerColor }}
            >
              {winner?.name}
            </span>
            <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/45">
              moves first
            </span>
          </>
        )}
        {trickRoom && (
          <span
            data-testid="trick-room-indicator"
            className="ml-1 shrink-0 rounded-[2px] bg-[rgba(167,139,250,0.18)] px-1 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[rgba(167,139,250,0.85)]"
          >
            TR
          </span>
        )}
      </div>

      <span
        data-testid="speed-defender-effective"
        className="w-[3ch] shrink-0 font-mono text-[0.7rem] tabular-nums"
        style={{
          color: !atkWins
            ? winnerColor
            : isTie
              ? 'rgba(255,255,255,0.45)'
              : loserColor,
        }}
      >
        {defEff}
      </span>
    </div>
  )
}
