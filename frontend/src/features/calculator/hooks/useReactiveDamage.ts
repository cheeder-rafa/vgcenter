import { useEffect, useRef } from 'react'

import { calculateDamage } from '../api/damageApi'
import { buildStats } from '../api/datasetApi'
import {
  selectDamageRequestFor,
  useCalculatorStore,
  type CalculatorSide,
} from '../store/useCalculatorStore'
import type { CombatantBuild, DamageResult, PokedexEntry } from '../types/api'

const RECOMPUTE_DEBOUNCE_MS = 200

type ReactiveCombatantInputs = Pick<
  CombatantBuild,
  | 'speciesId'
  | 'natureId'
  | 'sp'
  | 'abilityId'
  | 'itemId'
  | 'status'
  | 'megaActive'
  | 'moves'
  | 'grounded'
  | 'fullHp'
>

type SettledDamage = {
  side: CalculatorSide
  moveIndex: number
  result: DamageResult
}

function selectReactiveInputs(
  state: ReturnType<typeof useCalculatorStore.getState>,
) {
  return JSON.stringify({
    regulation: state.regulation,
    moveCatalogVersion: state.moveCatalogVersion,
    attacker: selectCombatantInputs(state.attacker),
    defender: selectCombatantInputs(state.defender),
    field: state.field,
    attackerSide: state.attackerSide,
    defenderSide: state.defenderSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  })
}

function selectCombatantInputs(
  combatant: CombatantBuild,
): ReactiveCombatantInputs {
  return {
    speciesId: combatant.speciesId,
    natureId: combatant.natureId,
    sp: combatant.sp,
    abilityId: combatant.abilityId,
    itemId: combatant.itemId,
    status: combatant.status,
    megaActive: combatant.megaActive,
    moves: combatant.moves,
    grounded: combatant.grounded,
    fullHp: combatant.fullHp,
  }
}

function createBuildKey(combatant: CombatantBuild): string {
  return JSON.stringify({
    speciesId: combatant.speciesId,
    natureId: combatant.natureId,
    megaActive: combatant.megaActive,
    sp: combatant.sp,
  })
}

function createEmptyResults() {
  return {
    attackerMoves: [null, null, null, null] as [
      DamageResult | null,
      DamageResult | null,
      DamageResult | null,
      DamageResult | null,
    ],
    defenderMoves: [null, null, null, null] as [
      DamageResult | null,
      DamageResult | null,
      DamageResult | null,
      DamageResult | null,
    ],
  }
}

function resolveCombatantTypes(
  combatant: CombatantBuild,
  pokedex: PokedexEntry[],
): CombatantBuild['types'] {
  if (combatant.speciesId === null) {
    return combatant.types
  }

  const entry = pokedex.find(
    (candidate) => candidate.id === combatant.speciesId,
  )
  if (!entry) {
    return combatant.types
  }

  if (combatant.megaActive && entry.megaForms.length > 0) {
    const [primary, secondary] = entry.megaForms[0].types
    return [primary, secondary ?? null]
  }

  const [primary, secondary] = entry.types
  return [primary, secondary ?? null]
}

export function useReactiveDamage(pokedex: PokedexEntry[]) {
  const pokedexRef = useRef(pokedex)
  const requestIdRef = useRef(0)
  const buildKeyRef = useRef<Record<CalculatorSide, string | null>>({
    attacker: null,
    defender: null,
  })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    pokedexRef.current = pokedex
  }, [pokedex])

  useEffect(() => {
    const recompute = async (requestId: number) => {
      const store = useCalculatorStore.getState()

      if (
        store.attacker.speciesId === null ||
        store.defender.speciesId === null
      ) {
        store.clearResults()
        store.setResultsStatus('idle')
        return
      }

      store.setResultsStatus('loading')

      try {
        for (const side of ['attacker', 'defender'] as const) {
          const combatant = useCalculatorStore.getState()[side]
          const currentBuildKey = createBuildKey(combatant)
          const needsBuild =
            buildKeyRef.current[side] !== currentBuildKey ||
            combatant.baseStats === null ||
            combatant.finalStats === null ||
            combatant.types === null

          if (!needsBuild || combatant.speciesId === null) {
            continue
          }

          const buildResponse = await buildStats({
            speciesId: combatant.speciesId,
            natureId: combatant.natureId,
            megaActive: combatant.megaActive,
            sp: combatant.sp,
          })

          if (requestId !== requestIdRef.current) {
            return
          }

          useCalculatorStore.getState().setCombatantDerived(side, {
            baseStats: buildResponse.baseStats,
            finalStats: buildResponse.finalStats,
            types: resolveCombatantTypes(combatant, pokedexRef.current),
          })
          buildKeyRef.current[side] = currentBuildKey
        }

        const nextResults = createEmptyResults()
        const tasks: Array<Promise<SettledDamage>> = []
        const latestState = useCalculatorStore.getState()

        for (const side of ['attacker', 'defender'] as const) {
          latestState[side].moves.forEach((moveSlot, moveIndex) => {
            if (moveSlot.moveId === null) {
              return
            }

            const request = selectDamageRequestFor(
              useCalculatorStore.getState(),
              side,
              moveIndex,
            )
            if (request === null) {
              return
            }

            tasks.push(
              calculateDamage(request).then((result) => ({
                side,
                moveIndex,
                result,
              })),
            )
          })
        }

        if (tasks.length === 0) {
          useCalculatorStore.getState().clearResults()
          useCalculatorStore.getState().setResultsStatus('idle')
          return
        }

        const settled = await Promise.allSettled(tasks)
        if (requestId !== requestIdRef.current) {
          return
        }

        let hasFailure = false
        settled.forEach((result) => {
          if (result.status === 'rejected') {
            hasFailure = true
            return
          }

          const key =
            result.value.side === 'attacker' ? 'attackerMoves' : 'defenderMoves'
          nextResults[key][result.value.moveIndex] = result.value.result
        })

        useCalculatorStore.getState().setResults(nextResults)
        useCalculatorStore
          .getState()
          .setResultsStatus(hasFailure ? 'error' : 'success')
      } catch {
        if (requestId !== requestIdRef.current) {
          return
        }

        useCalculatorStore.getState().clearResults()
        useCalculatorStore.getState().setResultsStatus('error')
      }
    }

    const schedule = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        requestIdRef.current += 1
        void recompute(requestIdRef.current)
      }, RECOMPUTE_DEBOUNCE_MS)
    }

    const unsubscribe = useCalculatorStore.subscribe(
      selectReactiveInputs,
      schedule,
    )
    schedule()

    return () => {
      unsubscribe()
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}
