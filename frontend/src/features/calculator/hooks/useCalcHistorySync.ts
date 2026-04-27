import { useEffect, useRef } from 'react'

import { useCalcHistoryStore } from '../store/useCalcHistoryStore'
import { useCalculatorStore } from '../store/useCalculatorStore'

export function useCalcHistorySync() {
  const lastSnapshotKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const unsubscribe = useCalculatorStore.subscribe(
      (s) => s.resultsStatus,
      (status) => {
        if (status !== 'success') return

        const state = useCalculatorStore.getState()
        const { attacker, defender } = state

        if (attacker.speciesId === null || defender.speciesId === null) return

        // Deduplicate: only push if inputs changed since last push
        const snapshotKey = JSON.stringify({
          atk: attacker.speciesId,
          def: defender.speciesId,
          sp: attacker.sp,
          spDef: defender.sp,
          nature: attacker.natureId,
          natureDef: defender.natureId,
          moves: attacker.moves.map((m) => m.moveId),
          movesDef: defender.moves.map((m) => m.moveId),
          field: state.field,
          attackerSide: state.attackerSide,
          defenderSide: state.defenderSide,
          criticalHit: state.criticalHit,
          targets: state.targets,
        })

        if (snapshotKey === lastSnapshotKeyRef.current) return
        lastSnapshotKeyRef.current = snapshotKey

        const topAttackerResult = state.results.attackerMoves.find(
          (r) => r !== null,
        )

        const entry = {
          id: Date.now(),
          timestamp: Date.now(),
          attackerSpeciesId: attacker.speciesId,
          defenderSpeciesId: defender.speciesId,
          attackerName: null,
          defenderName: null,
          snapshot: {
            attacker,
            defender,
            field: state.field,
            attackerSide: state.attackerSide,
            defenderSide: state.defenderSide,
            criticalHit: state.criticalHit,
            targets: state.targets,
          },
          summary: {
            topMoveId:
              topAttackerResult !== null && topAttackerResult !== undefined
                ? (attacker.moves.find(
                    (_, i) =>
                      state.results.attackerMoves[i] === topAttackerResult,
                  )?.moveId ?? null)
                : null,
            topMoveMaxPercent: topAttackerResult?.maxPct ?? null,
          },
        }

        useCalcHistoryStore.getState().push(entry)
      },
    )

    return unsubscribe
  }, [])
}
