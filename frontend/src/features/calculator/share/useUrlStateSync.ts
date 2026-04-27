import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useCalculatorStore } from '../store/useCalculatorStore'
import { useToastStore } from '../store/useToastStore'
import {
  decodeCalcState,
  encodeCalcState,
  type ShareableState,
} from './encodeState'

const PARAM = 's'

export function useUrlStateSync() {
  const [searchParams] = useSearchParams()
  const applied = useRef(false)

  // On mount: decode and apply URL state once
  useEffect(() => {
    if (applied.current) return
    applied.current = true

    const encoded = searchParams.get(PARAM)
    if (!encoded) return

    const decoded = decodeCalcState(encoded)
    if (!decoded) return

    const store = useCalculatorStore.getState()
    store.setAttacker(decoded.attacker)
    store.setDefender(decoded.defender)
    store.setField(decoded.field)
    store.setAttackerSide(decoded.attackerSide)
    store.setDefenderSide(decoded.defenderSide)
    store.setTargets(decoded.targets)
    if (decoded.criticalHit !== useCalculatorStore.getState().criticalHit) {
      store.toggleCriticalHit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function copyShareLink() {
    const {
      regulation,
      attacker,
      defender,
      field,
      attackerSide,
      defenderSide,
      criticalHit,
      targets,
    } = useCalculatorStore.getState()

    const state: ShareableState = {
      regulation,
      attacker,
      defender,
      field,
      attackerSide,
      defenderSide,
      criticalHit,
      targets,
    }

    const encoded = encodeCalcState(state)
    const url = `${window.location.origin}${window.location.pathname}?${PARAM}=${encoded}`

    navigator.clipboard.writeText(url).then(
      () => useToastStore.getState().push('Link copied to clipboard'),
      () =>
        useToastStore
          .getState()
          .push('Could not copy — paste from address bar after sharing'),
    )
  }

  return { copyShareLink }
}
