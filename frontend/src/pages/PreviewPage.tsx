import { useEffect, useMemo, useState } from 'react'

import { fetchMoves } from '../features/calculator/api/datasetApi'
import type { MoveDefinition } from '../features/calculator/types/api'
import { Bo3Notebook } from '../features/preview/components/Bo3Notebook'
import { LeadLab } from '../features/preview/components/LeadLab'
import { PlanCards } from '../features/preview/components/PlanCards'
import { useLeadEvaluation } from '../features/preview/hooks/useLeadEvaluation'
import { usePlanRecommendation } from '../features/preview/hooks/usePlanRecommendation'
import { useBo3Store } from '../features/preview/store/useBo3Store'
import type { LeadOption, PlanRecommendation } from '../features/preview/types'
import { useTeamsStore } from '../store/useTeamsStore'

export function PreviewPage() {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const [moves, setMoves] = useState<MoveDefinition[]>([])
  const [selectedLeadIds, setSelectedLeadIds] = useState<
    [string | null, string | null]
  >([null, null])
  const [winConditionIndex, setWinConditionIndex] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetchMoves('M-A')
      .then((nextMoves) => {
        if (active) setMoves(nextMoves)
      })
      .catch(() => {
        if (active) setMoves([])
      })
    return () => {
      active = false
    }
  }, [])

  const leadOptions = useMemo(
    () =>
      mine
        .filter(
          (pokemon): pokemon is NonNullable<typeof pokemon> => pokemon !== null,
        )
        .map(
          (pokemon): LeadOption => ({
            speciesId: pokemon.speciesId ?? pokemon.speciesName,
            speciesName: pokemon.speciesName,
            spriteId: pokemon.spriteId,
          }),
        ),
    [mine],
  )

  const myTeamNames = useMemo(
    () =>
      mine
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => p.speciesName),
    [mine],
  )

  const opponentCount = opponent.filter(Boolean).length
  const bo3Games = useBo3Store((state) => state.games)
  const addBo3Game = useBo3Store((state) => state.addGame)
  const clearBo3 = useBo3Store((state) => state.clear)

  const evaluation = useLeadEvaluation({ selectedLeadIds, moves })
  const plans = usePlanRecommendation({ moves, winConditionIndex })

  function handlePromote(plan: PlanRecommendation) {
    const leadIds = plan.leadIndices
      .map((idx) => mine[idx])
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => p.speciesId ?? p.speciesName)
    if (leadIds.length === 2) {
      setSelectedLeadIds([leadIds[0], leadIds[1]])
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="flex min-h-16 flex-col justify-center border-b border-white/10 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-arena-cyan">
            Regulation M-A
          </p>
          <h1 className="text-2xl font-black tracking-wide sm:text-3xl">
            Preview Coach
          </h1>
        </header>

        <section className="arena-panel arena-panel--plasma p-4">
          <div className="relative z-10 grid gap-4 sm:grid-cols-[minmax(200px,0.3fr)_minmax(0,1fr)] sm:items-start">
            <div>
              <p className="arena-label text-arena-plasma">Team plan</p>
              <h2 className="mt-1 text-xl font-black text-white">
                Recommendations
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Get bring-4 + lead candidates ranked by matchup coverage.
              </p>
              <button
                type="button"
                className="arena-button mt-4 h-10 w-full justify-center text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:px-6"
                disabled={plans.status === 'loading'}
                onClick={plans.recommend}
              >
                {plans.status === 'loading' ? 'Evaluating matchups…' : 'Get recommendations'}
              </button>
              {plans.status === 'error' ? (
                <p className="mt-2 rounded border border-arena-plasma/30 bg-arena-plasma/10 px-3 py-2 text-sm text-white/78">
                  {plans.error ?? 'Could not generate recommendations. Make sure both teams are saved with at least one damaging move each.'}
                </p>
              ) : null}
            </div>

            <div aria-live="polite" aria-atomic="false">
              {plans.result !== null ? (
                <PlanCards
                  result={plans.result}
                  myTeamNames={myTeamNames}
                  onPromote={handlePromote}
                  winConditionIndex={winConditionIndex}
                  onWinConditionChange={setWinConditionIndex}
                />
              ) : null}
            </div>
          </div>
        </section>

        <LeadLab
          selectedLeadIds={selectedLeadIds}
          onSelectedLeadIdsChange={setSelectedLeadIds}
          mine={leadOptions}
          opponentCount={opponentCount}
          result={evaluation.result}
          status={evaluation.status}
          error={evaluation.error}
          onEvaluate={evaluation.evaluate}
        />

        <Bo3Notebook
          games={bo3Games}
          onAddGame={addBo3Game}
          onClear={clearBo3}
        />
      </div>
    </main>
  )
}
