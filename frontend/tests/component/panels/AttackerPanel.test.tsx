import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { AttackerPanel } from '../../../src/features/calculator/components/AttackerPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

describe('AttackerPanel', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders the attacker header and core inputs', () => {
    render(<AttackerPanel />)

    expect(screen.getByRole('heading', { name: /attacker/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^level$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^ability$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^item$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument()
  })

  it('wires the level input to the store', () => {
    render(<AttackerPanel />)

    const level = screen.getByLabelText(/^level$/i) as HTMLInputElement
    fireEvent.change(level, { target: { value: '75' } })

    expect(useCalculatorStore.getState().attacker.level).toBe(75)
  })

  it('toggles critical hit via the checkbox', async () => {
    render(<AttackerPanel />)
    const user = userEvent.setup()

    const crit = screen.getByLabelText(/critical hit/i) as HTMLInputElement
    await user.click(crit)

    expect(useCalculatorStore.getState().criticalHit).toBe(true)
  })
})
