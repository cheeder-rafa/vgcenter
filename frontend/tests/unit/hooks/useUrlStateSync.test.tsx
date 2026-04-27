import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { encodeCalcState } from '../../../src/features/calculator/share/encodeState'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import { useUrlStateSync } from '../../../src/features/calculator/share/useUrlStateSync'

const COMBATANT = {
  speciesId: 'incineroar',
  natureId: 'adamant',
  sp: { hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  abilityId: 'intimidate',
  itemId: null,
  status: 'NONE' as const,
  megaActive: false,
  megaFormId: null,
  moves: [
    { moveId: 'fake-out' },
    { moveId: null },
    { moveId: null },
    { moveId: null },
  ] as [
    { moveId: string | null },
    { moveId: string | null },
    { moveId: string | null },
    { moveId: string | null },
  ],
  baseStats: null,
  finalStats: null,
  types: null,
  grounded: true,
  currentHp: 0,
}

function TestHarness() {
  useUrlStateSync()
  return null
}

describe('useUrlStateSync', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('applies decoded state from URL ?s= param on mount', () => {
    const encoded = encodeCalcState({
      regulation: 'M-A',
      attacker: { ...COMBATANT, speciesId: 'incineroar' },
      defender: { ...COMBATANT, speciesId: 'flutter-mane' },
      field: { weather: 'SUN', terrain: 'NONE', room: 'NONE' },
      attackerSide: {
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        friendGuard: false,
        helpingHand: true,
        tailwind: false,
        protect: false,
      },
      defenderSide: {
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        friendGuard: false,
        helpingHand: false,
        tailwind: false,
        protect: false,
      },
      criticalHit: false,
      targets: 1,
    })

    render(
      <MemoryRouter initialEntries={[`/calc?s=${encoded}`]}>
        <Routes>
          <Route path="/calc" element={<TestHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    const state = useCalculatorStore.getState()
    expect(state.attacker.speciesId).toBe('incineroar')
    expect(state.defender.speciesId).toBe('flutter-mane')
    expect(state.field.weather).toBe('SUN')
    expect(state.attackerSide.helpingHand).toBe(true)
  })

  it('does not modify store when ?s= param is absent', () => {
    const defaultSpeciesId = useCalculatorStore.getState().attacker.speciesId

    render(
      <MemoryRouter initialEntries={['/calc']}>
        <Routes>
          <Route path="/calc" element={<TestHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(useCalculatorStore.getState().attacker.speciesId).toBe(
      defaultSpeciesId,
    )
  })

  it('does not modify store when ?s= param is corrupted', () => {
    const defaultSpeciesId = useCalculatorStore.getState().attacker.speciesId

    render(
      <MemoryRouter initialEntries={['/calc?s=not-valid']}>
        <Routes>
          <Route path="/calc" element={<TestHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(useCalculatorStore.getState().attacker.speciesId).toBe(
      defaultSpeciesId,
    )
  })

  it('copyShareLink writes URL to clipboard', async () => {
    const user = userEvent.setup()
    const writeMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: writeMock },
    })

    function ShareButton() {
      const { copyShareLink } = useUrlStateSync()
      return (
        <button type="button" onClick={copyShareLink}>
          Share
        </button>
      )
    }

    render(
      <MemoryRouter initialEntries={['/calc']}>
        <Routes>
          <Route path="/calc" element={<ShareButton />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeMock).toHaveBeenCalledOnce()
    const [[url]] = writeMock.mock.calls as [[string]]
    expect(url).toContain('?s=')
  })
})
