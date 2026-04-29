import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { FieldPanel } from '../../../src/features/calculator/components/FieldPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

describe('FieldPanel', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders weather, terrain, and room selectors', () => {
    render(<FieldPanel focusedSide="attacker" />)

    expect(
      screen.getByRole('heading', { name: /modifiers/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^field$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/weather/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/terrain/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/room/i)).toBeInTheDocument()
  })

  it('selecting a weather updates the store', async () => {
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    const weather = screen.getByLabelText(/weather/i)
    await user.selectOptions(weather, 'SUN')

    expect(useCalculatorStore.getState().field.weather).toBe('SUN')
  })

  it('toggling spread sets targets to 2', async () => {
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    const spread = screen.getByLabelText(/spread/i) as HTMLInputElement
    await user.click(spread)

    expect(useCalculatorStore.getState().targets).toBe(2)
  })

  it('summarizes active modifiers and clears them from the panel', async () => {
    const store = useCalculatorStore.getState()
    store.setField({ weather: 'SUN' })
    store.setTargets(2)
    store.setAttackerSide({ helpingHand: true })
    store.setDefenderSide({ reflect: true })
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    expect(screen.getByText(/4 active/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset field/i }))

    expect(screen.getByText(/clean field/i)).toBeInTheDocument()
    expect(useCalculatorStore.getState().field.weather).toBe('CLEAR')
    expect(useCalculatorStore.getState().targets).toBe(1)
    expect(useCalculatorStore.getState().attackerSide.helpingHand).toBe(false)
    expect(useCalculatorStore.getState().defenderSide.reflect).toBe(false)
  })

  it('checking reflect updates the defender side', async () => {
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    const reflect = screen.getByLabelText(/reflect/i) as HTMLInputElement
    await user.click(reflect)

    expect(useCalculatorStore.getState().defenderSide.reflect).toBe(true)
  })

  it('toggles tailwind for the defending side', async () => {
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    const tailwind = screen.getByLabelText(/defender tailwind/i)
    await user.click(tailwind)

    expect(useCalculatorStore.getState().defenderSide.tailwind).toBe(true)
    expect(useCalculatorStore.getState().attackerSide.tailwind).toBe(false)
  })

  it('toggles tailwind for the attacking side', async () => {
    render(<FieldPanel focusedSide="attacker" />)
    const user = userEvent.setup()

    const tailwind = screen.getByLabelText(/attacker tailwind/i)
    await user.click(tailwind)

    expect(useCalculatorStore.getState().attackerSide.tailwind).toBe(true)
    expect(useCalculatorStore.getState().defenderSide.tailwind).toBe(false)
  })
})
