import type { CombatantBuild, FieldRequest, SideConditions } from '../../calculator/types/api'
import type { MatrixDirection, ThreatMatrixResponse } from '../types'
import { MatrixCell } from './MatrixCell'

type Props = {
  matrix: ThreatMatrixResponse
  labelsA: string[]
  labelsB: string[]
  direction: MatrixDirection
  onDirectionChange: (d: MatrixDirection) => void
  buildsA?: CombatantBuild[]
  buildsB?: CombatantBuild[]
  regulation: string
  field: FieldRequest
  sideA: SideConditions
  sideB: SideConditions
}

const EMPTY_BUILD: CombatantBuild = {
  speciesId: null,
  natureId: 'serious',
  sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  abilityId: null,
  itemId: null,
  status: 'NONE',
  megaActive: false,
  megaFormId: null,
  moves: [{ moveId: null }, { moveId: null }, { moveId: null }, { moveId: null }],
  baseStats: null,
  finalStats: null,
  types: null,
  grounded: true,
  currentHp: 0,
}

export function ThreatMatrix({
  matrix,
  labelsA,
  labelsB,
  direction,
  onDirectionChange,
  buildsA,
  buildsB,
  regulation,
  field,
  sideA,
  sideB,
}: Props) {
  const grid = direction === 'deal' ? matrix.deal : matrix.take

  return (
    <div className="space-y-4">
      {/* Direction toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDirectionChange('deal')}
          className={[
            'arena-chip transition-colors',
            direction === 'deal'
              ? 'bg-arena-plasma/20 text-arena-plasma'
              : 'text-white/40 hover:text-white/70',
          ].join(' ')}
        >
          Damage I Deal
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange('take')}
          className={[
            'arena-chip transition-colors',
            direction === 'take'
              ? 'bg-arena-plasma/20 text-arena-plasma'
              : 'text-white/40 hover:text-white/70',
          ].join(' ')}
        >
          Damage I Take
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-20" />
              {labelsB.map((label) => (
                <th
                  key={label}
                  className="min-w-[5.5rem] pb-1 font-body text-[0.65rem] font-medium uppercase tracking-wider text-white/50"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, i) => {
              return (
                <tr key={labelsA[i] ?? i}>
                  <td className="pr-2 font-body text-[0.65rem] font-medium uppercase tracking-wider text-white/50">
                    {labelsA[i]}
                  </td>
                  {row.map((cell, j) => {
                    const attackerBuild =
                      direction === 'deal'
                        ? (buildsA?.[i] ?? EMPTY_BUILD)
                        : (buildsB?.[j] ?? EMPTY_BUILD)
                    const defenderBuild =
                      direction === 'deal'
                        ? (buildsB?.[j] ?? EMPTY_BUILD)
                        : (buildsA?.[i] ?? EMPTY_BUILD)
                    const attackerSide = direction === 'deal' ? sideA : sideB
                    const defenderSide = direction === 'deal' ? sideB : sideA
                    return (
                      <td key={j}>
                        <MatrixCell
                          cell={cell}
                          attacker={attackerBuild}
                          defender={defenderBuild}
                          regulation={regulation}
                          field={field}
                          sideA={attackerSide}
                          sideB={defenderSide}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <span className="font-body text-[0.6rem] uppercase tracking-wider text-white/30">
          Color scale
        </span>
        {(
          [
            ['dim', '0%'],
            ['low', '<25%'],
            ['mid', '25–49%'],
            ['high', '50–74%'],
            ['ko', '75–99%'],
            ['ohko', '100%+'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-3 rounded-sm ${
                key === 'dim'
                  ? 'bg-white/5'
                  : key === 'low'
                    ? 'bg-arena-cyan/10'
                    : key === 'mid'
                      ? 'bg-arena-plasma/15'
                      : key === 'high'
                        ? 'bg-arena-plasma/30'
                        : key === 'ko'
                          ? 'bg-arena-plasma/50'
                          : 'bg-arena-ember/65 ring-1 ring-arena-ember/60'
              }`}
            />
            <span className="font-body text-[0.6rem] text-white/40">{label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
