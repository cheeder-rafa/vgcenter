type Props = {
  rolls: number[]
  defenderHp: number
  summaryTestId: string
  rollsTestId: string
  compact?: boolean
}

function countLethalRolls(rolls: number[], defenderHp: number) {
  return rolls.filter((roll) => roll >= defenderHp).length
}

export function RollSummary({
  rolls,
  defenderHp,
  summaryTestId,
  rollsTestId,
  compact = false,
}: Props) {
  const lethalCount = countLethalRolls(rolls, defenderHp)
  const safeCount = rolls.length - lethalCount

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <p
        className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/45"
        data-testid={summaryTestId}
      >
        {rolls.length} rolls · {lethalCount} lethal · {safeCount} safe
      </p>
      <p
        className={
          compact
            ? 'font-mono text-[0.65rem] leading-4 text-white/40'
            : 'font-mono text-[0.72rem] leading-5 text-white/55'
        }
        data-testid={rollsTestId}
      >
        ({rolls.join(', ')})
      </p>
    </div>
  )
}
