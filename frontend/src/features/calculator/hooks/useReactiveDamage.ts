import { useEffect, useRef } from 'react'

import { calculateDamage } from '../api/damageApi'
import {
  selectDamageRequestFor,
  useCalculatorStore,
  type CalculatorSide,
} from '../store/useCalculatorStore'
import type { CombatantBuild, DamageDelta, DamageResult } from '../types/api'

const RECOMPUTE_DEBOUNCE_MS = 200

type ReactiveCombatantInputs = Pick<
  CombatantBuild,
  | 'speciesId'
  | 'natureId'
  | 'sp'
  | 'stages'
  | 'abilityId'
  | 'itemId'
  | 'status'
  | 'megaActive'
  | 'moves'
  | 'grounded'
  | 'currentHp'
  | 'finalStats'
  | 'types'
>

type ReactiveSnapshot = ReturnType<typeof selectReactiveInputs>

type MoveFingerprints = [
  string | null,
  string | null,
  string | null,
  string | null,
]

type FingerprintsBySide = {
  attacker: MoveFingerprints
  defender: MoveFingerprints
}

type SideDeltas = [
  DamageDelta | null,
  DamageDelta | null,
  DamageDelta | null,
  DamageDelta | null,
]

type ResultsBySide = {
  attackerMoves: [
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
  ]
  defenderMoves: [
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
  ]
}

type SettledDamage = {
  side: CalculatorSide
  moveIndex: number
  result: DamageResult
}

type SlotKey = {
  side: CalculatorSide
  moveIndex: number
}

function selectReactiveInputs(
  state: ReturnType<typeof useCalculatorStore.getState>,
) {
  return {
    regulation: state.regulation,
    moveCatalogVersion: state.moveCatalogVersion,
    attacker: selectCombatantInputs(state.attacker),
    defender: selectCombatantInputs(state.defender),
    field: state.field,
    attackerSide: state.attackerSide,
    defenderSide: state.defenderSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  }
}

function selectCombatantInputs(
  combatant: CombatantBuild,
): ReactiveCombatantInputs {
  return {
    speciesId: combatant.speciesId,
    natureId: combatant.natureId,
    sp: combatant.sp,
    stages: combatant.stages,
    abilityId: combatant.abilityId,
    itemId: combatant.itemId,
    status: combatant.status,
    megaActive: combatant.megaActive,
    moves: combatant.moves,
    grounded: combatant.grounded,
    currentHp: combatant.currentHp,
    finalStats: combatant.finalStats,
    types: combatant.types,
  }
}

function selectSubscriptionKey(
  state: ReturnType<typeof useCalculatorStore.getState>,
) {
  return JSON.stringify(selectReactiveInputs(state))
}

function cloneResults(results: ResultsBySide): ResultsBySide {
  return {
    attackerMoves: [...results.attackerMoves] as ResultsBySide['attackerMoves'],
    defenderMoves: [...results.defenderMoves] as ResultsBySide['defenderMoves'],
  }
}

function buildMoveFingerprints(
  state: ReturnType<typeof useCalculatorStore.getState>,
): FingerprintsBySide {
  return {
    attacker: buildFingerprintsForSide(state, 'attacker'),
    defender: buildFingerprintsForSide(state, 'defender'),
  }
}

function buildFingerprintsForSide(
  state: ReturnType<typeof useCalculatorStore.getState>,
  side: CalculatorSide,
): MoveFingerprints {
  return [0, 1, 2, 3].map((moveIndex) =>
    buildMoveFingerprint(state, side, moveIndex),
  ) as MoveFingerprints
}

function buildMoveFingerprint(
  state: ReturnType<typeof useCalculatorStore.getState>,
  side: CalculatorSide,
  moveIndex: number,
) {
  const request = selectDamageRequestFor(state, side, moveIndex)
  if (request === null) {
    return null
  }

  const attacker = state[side]
  const defender = state[side === 'attacker' ? 'defender' : 'attacker']
  const move = request.move
  const isPhysical = move.category === 'PHYSICAL'

  return JSON.stringify({
    regulation: state.regulation,
    moveCatalogVersion: state.moveCatalogVersion,
    moveIndex,
    attacker: {
      speciesId: attacker.speciesId,
      abilityId: attacker.abilityId,
      itemId: attacker.itemId,
      status: attacker.status,
      megaActive: attacker.megaActive,
      grounded: attacker.grounded,
      currentHp: attacker.currentHp,
      types: attacker.types,
      stats: {
        hp: attacker.finalStats?.hp ?? null,
        offense: isPhysical
          ? attacker.finalStats?.attack ?? null
          : attacker.finalStats?.specialAttack ?? null,
      },
      stages: {
        offense: isPhysical ? attacker.stages.atk : attacker.stages.spa,
      },
    },
    defender: {
      speciesId: defender.speciesId,
      abilityId: defender.abilityId,
      itemId: defender.itemId,
      status: defender.status,
      megaActive: defender.megaActive,
      grounded: defender.grounded,
      currentHp: defender.currentHp,
      types: defender.types,
      stats: {
        hp: defender.finalStats?.hp ?? null,
        defense: isPhysical
          ? defender.finalStats?.defense ?? null
          : defender.finalStats?.specialDefense ?? null,
      },
      stages: {
        defense: isPhysical ? defender.stages.def : defender.stages.spd,
      },
    },
    move,
    field: state.field,
    attackerSide: side === 'attacker' ? state.attackerSide : state.defenderSide,
    defenderSide: side === 'attacker' ? state.defenderSide : state.attackerSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  })
}

function diffInvalidatedSlots(
  previous: FingerprintsBySide | null,
  next: FingerprintsBySide,
): SlotKey[] {
  const invalidated: SlotKey[] = []

  for (const side of ['attacker', 'defender'] as const) {
    next[side].forEach((fingerprint, moveIndex) => {
      if (previous === null || previous[side][moveIndex] !== fingerprint) {
        invalidated.push({ side, moveIndex })
      }
    })
  }

  return invalidated
}

function detectEditedSide(
  previous: ReactiveSnapshot | null,
  next: ReactiveSnapshot,
): CalculatorSide | null {
  if (previous === null) {
    return null
  }

  const attackerChanged =
    JSON.stringify(previous.attacker) !== JSON.stringify(next.attacker)
  const defenderChanged =
    JSON.stringify(previous.defender) !== JSON.stringify(next.defender)
  const sharedChanged =
    JSON.stringify({
      regulation: previous.regulation,
      moveCatalogVersion: previous.moveCatalogVersion,
      field: previous.field,
      attackerSide: previous.attackerSide,
      defenderSide: previous.defenderSide,
      criticalHit: previous.criticalHit,
      targets: previous.targets,
    }) !==
    JSON.stringify({
      regulation: next.regulation,
      moveCatalogVersion: next.moveCatalogVersion,
      field: next.field,
      attackerSide: next.attackerSide,
      defenderSide: next.defenderSide,
      criticalHit: next.criticalHit,
      targets: next.targets,
    })

  if (sharedChanged) {
    return null
  }
  if (attackerChanged && !defenderChanged) {
    return 'attacker'
  }
  if (defenderChanged && !attackerChanged) {
    return 'defender'
  }
  return null
}

function buildSideDeltas(
  nextResults: ResultsBySide,
  previousResults: ResultsBySide,
  side: CalculatorSide,
) {
  const nextSide =
    side === 'attacker' ? nextResults.attackerMoves : nextResults.defenderMoves
  const previousSide =
    side === 'attacker'
      ? previousResults.attackerMoves
      : previousResults.defenderMoves

  return nextSide.map((result, index) => {
    const previous = previousSide[index]
    if (result === null || previous === null) {
      return null
    }

    const minPctDelta = result.minPct - previous.minPct
    const maxPctDelta = result.maxPct - previous.maxPct
    if (
      Math.abs(minPctDelta) < 0.05 &&
      Math.abs(maxPctDelta) < 0.05
    ) {
      return null
    }

    return { minPctDelta, maxPctDelta }
  }) as SideDeltas
}

export function useReactiveDamage() {
  const requestIdRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousSnapshotRef = useRef<ReactiveSnapshot | null>(null)
  const previousFingerprintsRef = useRef<FingerprintsBySide | null>(null)
  const lastSuccessfulResultsRef = useRef<ResultsBySide>({
    attackerMoves: [null, null, null, null],
    defenderMoves: [null, null, null, null],
  })

  useEffect(() => {
    const recompute = async (requestId: number) => {
      const store = useCalculatorStore.getState()

      if (
        store.attacker.speciesId === null ||
        store.defender.speciesId === null
      ) {
        previousSnapshotRef.current = selectReactiveInputs(store)
        previousFingerprintsRef.current = buildMoveFingerprints(store)
        store.clearResults()
        store.setResultsStatus('idle')
        return
      }

      const currentSnapshot = selectReactiveInputs(store)
      const currentFingerprints = buildMoveFingerprints(store)
      const invalidatedSlots = diffInvalidatedSlots(
        previousFingerprintsRef.current,
        currentFingerprints,
      )
      const editedSide = detectEditedSide(
        previousSnapshotRef.current,
        currentSnapshot,
      )

      previousSnapshotRef.current = currentSnapshot
      previousFingerprintsRef.current = currentFingerprints

      if (invalidatedSlots.length === 0) {
        return
      }

      const nextResults = cloneResults(store.results)
      const tasks: Array<Promise<SettledDamage>> = []

      invalidatedSlots.forEach(({ side, moveIndex }) => {
        const request = selectDamageRequestFor(
          useCalculatorStore.getState(),
          side,
          moveIndex,
        )
        const key = side === 'attacker' ? 'attackerMoves' : 'defenderMoves'

        if (request === null) {
          nextResults[key][moveIndex] = null
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

      store.setResultsStatus(tasks.length > 0 ? 'loading' : 'success')

      try {
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

        const latestStore = useCalculatorStore.getState()
        latestStore.setResults(nextResults)

        if (editedSide !== null) {
          latestStore.setMoveDeltas(
            editedSide,
            buildSideDeltas(
              nextResults,
              lastSuccessfulResultsRef.current,
              editedSide,
            ),
          )
        }

        latestStore.setResultsStatus(
          nextResults.attackerMoves.every((entry) => entry === null) &&
            nextResults.defenderMoves.every((entry) => entry === null)
            ? 'idle'
            : hasFailure
              ? 'error'
              : 'success',
        )
        lastSuccessfulResultsRef.current = cloneResults(nextResults)
      } catch {
        if (requestId !== requestIdRef.current) {
          return
        }

        const latestStore = useCalculatorStore.getState()
        latestStore.clearResults()
        latestStore.setResultsStatus('error')
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
      selectSubscriptionKey,
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
