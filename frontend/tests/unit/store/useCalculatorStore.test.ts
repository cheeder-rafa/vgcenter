import { beforeEach, describe, expect, it } from 'vitest'

import {
  selectDamageRequest,
  useCalculatorStore,
} from '../../../src/features/calculator/store/useCalculatorStore'

describe('useCalculatorStore', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('seeds sensible defaults for attacker, defender, field, and move', () => {
    const state = useCalculatorStore.getState()

    expect(state.regulation).toBe('M-A')
    expect(state.attacker.level).toBe(50)
    expect(state.defender.level).toBe(50)
    expect(state.field.weather).toBe('NONE')
    expect(state.field.terrain).toBe('NONE')
    expect(state.field.room).toBe('NONE')
    expect(state.move.category).toBe('PHYSICAL')
    expect(state.move.basePower).toBeGreaterThan(0)
    expect(state.criticalHit).toBe(false)
    expect(state.targets).toBe(1)
    expect(state.attackerSide.helpingHand).toBe(false)
    expect(state.defenderSide.reflect).toBe(false)
  })

  it('updates attacker stats via setAttacker without mutating the previous object', () => {
    const previous = useCalculatorStore.getState().attacker

    useCalculatorStore.getState().setAttacker({
      stats: { ...previous.stats, attack: 200 },
    })

    const updated = useCalculatorStore.getState().attacker
    expect(updated.stats.attack).toBe(200)
    expect(previous.stats.attack).not.toBe(200)
    expect(updated).not.toBe(previous)
  })

  it('updates defender and field via their setters', () => {
    useCalculatorStore.getState().setDefender({ fullHp: false })
    useCalculatorStore.getState().setField({ weather: 'SUN' })

    expect(useCalculatorStore.getState().defender.fullHp).toBe(false)
    expect(useCalculatorStore.getState().field.weather).toBe('SUN')
  })

  it('toggles critical hit and updates move/targets', () => {
    const store = useCalculatorStore.getState()

    store.toggleCriticalHit()
    expect(useCalculatorStore.getState().criticalHit).toBe(true)

    store.setMove({ basePower: 90, type: 'WATER' })
    expect(useCalculatorStore.getState().move.basePower).toBe(90)
    expect(useCalculatorStore.getState().move.type).toBe('WATER')

    store.setTargets(2)
    expect(useCalculatorStore.getState().targets).toBe(2)
  })

  it('updates side conditions independently for attacker and defender sides', () => {
    useCalculatorStore.getState().setAttackerSide({ helpingHand: true })
    useCalculatorStore.getState().setDefenderSide({ reflect: true })

    expect(useCalculatorStore.getState().attackerSide.helpingHand).toBe(true)
    expect(useCalculatorStore.getState().defenderSide.reflect).toBe(true)
    expect(useCalculatorStore.getState().attackerSide.reflect).toBe(false)
  })

  it('reset() returns to the default state snapshot', () => {
    useCalculatorStore.getState().setAttacker({ level: 75 })
    useCalculatorStore.getState().setTargets(2)
    useCalculatorStore.getState().toggleCriticalHit()

    useCalculatorStore.getState().reset()

    const state = useCalculatorStore.getState()
    expect(state.attacker.level).toBe(50)
    expect(state.targets).toBe(1)
    expect(state.criticalHit).toBe(false)
  })

  it('selectDamageRequest builds a backend-shaped payload from the current state', () => {
    const store = useCalculatorStore.getState()
    store.setAttacker({ level: 50 })
    store.setMove({ basePower: 95, type: 'FIRE', category: 'PHYSICAL' })
    store.setField({ weather: 'SUN' })
    store.setTargets(2)

    const request = selectDamageRequest(useCalculatorStore.getState())

    expect(request.regulation).toBe('M-A')
    expect(request.attacker.level).toBe(50)
    expect(request.move.basePower).toBe(95)
    expect(request.move.type).toBe('FIRE')
    expect(request.field.weather).toBe('SUN')
    expect(request.targets).toBe(2)
  })
})
