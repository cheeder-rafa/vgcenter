import { useState } from 'react'

import {
  type DefenseSpreadCandidate,
  type OptimizeDefenseRequest,
  optimizeDefense,
  spreadToApiSp,
} from '../api/optimizerApi'
import { useCalculatorStore } from '../store/useCalculatorStore'

type Goal = OptimizeDefenseRequest['goal']

const GOAL_LABELS: Record<Goal, string> = {
  ALWAYS_SURVIVE: 'Always survive (0% KO)',
  SURVIVE_87_5: 'Survive 87.5%+ (≤12.5% KO)',
  SURVIVE_FULL_HP: 'Survive from full HP',
}

const DEFAULT_FIELD: OptimizeDefenseRequest['field'] = {
  weather: 'CLEAR',
  terrain: 'NONE',
  room: 'NONE',
}

const NO_SIDE: OptimizeDefenseRequest['attackerSide'] = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

export function EvOptimizerPanel() {
  const defender = useCalculatorStore((s) => s.defender)
  const attacker = useCalculatorStore((s) => s.attacker)
  const field = useCalculatorStore((s) => s.field)
  const attackerSide = useCalculatorStore((s) => s.attackerSide)
  const defenderSide = useCalculatorStore((s) => s.defenderSide)
  const applyDefensiveSpread = useCalculatorStore((s) => s.applyDefensiveSpread)

  const [moveId, setMoveId] = useState('')
  const [goal, setGoal] = useState<Goal>('ALWAYS_SURVIVE')
  const [candidates, setCandidates] = useState<DefenseSpreadCandidate[] | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const attackerMoves = attacker.moves
    .map((s) => s.moveId)
    .filter((id): id is string => id !== null)

  const canOptimize =
    moveId.length > 0 && !!defender.speciesId && !!attacker.speciesId

  async function handleOptimize() {
    if (!canOptimize) return
    setLoading(true)
    setError(null)
    setCandidates(null)
    try {
      const request: OptimizeDefenseRequest = {
        regulation: 'M-A',
        defenderSpeciesId: defender.speciesId!,
        defenderNatureId: defender.natureId.toUpperCase(),
        defenderAbilityId: defender.abilityId,
        defenderItemId: defender.itemId,
        attackerSpeciesId: attacker.speciesId!,
        attackerNatureId: attacker.natureId.toUpperCase(),
        attackerSp: spreadToApiSp(attacker.sp),
        attackerAbilityId: attacker.abilityId,
        attackerItemId: attacker.itemId,
        moveId,
        goal,
        field: field ?? DEFAULT_FIELD,
        attackerSide: attackerSide ?? NO_SIDE,
        defenderSide: defenderSide ?? NO_SIDE,
        criticalHit: false,
      }
      const result = await optimizeDefense(request)
      setCandidates(result.candidates)
    } catch {
      setError('Optimization failed. Check species and move IDs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className="rounded-sm border border-white/10 bg-arena-void/60 p-4"
      aria-label="EV Optimizer"
    >
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-arena-plasma">
        EV Optimizer
      </h2>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <select
          value={moveId}
          onChange={(e) => setMoveId(e.target.value)}
          aria-label="Move"
          disabled={attackerMoves.length === 0}
          className="arena-input w-full font-mono text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {attackerMoves.length === 0
              ? 'Select moves on the attacker first'
              : 'Pick a move…'}
          </option>
          {attackerMoves.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal)}
          aria-label="Survival goal"
          className="arena-input font-mono text-xs"
        >
          {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
            <option key={g} value={g}>
              {GOAL_LABELS[g]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleOptimize}
          disabled={!canOptimize || loading}
          aria-label="Optimize"
          className="arena-chip cursor-pointer px-4 text-arena-cyan transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Working…' : 'Optimize'}
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      {candidates !== null && candidates.length === 0 && (
        <p className="text-xs text-white/40">
          No spread found — no HP/Def/SpD allocation up to 32 SP meets the goal
          against this attacker.
        </p>
      )}

      {candidates !== null && candidates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-1 pr-4">HP SP</th>
                <th className="pb-1 pr-4">Def SP</th>
                <th className="pb-1 pr-4">SpD SP</th>
                <th className="pb-1 pr-4">Total</th>
                <th className="pb-1 pr-4">Remaining</th>
                <th className="pb-1 pr-4">Min%</th>
                <th className="pb-1 pr-4">Max%</th>
                <th className="pb-1 pr-4">KO%</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr key={i} className="border-b border-white/5 text-white/75">
                  <td className="py-1 pr-4">{c.spHp}</td>
                  <td className="py-1 pr-4">{c.spDef}</td>
                  <td className="py-1 pr-4">{c.spSpd}</td>
                  <td className="py-1 pr-4 text-arena-cyan">{c.totalSp} SP</td>
                  <td className="py-1 pr-4 text-white/40">{c.remainingSp}</td>
                  <td className="py-1 pr-4">{c.minDamagePct.toFixed(1)}%</td>
                  <td className="py-1 pr-4">{c.maxDamagePct.toFixed(1)}%</td>
                  <td className="py-1 pr-4 text-white/50">
                    {(c.koChanceProbability * 100).toFixed(1)}%
                  </td>
                  <td className="py-1">
                    <button
                      type="button"
                      aria-label="Apply"
                      onClick={() =>
                        applyDefensiveSpread(c.spHp, c.spDef, c.spSpd)
                      }
                      className="arena-chip cursor-pointer text-arena-plasma transition hover:text-white"
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
