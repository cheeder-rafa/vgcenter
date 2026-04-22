import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MatchupPinStrip } from '../../../src/features/calculator/components/MatchupPinStrip'
import { usePinStore } from '../../../src/features/calculator/store/usePinStore'

const PIN_A = {
  id: 'pin-a',
  attackerName: 'Sneasler',
  defenderName: 'Kingambit',
  label: 'Sneasler → Kingambit',
  attackerSummary: '177.0–209.8%',
  defenderSummary: '12.0–14.8%',
}

const PIN_B = {
  id: 'pin-b',
  attackerName: 'Urshifu',
  defenderName: 'Landorus',
  label: 'Urshifu → Landorus',
  attackerSummary: '55.0–65.2%',
  defenderSummary: '48.0–57.0%',
}

describe('MatchupPinStrip', () => {
  beforeEach(() => {
    usePinStore.getState().clear()
  })

  it('renders empty state when no pins exist', () => {
    render(<MatchupPinStrip onLoadPin={vi.fn()} onCurrentPin={vi.fn()} />)

    expect(screen.getByTestId('pin-strip-empty')).toBeInTheDocument()
  })

  it('renders a pin card when a pin is added', () => {
    act(() => {
      usePinStore.getState().addPin(PIN_A)
    })

    render(<MatchupPinStrip onLoadPin={vi.fn()} onCurrentPin={vi.fn()} />)

    expect(screen.getByTestId('pin-card-pin-a')).toBeInTheDocument()
    expect(screen.getByText('Sneasler')).toBeInTheDocument()
    expect(screen.getByText('Kingambit')).toBeInTheDocument()
  })

  it('calls onLoadPin with the pin data when a pin card is clicked', async () => {
    const user = userEvent.setup()
    const onLoadPin = vi.fn()

    act(() => {
      usePinStore.getState().addPin(PIN_A)
    })

    render(<MatchupPinStrip onLoadPin={onLoadPin} onCurrentPin={vi.fn()} />)

    await user.click(screen.getByTestId('pin-card-pin-a'))

    expect(onLoadPin).toHaveBeenCalledWith(PIN_A)
  })

  it('removes a pin when the delete button is clicked', async () => {
    const user = userEvent.setup()

    act(() => {
      usePinStore.getState().addPin(PIN_A)
    })

    render(<MatchupPinStrip onLoadPin={vi.fn()} onCurrentPin={vi.fn()} />)

    await user.click(screen.getByTestId('pin-delete-pin-a'))

    expect(screen.queryByTestId('pin-card-pin-a')).not.toBeInTheDocument()
  })

  it('shows pin count up to 4', () => {
    act(() => {
      usePinStore.getState().addPin(PIN_A)
      usePinStore.getState().addPin(PIN_B)
    })

    render(<MatchupPinStrip onLoadPin={vi.fn()} onCurrentPin={vi.fn()} />)

    expect(screen.getByTestId('pin-card-pin-a')).toBeInTheDocument()
    expect(screen.getByTestId('pin-card-pin-b')).toBeInTheDocument()
  })

  it('rejects a 5th pin (max 4)', () => {
    act(() => {
      for (let i = 0; i < 5; i++) {
        usePinStore.getState().addPin({ ...PIN_A, id: `pin-${i}` })
      }
    })

    expect(usePinStore.getState().pins).toHaveLength(4)
  })

  it('shows pin current button that calls onCurrentPin', async () => {
    const user = userEvent.setup()
    const onCurrentPin = vi.fn()

    render(<MatchupPinStrip onLoadPin={vi.fn()} onCurrentPin={onCurrentPin} />)

    await user.click(screen.getByTestId('pin-current-button'))

    expect(onCurrentPin).toHaveBeenCalled()
  })
})
