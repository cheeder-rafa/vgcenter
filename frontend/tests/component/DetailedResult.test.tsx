import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  copyDamageReport: vi.fn(),
}))

vi.mock('../../src/features/calculator/components/copyDamageReport', () => ({
  copyDamageReport: mocks.copyDamageReport,
}))

import { DetailedResult } from '../../src/features/calculator/components/DetailedResult'
import { useCalculatorStore } from '../../src/features/calculator/store/useCalculatorStore'

describe('DetailedResult', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
    useCalculatorStore.getState().setMoveCatalog([
      {
        id: 'giga-impact',
        name: 'Giga Impact',
        type: 'NORMAL',
        category: 'PHYSICAL',
        basePower: 150,
        spread: false,
        contact: false,
        doublePowerWhenUserStatused: false,
        ignoreBurnPenaltyWhenUserStatused: false,
      },
      {
        id: 'surging-strikes',
        name: 'Surging Strikes',
        type: 'WATER',
        category: 'PHYSICAL',
        basePower: 25,
        spread: false,
        contact: true,
        doublePowerWhenUserStatused: false,
        ignoreBurnPenaltyWhenUserStatused: false,
      },
    ])
    mocks.copyDamageReport.mockReset()
    mocks.copyDamageReport.mockResolvedValue(undefined)
  })

  it('doesNotRenderInlineCopiedIndicator', async () => {
    const user = userEvent.setup()

    render(
      <DetailedResult
        focusedSide="attacker"
        focusedIndex={0}
        status="success"
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        moveName="Poltergeist"
        result={{
          rolls: [
            108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122,
            122, 126, 126,
          ],
          min: 108,
          max: 126,
          minPct: 64.6,
          maxPct: 75.4,
          koChance: {
            description: 'guaranteed 2HKO',
            probability: 1,
            hits: 2,
          },
        }}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /copy damage report/i }),
    )

    await waitFor(() =>
      expect(mocks.copyDamageReport).toHaveBeenCalledWith(
        'Aegislash-Shield Poltergeist vs. Aegislash-Shield: 108-126 (64.6 - 75.4%) -- guaranteed 2HKO',
      ),
    )
    expect(screen.queryByText(/copied damage report/i)).not.toBeInTheDocument()
    expect(screen.getByText(/guaranteed 2hko/i)).toBeInTheDocument()
    expect(screen.getByTestId('detailed-roll-summary')).toHaveTextContent(
      '0 lethal',
    )
    expect(screen.getByTestId('detailed-roll-summary')).toHaveTextContent(
      '16 safe',
    )
    expect(screen.queryByTestId('heatmap-hp-label')).not.toBeInTheDocument()
  })

  it('shows through Protect for protect-piercing abilities', () => {
    useCalculatorStore.getState().setAttacker({
      abilityId: 'piercing-drill',
      moves: [
        { moveId: 'giga-impact' },
        { moveId: null },
        { moveId: null },
        { moveId: null },
      ],
    })
    useCalculatorStore.getState().setDefenderSide({ protect: true })

    render(
      <DetailedResult
        focusedSide="attacker"
        focusedIndex={0}
        status="success"
        attackerName="Golurk"
        defenderName="Excadrill"
        moveName="Giga Impact"
        result={{
          rolls: [
            17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20,
          ],
          min: 17,
          max: 20,
          minPct: 9.2,
          maxPct: 10.8,
          koChance: {
            description: 'no 5HKO',
            probability: 0,
            hits: 5,
          },
        }}
      />,
    )

    expect(
      screen.getByText(/golurk giga impact vs\. excadrill through protect/i),
    ).toBeInTheDocument()
  })

  it('shows lethal and safe roll counts against the current defender HP', () => {
    useCalculatorStore.getState().setDefender({
      finalStats: {
        hp: 120,
        attack: 80,
        defense: 100,
        specialAttack: 80,
        specialDefense: 100,
        speed: 60,
      },
    })

    render(
      <DetailedResult
        focusedSide="attacker"
        focusedIndex={0}
        status="success"
        attackerName="Flutter Mane"
        defenderName="Amoonguss"
        moveName="Moonblast"
        result={{
          rolls: [
            108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122,
            122, 126, 126,
          ],
          min: 108,
          max: 126,
          minPct: 64.6,
          maxPct: 75.4,
          koChance: {
            description: 'possible OHKO',
            probability: 0.375,
            hits: 1,
          },
        }}
      />,
    )

    expect(screen.getByTestId('detailed-roll-summary')).toHaveTextContent(
      '6 lethal',
    )
    expect(screen.getByTestId('detailed-roll-summary')).toHaveTextContent(
      '10 safe',
    )
  })
})
