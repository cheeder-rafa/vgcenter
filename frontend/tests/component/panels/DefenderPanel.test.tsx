import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { DefenderPanel } from '../../../src/features/calculator/components/DefenderPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

describe('DefenderPanel', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders the defender header with HP and Def inputs', () => {
    render(<DefenderPanel />)

    expect(screen.getByRole('heading', { name: /defender/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^hp$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^defense$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/special defense/i)).toBeInTheDocument()
  })

  it('updates defender stats through the store', () => {
    render(<DefenderPanel />)

    const def = screen.getByLabelText(/^defense$/i) as HTMLInputElement
    fireEvent.change(def, { target: { value: '150' } })

    expect(useCalculatorStore.getState().defender.stats.defense).toBe(150)
  })
})
