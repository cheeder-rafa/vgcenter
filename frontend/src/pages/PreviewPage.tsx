import { useEffect, useMemo, useState } from 'react'

import { fetchMoves } from '../features/calculator/api/datasetApi'
import type { MoveDefinition } from '../features/calculator/types/api'
import { LeadLab } from '../features/preview/components/LeadLab'
import { useLeadEvaluation } from '../features/preview/hooks/useLeadEvaluation'
import type { LeadOption } from '../features/preview/types'
import { useTeamsStore } from '../store/useTeamsStore'

export function PreviewPage() {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const [moves, setMoves] = useState<MoveDefinition[]>([])
  const [selectedLeadIds, setSelectedLeadIds] = useState<
    [string | null, string | null]
  >([null, null])

  useEffect(() => {
    let active = true
    fetchMoves('M-A')
      .then((nextMoves) => {
        if (active) {
          setMoves(nextMoves)
        }
      })
      .catch(() => {
        if (active) {
          setMoves([])
        }
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
  const opponentCount = opponent.filter(Boolean).length
  const evaluation = useLeadEvaluation({ selectedLeadIds, moves })

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
      </div>
    </main>
  )
}
