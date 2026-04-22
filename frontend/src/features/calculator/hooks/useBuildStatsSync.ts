import { useEffect, useRef } from 'react'

import { buildStats } from '../api/datasetApi'
import {
  useCalculatorStore,
  type CalculatorSide,
} from '../store/useCalculatorStore'
import type { CombatantBuild, PokedexEntry } from '../types/api'

const RECOMPUTE_DEBOUNCE_MS = 200

type BuildInputs = Pick<
  CombatantBuild,
  'speciesId' | 'natureId' | 'megaActive' | 'megaFormId' | 'sp'
>

function selectBuildInputs(combatant: CombatantBuild) {
  return JSON.stringify({
    speciesId: combatant.speciesId,
    natureId: combatant.natureId,
    megaActive: combatant.megaActive,
    megaFormId: combatant.megaFormId,
    sp: combatant.sp,
  } satisfies BuildInputs)
}

function createBuildKey(combatant: CombatantBuild): string {
  return JSON.stringify({
    speciesId: combatant.speciesId,
    natureId: combatant.natureId,
    megaActive: combatant.megaActive,
    megaFormId: combatant.megaFormId,
    sp: combatant.sp,
  })
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
    const megaForm =
      entry.megaForms.find(
        (candidate) => candidate.id === combatant.megaFormId,
      ) ?? entry.megaForms[0]
    const [primary, secondary] = megaForm.types
    return [primary, secondary ?? null]
  }

  const [primary, secondary] = entry.types
  return [primary, secondary ?? null]
}

export function useBuildStatsSync(
  side: CalculatorSide,
  pokedex: PokedexEntry[],
) {
  const pokedexRef = useRef(pokedex)
  const requestIdRef = useRef(0)
  const buildKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    pokedexRef.current = pokedex
  }, [pokedex])

  useEffect(() => {
    const recompute = async (requestId: number) => {
      const combatant = useCalculatorStore.getState()[side]

      if (combatant.speciesId === null) {
        buildKeyRef.current = null
        return
      }

      const currentBuildKey = createBuildKey(combatant)
      const needsBuild =
        buildKeyRef.current !== currentBuildKey ||
        combatant.baseStats === null ||
        combatant.finalStats === null ||
        combatant.types === null

      if (!needsBuild) {
        return
      }

      const buildResponse = await buildStats({
        speciesId: combatant.speciesId,
        natureId: combatant.natureId,
        megaActive: combatant.megaActive,
        megaFormId: combatant.megaFormId,
        sp: combatant.sp,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      const latestCombatant = useCalculatorStore.getState()[side]
      useCalculatorStore.getState().setCombatantDerived(side, {
        baseStats: buildResponse.baseStats,
        finalStats: buildResponse.finalStats,
        types: resolveCombatantTypes(latestCombatant, pokedexRef.current),
      })
      buildKeyRef.current = currentBuildKey
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
      (state) => selectBuildInputs(state[side]),
      schedule,
    )
    schedule()

    return () => {
      unsubscribe()
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [side])
}
