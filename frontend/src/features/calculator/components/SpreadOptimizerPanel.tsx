import { useState } from 'react'

import {
  type DefenseSpreadCandidate,
  type OptimizeDefenseRequest,
  optimizeDefense,
  spreadToApiSp,
} from '../api/optimizerApi'
import { computeBattleStats } from '../lib/computeBattleStats'
import { useCalculatorStore } from '../store/useCalculatorStore'
import type { NatureResponse } from '../types/api'

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

type Props = { natures: NatureResponse[] }

export function SpreadOptimizerPanel({ natures }: Props) {
  const defender = useCalculatorStore((s) => s.defender)
  const attacker = useCalculatorStore((s) => s.attacker)
  const field = useCalculatorStore((s) => s.field)
  const attackerSide = useCalculatorStore((s) => s.attackerSide)
  const defenderSide = useCalculatorStore((s) => s.defenderSide)
  const setDefender = useCalculatorStore((s) => s.setDefender)

  const [moveId, setMoveId] = useState('')
  const [goal, setGoal] = useState<Goal>('ALWAYS_SURVIVE')
  const [candidates, setCandidates] = useState<DefenseSpreadCandidate[] | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canOptimize =
    moveId.trim().length > 0 && !!defender.speciesId && !!attacker.speciesId

  const hasNatureSuggestion =
    candidates !== null && candidates.some((c) => c.suggestedNatureId !== null)

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
        moveId: moveId.trim(),
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

  function handleApply(c: DefenseSpreadCandidate) {
    const nextSp = { ...defender.sp, hp: c.spHp, def: c.spDef, spd: c.spSpd }
    const natureId = c.suggestedNatureId
      ? c.suggestedNatureId.toLowerCase()
      : defender.natureId
    const natureObj = natures.find((n) => n.id === natureId) ?? null
    const finalStats =
      defender.baseStats !== null
        ? computeBattleStats(defender.baseStats, nextSp, natureObj)
        : null
    setDefender({
      sp: nextSp,
      ...(c.suggestedNatureId ? { natureId } : {}),
      finalStats,
    })
  }

  return (
    <section
      className="rounded-sm border border-white/10 bg-arena-void/60 p-4"
      aria-label="Spread Optimizer"
    >
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-arena-plasma">
        Spread Optimizer
      </h2>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          value={moveId}
          onChange={(e) => setMoveId(e.target.value)}
          placeholder="Move ID (e.g. earthquake)"
          aria-label="Move ID"
          className="arena-input w-full font-mono text-xs"
        />
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
          No spread found — no HP/Def/SpD allocation up to 66 SP total / 32 SP
          per stat meets the goal against this attacker.
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
                {hasNatureSuggestion && <th className="pb-1 pr-4">Nature</th>}
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
                  {hasNatureSuggestion && (
                    <td className="py-1 pr-4 text-arena-plasma">
                      {c.suggestedNatureId
                        ? c.suggestedNatureId.charAt(0).toUpperCase() +
                          c.suggestedNatureId.slice(1).toLowerCase()
                        : '—'}
                    </td>
                  )}
                  <td className="py-1">
                    <button
                      type="button"
                      aria-label={
                        c.suggestedNatureId ? 'Apply with nature' : 'Apply'
                      }
                      onClick={() => handleApply(c)}
                      className="arena-chip cursor-pointer text-arena-plasma transition hover:text-white"
                    >
                      {c.suggestedNatureId ? 'Apply + Nature' : 'Apply'}
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
