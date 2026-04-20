import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { CalculatorPage } from '../../src/pages/CalculatorPage'
import { useCalculatorStore } from '../../src/features/calculator/store/useCalculatorStore'

describe('CalculatorPage', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders the app title, the three input panels, and the result panel', () => {
    render(<CalculatorPage />)

    expect(
      screen.getByRole('heading', { name: /vgcenter damage calculator/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /attacker/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /field/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /defender/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /result/i })).toBeInTheDocument()
  })

  it('exposes the Showdown and Pokepaste import entry points', () => {
    render(<CalculatorPage />)

    expect(screen.getByRole('button', { name: /showdown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pokepaste/i })).toBeInTheDocument()
  })

  it('advertises the active regulation', () => {
    render(<CalculatorPage />)

    expect(screen.getByText(/^regulation m-a$/i)).toBeInTheDocument()
  })
})
