import { beforeEach, describe, expect, it } from 'vitest'

import {
  selectDamageRequestFor,
  useCalculatorStore,
} from '../../../src/features/calculator/store/useCalculatorStore'

describe('useCalculatorStore', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('seeds sensible defaults for the combatant build, field, and results cache', () => {
    const state = useCalculatorStore.getState()

    expect(state.regulation).toBe('M-A')
    expect(state.attacker.speciesId).toBeNull()
    expect(state.attacker.moves).toEqual([
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ])
    expect(state.defender.finalStats?.defense).toBe(120)
    expect(state.field.weather).toBe('CLEAR')
    expect(state.field.room).toBe('NONE')
    expect(state.results.attackerMoves).toEqual([null, null, null, null])
    expect(state.results.defenderMoves).toEqual([null, null, null, null])
    expect(state.resultsStatus).toBe('idle')
  })

  it('updates attacker final stats via setAttacker without mutating the previous object', () => {
    const previous = useCalculatorStore.getState().attacker

    useCalculatorStore.getState().setAttacker({
      finalStats: { attack: 200 },
    })

    const updated = useCalculatorStore.getState().attacker
    expect(updated.finalStats?.attack).toBe(200)
    expect(previous.finalStats?.attack).not.toBe(200)
    expect(updated).not.toBe(previous)
  })

  it('updates defender and field via their setters', () => {
    useCalculatorStore.getState().setDefender({ fullHp: false })
    useCalculatorStore.getState().setField({ weather: 'SUN' })

    expect(useCalculatorStore.getState().defender.fullHp).toBe(false)
    expect(useCalculatorStore.getState().field.weather).toBe('SUN')
  })

  it('toggles critical hit and updates move slots and targets', () => {
    const store = useCalculatorStore.getState()

    store.toggleCriticalHit()
    expect(useCalculatorStore.getState().criticalHit).toBe(true)

    store.setMoveSlot('attacker', 1, 'protect')
    expect(useCalculatorStore.getState().attacker.moves[1]).toEqual({
      moveId: 'protect',
    })

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
    useCalculatorStore.getState().setAttacker({ speciesId: 'charizard' })
    useCalculatorStore.getState().setTargets(2)
    useCalculatorStore.getState().toggleCriticalHit()
    useCalculatorStore.getState().setResultsStatus('success')

    useCalculatorStore.getState().reset()

    const state = useCalculatorStore.getState()
    expect(state.attacker.speciesId).toBeNull()
    expect(state.targets).toBe(1)
    expect(state.criticalHit).toBe(false)
    expect(state.resultsStatus).toBe('idle')
  })

  it('selectDamageRequestFor builds a backend payload with level fixed to 50', () => {
    const store = useCalculatorStore.getState()
    store.setMoveCatalog([
      {
        id: 'heat-wave',
        name: 'Heat Wave',
        type: 'FIRE',
        category: 'SPECIAL',
        basePower: 95,
        spread: true,
        contact: false,
        doublePowerWhenUserStatused: false,
        ignoreBurnPenaltyWhenUserStatused: false,
      },
    ])
    store.setAttacker({
      finalStats: {
        hp: 160,
        attack: 200,
        defense: 110,
        specialAttack: 120,
        specialDefense: 110,
        speed: 140,
      },
      types: ['FIRE', 'FLYING'],
      grounded: false,
      moves: [
        { moveId: 'heat-wave' },
        { moveId: null },
        { moveId: null },
        { moveId: null },
      ],
    })
    store.setDefender({
      finalStats: {
        hp: 180,
        attack: 100,
        defense: 120,
        specialAttack: 110,
        specialDefense: 130,
        speed: 90,
      },
      types: ['GRASS', 'POISON'],
    })
    store.setField({ weather: 'CLEAR' })
    store.setTargets(2)

    const request = selectDamageRequestFor(
      useCalculatorStore.getState(),
      'attacker',
      0,
    )

    expect(request).toEqual(
      expect.objectContaining({
        regulation: 'M-A',
        attacker: expect.objectContaining({
          level: 50,
          abilityId: null,
          types: ['FIRE', 'FLYING'],
        }),
        move: expect.objectContaining({
          basePower: 95,
          type: 'FIRE',
          category: 'SPECIAL',
          spread: true,
        }),
        field: expect.objectContaining({ weather: 'CLEAR', room: 'NONE' }),
        targets: 2,
      }),
    )
  })

  it('returns null for status moves and resolves move metadata by slot', () => {
    const store = useCalculatorStore.getState()
    store.setMoveCatalog([
      {
        id: 'protect',
        name: 'Protect',
        type: 'NORMAL',
        category: 'STATUS',
        basePower: 0,
        spread: false,
        contact: false,
        doublePowerWhenUserStatused: false,
        ignoreBurnPenaltyWhenUserStatused: false,
      },
      {
        id: 'moonblast',
        name: 'Moonblast',
        type: 'FAIRY',
        category: 'SPECIAL',
        basePower: 95,
        spread: false,
        contact: false,
        doublePowerWhenUserStatused: false,
        ignoreBurnPenaltyWhenUserStatused: false,
      },
    ])
    store.setAttacker({
      finalStats: {
        hp: 160,
        attack: 70,
        defense: 90,
        specialAttack: 180,
        specialDefense: 120,
        speed: 110,
      },
      types: ['FAIRY', null],
      moves: [
        { moveId: 'protect' },
        { moveId: 'moonblast' },
        { moveId: null },
        { moveId: null },
      ],
    })
    store.setDefender({
      finalStats: {
        hp: 180,
        attack: 100,
        defense: 120,
        specialAttack: 110,
        specialDefense: 130,
        speed: 90,
      },
      types: ['DARK', null],
    })

    expect(
      selectDamageRequestFor(useCalculatorStore.getState(), 'attacker', 0),
    ).toBeNull()
    expect(
      selectDamageRequestFor(useCalculatorStore.getState(), 'attacker', 1),
    ).toEqual(
      expect.objectContaining({
        move: expect.objectContaining({
          type: 'FAIRY',
          category: 'SPECIAL',
          basePower: 95,
        }),
      }),
    )
  })
})
