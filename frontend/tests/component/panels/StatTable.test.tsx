import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StatTable } from '../../../src/features/calculator/components/StatTable'
import {
  clampSp,
  MAX_SP_PER_STAT,
} from '../../../src/features/calculator/components/statTableUtils'
import type {
  Spread,
  StatStages,
  Stats,
} from '../../../src/features/calculator/types/api'

const ZERO_SPREAD: Spread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
const ZERO_STAGES: StatStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }

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
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(['Stat', 'Base', 'SP 0–32', 'Stage', 'Final'])
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
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={onSpChange}
        onStageChange={() => {}}
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
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={null}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-hp').textContent).toBe('—')
  })

  it('surfaces final stat changes driven by nature (exercised by parent)', () => {
    const { rerender } = render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )
    expect(screen.getByTestId('stat-final-spe').textContent).toBe('145')

    const timidFinal: Stats = { ...FINAL, speed: 160, attack: 90 }
    rerender(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={timidFinal}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-spe').textContent).toBe('160')
    expect(screen.getByTestId('stat-final-atk').textContent).toBe('90')
  })

  it('halves displayed final speed when status is paralysis', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="PARALYSIS"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-spe').textContent).toBe('72')
  })

  it('applies positive stages to the displayed final stat', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={{ ...ZERO_STAGES, atk: 2 }}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-atk').textContent).toBe('208')
  })

  it('applies negative stages to the displayed final stat', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={{ ...ZERO_STAGES, def: -1 }}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-def').textContent).toBe('66')
  })

  it('applies stages before paralysis to displayed speed', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={{ ...ZERO_STAGES, spe: 1 }}
        baseStats={BASE}
        finalStats={FINAL}
        status="PARALYSIS"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-final-spe').textContent).toBe('108')
  })

  it('keeps the HP placeholder aligned with the stage column', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('stat-stage-hp').className).toContain(
      'justify-end',
    )
  })

  it('shows negative remaining in red when over 66', () => {
    render(
      <StatTable
        sp={{ hp: 12, atk: 12, def: 12, spa: 12, spd: 12, spe: 12 }}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    expect(screen.getByTestId('sp-remaining').textContent).toContain('-6')
    expect(screen.getByTestId('sp-remaining').className).toContain(
      'text-red-400',
    )
  })

  it('uses a horizontal overflow wrapper instead of forcing the page width', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    const table = screen.getByRole('table')
    expect(table.className).toContain('overflow-x-auto')
    expect(table.firstElementChild?.className).toContain('min-w-[34rem]')
  })

  it('SP input has a compact max-w class no wider than max-w-[80px]', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    const spInput = screen.getByLabelText(/HP SP/i)
    expect(spInput.className).not.toContain('max-w-[100px]')
    expect(spInput.className).toMatch(/max-w-\[(?:6\d|7\d|80)px\]/)
  })

  it('stage control buttons use min-w-7, not the wider min-w-8', () => {
    render(
      <StatTable
        sp={ZERO_SPREAD}
        stages={ZERO_STAGES}
        baseStats={BASE}
        finalStats={FINAL}
        status="NONE"
        onSpChange={() => {}}
        onStageChange={() => {}}
      />,
    )

    const stageControls = document
      .querySelectorAll('[data-testid^="stage-control-"]')
    const buttons = Array.from(stageControls).flatMap((cell) =>
      Array.from(cell.querySelectorAll('button')),
    )
    expect(buttons.length).toBeGreaterThan(0)
    for (const btn of buttons) {
      expect(btn.className).not.toContain('min-w-8')
    }
  })
})
