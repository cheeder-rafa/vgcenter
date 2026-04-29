import { useState } from 'react'

import {
  type DefenseSpreadCandidate,
  type OptimizeAgainstThreatsGoal,
  type OptimizeAgainstThreatsResponse,
  type OptimizeDefenseRequest,
  optimizeAgainstThreats,
  optimizeDefense,
  spreadToApiSp,
} from '../api/optimizerApi'
import { computeBattleStats } from '../lib/computeBattleStats'
import { useCalculatorStore } from '../store/useCalculatorStore'
import {
  EMPTY_PINNED_THREATS,
  usePinnedThreatsStore,
} from '../store/usePinnedThreatsStore'
import type { NatureResponse } from '../types/api'

type Goal = OptimizeDefenseRequest['goal']
type Tab = 'single' | 'multi'

const GOAL_LABELS: Record<Goal, string> = {
  ALWAYS_SURVIVE: 'Always survive (0% KO)',
  SURVIVE_87_5: 'Survive 87.5%+ (≤12.5% KO)',
  SURVIVE_FULL_HP: 'Survive from full HP',
}

const MULTI_GOAL_LABELS: Record<OptimizeAgainstThreatsGoal, string> = {
  EXPECTED_DAMAGE_SUM: 'Lowest expected damage',
  WORST_CASE_KO: 'Lowest worst-case KO',
  SURVIVE_ALL: 'Survive all threats',
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
  const setAttacker = useCalculatorStore((s) => s.setAttacker)

  const moveCatalog = useCalculatorStore((s) => s.moveCatalog)
  const threats = usePinnedThreatsStore(
    (s) => s.threats ?? EMPTY_PINNED_THREATS,
  )
  const pinThreat = usePinnedThreatsStore((s) => s.pin)
  const unpinThreat = usePinnedThreatsStore((s) => s.unpin)
  const updateThreatMove = usePinnedThreatsStore((s) => s.updateMove)
  const updateThreatAbility = usePinnedThreatsStore((s) => s.updateAbility)
  const updateThreatItem = usePinnedThreatsStore((s) => s.updateItem)

  const attackerMoves = attacker.moves
    .map((s) => s.moveId)
    .filter((id): id is string => id !== null)

  const [tab, setTab] = useState<Tab>('single')
  const [moveId, setMoveId] = useState('')
  const [goal, setGoal] = useState<Goal>('ALWAYS_SURVIVE')
  const [multiGoal, setMultiGoal] = useState<OptimizeAgainstThreatsGoal>(
    'EXPECTED_DAMAGE_SUM',
  )

  // If attacker changes and drops the previously selected move, fall back to empty
  const effectiveMoveId = attackerMoves.includes(moveId) ? moveId : ''
  const [candidates, setCandidates] = useState<DefenseSpreadCandidate[] | null>(
    null,
  )
  const [multiResult, setMultiResult] =
    useState<OptimizeAgainstThreatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canOptimize =
    effectiveMoveId.length > 0 && !!defender.speciesId && !!attacker.speciesId
  const firstThreatMoveId =
    defender.moves.find((move) => move.moveId !== null)?.moveId ?? null
  const canPinThreat =
    !!defender.speciesId && !!firstThreatMoveId && threats.length < 4
  const canOptimizeThreats = !!attacker.speciesId && threats.length > 0

  const hasNatureSuggestion =
    (candidates !== null &&
      candidates.some((c) => c.suggestedNatureId !== null)) ||
    multiResult?.best?.suggestedNatureId !== null

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
        moveId: effectiveMoveId,
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

  async function handleOptimizeThreats() {
    if (!canOptimizeThreats) return
    setLoading(true)
    setError(null)
    setMultiResult(null)
    try {
      const result = await optimizeAgainstThreats({
        regulation: 'M-A',
        defender: {
          speciesId: attacker.speciesId!,
          natureId: attacker.natureId.toUpperCase(),
          abilityId: attacker.abilityId,
          itemId: attacker.itemId,
          megaActive: attacker.megaActive,
          megaFormId: attacker.megaFormId,
        },
        threats: threats.map((threat) => ({
          attackerSpeciesId: threat.build.speciesId!,
          attackerNatureId: threat.build.natureId.toUpperCase(),
          attackerSp: spreadToApiSp(threat.build.sp),
          attackerAbilityId: threat.build.abilityId,
          attackerItemId: threat.build.itemId,
          moveId: threat.moveId,
          attackerMegaActive: threat.build.megaActive,
          attackerMegaFormId: threat.build.megaFormId,
        })),
        goal: multiGoal,
        field: field ?? DEFAULT_FIELD,
        attackerSide: defenderSide ?? NO_SIDE,
        defenderSide: attackerSide ?? NO_SIDE,
        criticalHit: false,
      })
      setMultiResult(result)
    } catch {
      setError('Multi-threat optimization failed. Check pinned threats.')
    } finally {
      setLoading(false)
    }
  }

  function handlePinThreat() {
    if (!canPinThreat || !firstThreatMoveId || !defender.speciesId) return
    pinThreat({
      id: `${defender.speciesId}-${firstThreatMoveId}-${Date.now()}`,
      label: defender.speciesId,
      build: {
        ...defender,
        sp: { ...defender.sp },
        stages: { ...defender.stages },
        moves: defender.moves.map((move) => ({
          ...move,
        })) as typeof defender.moves,
        baseStats: defender.baseStats ? { ...defender.baseStats } : null,
        finalStats: defender.finalStats ? { ...defender.finalStats } : null,
        types: defender.types
          ? ([...defender.types] as typeof defender.types)
          : null,
      },
      moveId: firstThreatMoveId,
    })
    setTab('multi')
  }

  function applyCandidateToDefender(c: DefenseSpreadCandidate) {
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

  function applyCandidateToAttacker(c: DefenseSpreadCandidate) {
    const nextSp = { ...attacker.sp, hp: c.spHp, def: c.spDef, spd: c.spSpd }
    const natureId = c.suggestedNatureId
      ? c.suggestedNatureId.toLowerCase()
      : attacker.natureId
    const natureObj = natures.find((n) => n.id === natureId) ?? null
    const finalStats =
      attacker.baseStats !== null
        ? computeBattleStats(attacker.baseStats, nextSp, natureObj)
        : null
    setAttacker({
      sp: nextSp,
      ...(c.suggestedNatureId ? { natureId } : {}),
      finalStats,
    })
  }

  function formatNatureName(natureId: string | null): string {
    if (natureId === null) return '—'
    const key = natureId.toLowerCase()
    const found = natures.find((nature) => nature.id === key)
    return found?.name ?? key.charAt(0).toUpperCase() + key.slice(1)
  }

  function formatDistribution(
    candidate: DefenseSpreadCandidate,
    natureId: string,
  ): string {
    const nature = natures.find((entry) => entry.id === natureId)
    const boosted = nature?.increasedStat ?? null
    const defense = `${candidate.spDef}${boosted === 'DEFENSE' ? '+' : ''} Def`
    const specialDefense = `${candidate.spSpd}${boosted === 'SPECIAL_DEFENSE' ? '+' : ''} SpD`
    return `${candidate.spHp} HP / ${defense} / ${specialDefense}`
  }

  return (
    <section
      className="rounded-sm border border-white/10 bg-arena-void/60 p-4"
      aria-label="Spread Optimizer"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-arena-plasma">
          Spread Optimizer
        </h2>
        <div
          role="tablist"
          aria-label="Optimizer mode"
          className="rounded border border-white/10 bg-white/[0.03] p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'single'}
            onClick={() => setTab('single')}
            className={`px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan ${tab === 'single' ? 'bg-arena-cyan/15 text-arena-cyan' : 'text-white/35 hover:text-white/70'}`}
          >
            Single
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'multi'}
            onClick={() => setTab('multi')}
            className={`px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan ${tab === 'multi' ? 'bg-arena-cyan/15 text-arena-cyan' : 'text-white/35 hover:text-white/70'}`}
          >
            Multi-threat
          </button>
        </div>
      </div>

      {tab === 'single' ? (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <select
            value={effectiveMoveId}
            onChange={(e) => setMoveId(e.target.value)}
            aria-label="Move ID"
            name="single-threat-move"
            disabled={attackerMoves.length === 0}
            className="arena-input w-full font-mono text-xs"
          >
            <option value="">
              {attackerMoves.length === 0
                ? 'No moves set on attacker'
                : 'Select move…'}
            </option>
            {attackerMoves.map((id) => (
              <option key={id} value={id}>
                {moveCatalog.find((m) => m.id === id)?.name ?? id}
              </option>
            ))}
          </select>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            aria-label="Survival goal"
            name="single-threat-goal"
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
            className="arena-chip cursor-pointer px-4 text-arena-cyan transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
          >
            {loading ? 'Working…' : 'Optimize'}
          </button>
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePinThreat}
              disabled={!canPinThreat}
              className="arena-chip cursor-pointer text-arena-cyan transition hover:bg-arena-cyan/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            >
              + Pin Side B as threat
            </button>
            <select
              value={multiGoal}
              onChange={(e) =>
                setMultiGoal(e.target.value as OptimizeAgainstThreatsGoal)
              }
              aria-label="Multi-threat goal"
              name="multi-threat-goal"
              className="arena-input font-mono text-xs"
            >
              {(
                Object.keys(MULTI_GOAL_LABELS) as OptimizeAgainstThreatsGoal[]
              ).map((g) => (
                <option key={g} value={g}>
                  {MULTI_GOAL_LABELS[g]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleOptimizeThreats}
              disabled={!canOptimizeThreats || loading}
              className="arena-chip cursor-pointer px-4 text-arena-plasma transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            >
              {loading ? 'Working…' : 'Optimize threats'}
            </button>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/30">
              {threats.length} / 4 pinned
            </span>
          </div>
          {threats.length === 0 ? (
            <p className="text-xs text-white/40">
              Pin Side B threats to optimize one Side A spread against a threat
              list.
            </p>
          ) : (
            <ul role="list" className="grid gap-2">
              {threats.map((threat) => (
                <li
                  key={threat.id}
                  className="grid gap-2 rounded border border-white/10 bg-white/[0.03] p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-semibold text-white/85">
                      {threat.label}
                    </p>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/30">
                      {moveCatalog.find((m) => m.id === threat.moveId)?.name ??
                        threat.moveId}
                    </p>
                  </div>
                  <select
                    value={threat.moveId}
                    onChange={(e) =>
                      updateThreatMove(threat.id, e.target.value)
                    }
                    aria-label={`Move for ${threat.label}`}
                    name={`threat-${threat.id}-move`}
                    className="arena-input font-mono text-xs"
                  >
                    {threat.build.moves
                      .map((slot) => slot.moveId)
                      .filter((id): id is string => id !== null)
                      .map((id) => (
                        <option key={id} value={id}>
                          {moveCatalog.find((m) => m.id === id)?.name ?? id}
                        </option>
                      ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      aria-label={`Ability for ${threat.label}`}
                      name={`threat-${threat.id}-ability`}
                      autoComplete="off"
                      spellCheck={false}
                      value={threat.build.abilityId ?? ''}
                      onChange={(e) =>
                        updateThreatAbility(
                          threat.id,
                          e.target.value.trim() || null,
                        )
                      }
                      className="arena-input font-mono text-xs"
                      placeholder="ability…"
                    />
                    <input
                      aria-label={`Item for ${threat.label}`}
                      name={`threat-${threat.id}-item`}
                      autoComplete="off"
                      spellCheck={false}
                      value={threat.build.itemId ?? ''}
                      onChange={(e) =>
                        updateThreatItem(
                          threat.id,
                          e.target.value.trim() || null,
                        )
                      }
                      className="arena-input font-mono text-xs"
                      placeholder="item…"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => unpinThreat(threat.id)}
                    aria-label={`Remove ${threat.label}`}
                    className="arena-chip cursor-pointer text-white/40 transition hover:text-arena-plasma focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      {tab === 'single' && candidates !== null && candidates.length === 0 && (
        <p className="text-xs text-white/40">
          No spread found — no HP/Def/SpD allocation up to 66 SP total / 32 SP
          per stat meets the goal against this attacker.
        </p>
      )}

      {tab === 'single' && candidates !== null && candidates.length > 0 && (
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
                      onClick={() => applyCandidateToDefender(c)}
                      className="arena-chip cursor-pointer text-arena-plasma transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
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
      {tab === 'multi' && multiResult !== null && multiResult.best === null && (
        <p className="text-xs text-white/40">
          No spread found for those threats and objective.
        </p>
      )}
      {tab === 'multi' && multiResult?.best && (
        <div className="mt-3 flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <tbody>
                {multiResult.candidates.slice(0, 3).map((candidate, index) => {
                  const natureId = (
                    candidate.suggestedNatureId ?? attacker.natureId
                  ).toLowerCase()
                  return (
                    <tr
                      key={`${candidate.spHp}-${candidate.spDef}-${candidate.spSpd}-${candidate.suggestedNatureId ?? 'none'}`}
                      className="border-b border-white/5 text-white/75"
                    >
                      <td className="py-1 pr-4 text-arena-plasma">
                        {formatNatureName(
                          candidate.suggestedNatureId ?? attacker.natureId,
                        )}
                      </td>
                      <td className="py-1 pr-4">
                        {formatDistribution(candidate, natureId)}
                      </td>
                      <td className="py-1 pr-4 text-arena-cyan">
                        {candidate.totalSp} SP
                      </td>
                      <td className="py-1 pr-4 text-white/50">
                        {candidate.remainingSp} left
                      </td>
                      <td className="py-1 pr-4 text-white/45">
                        {candidate.minDamagePct.toFixed(1)}–
                        {candidate.maxDamagePct.toFixed(1)}%
                      </td>
                      <td className="py-1">
                        <button
                          type="button"
                          onClick={() => applyCandidateToAttacker(candidate)}
                          className="arena-chip cursor-pointer text-arena-plasma transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
                        >
                          {index === 0 ? 'Apply (Recommended)' : 'Apply'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded border border-white/10 bg-white/[0.025] p-3">
            <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Per-threat damage
            </h3>
            <table className="w-full text-left font-mono text-xs">
              <tbody>
                {multiResult.threats.map((threat) => (
                  <tr
                    key={`${threat.attackerSpeciesId}-${threat.moveId}`}
                    className="border-b border-white/5 text-white/70"
                  >
                    <td className="py-1 pr-4">{threat.attackerSpeciesId}</td>
                    <td className="py-1 pr-4">
                      {moveCatalog.find((m) => m.id === threat.moveId)?.name ??
                        threat.moveId}
                    </td>
                    <td className="py-1 pr-4 text-arena-cyan">
                      {threat.expectedDamagePct.toFixed(1)}%
                    </td>
                    <td className="py-1 text-white/45">
                      {threat.koChanceDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
