import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StatTable } from '../../../src/features/calculator/components/StatTable'
import {
  clampSp,
  MAX_SP_PER_STAT,
} from '../../../src/features/calculator/components/statTableUtils'
import type { Spread, Stats } from '../../../src/features/calculator/types/api'

const ZERO_SPREAD: Spread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }

const BASE: Stats = {
  hp: 78,
  attack: 84,
  defense: 78,
  specialAttack: 109,
  specialDefense: 85,
  speed: 100,
}

const FINAL: Stats = {
  hp: 155,
  attack: 104,
  defense: 99,
  specialAttack: 200,
  specialDefense: 105,
  speed: 145,
}

describe('StatTable', () => {
  it('renders Base, SP, and Final columns for every stat', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        baseStats={BASE}
        finalStats={FINAL}
        onSpChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-base-hp').textContent).toBe('78')
    expect(screen.getByTestId('stat-final-spa').textContent).toBe('200')
    expect(screen.getByTestId('stat-final-spe').textContent).toBe('145')
  })

  it('clamps SP input to the 0–32 range via clampSp helper', () => {
    expect(clampSp(-10)).toBe(0)
    expect(clampSp(5)).toBe(5)
    expect(clampSp(32)).toBe(MAX_SP_PER_STAT)
    expect(clampSp(999)).toBe(MAX_SP_PER_STAT)
    expect(clampSp(Number.NaN)).toBe(0)
    expect(clampSp(7.9)).toBe(7)
  })

  it('invokes onSpChange with a clamped value when the user enters > 32', () => {
    const onSpChange = vi.fn()
    render(
      <StatTable
        sp={ZERO_SPREAD}
        baseStats={BASE}
        finalStats={FINAL}
        onSpChange={onSpChange}
      />,
    )

    const atkInput = screen.getByLabelText(/atk sp/i) as HTMLInputElement
    fireEvent.change(atkInput, { target: { value: '99' } })

    expect(onSpChange).toHaveBeenCalledWith({ atk: MAX_SP_PER_STAT })
  })

  it('shows — placeholders when final stats are not yet available', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        baseStats={BASE}
        finalStats={null}
        onSpChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-hp').textContent).toBe('—')
  })

  it('surfaces final stat changes driven by nature (exercised by parent)', () => {
    const { rerender } = render(
      <StatTable
        sp={ZERO_SPREAD}
        baseStats={BASE}
        finalStats={FINAL}
        onSpChange={() => {}}
      />,
    )
    expect(screen.getByTestId('stat-final-spe').textContent).toBe('145')

    const timidFinal: Stats = { ...FINAL, speed: 160, attack: 90 }
    rerender(
      <StatTable
        sp={ZERO_SPREAD}
        baseStats={BASE}
        finalStats={timidFinal}
        onSpChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-spe').textContent).toBe('160')
    expect(screen.getByTestId('stat-final-atk').textContent).toBe('90')
  })
})
