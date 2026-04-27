import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildSpeedTiers: vi.fn(),
  useTeamsStore: vi.fn(),
}))

vi.mock('../../../src/features/speed/api/speedApi', () => ({
  buildSpeedTiers: mocks.buildSpeedTiers,
}))

vi.mock('../../../src/store/useTeamsStore', () => ({
  useTeamsStore: mocks.useTeamsStore,
}))

import { SpeedTierPage } from '../../../src/pages/SpeedTierPage'

const EMPTY_RAIL = [null, null, null, null, null, null] as const

const BASE_ROWS = [
  { speciesId: 'flutter-mane', speciesName: 'Flutter Mane', finalSpeed: 186, userTeam: false, isMega: false },
  { speciesId: 'incineroar', speciesName: 'Incineroar', finalSpeed: 80, userTeam: true, isMega: false },
  { speciesId: 'garchomp', speciesName: 'Garchomp', finalSpeed: 122, userTeam: false, isMega: false },
  { speciesId: 'garchomp-mega', speciesName: 'Garchomp Mega', finalSpeed: 92, userTeam: false, isMega: true },
]

beforeEach(() => {
  mocks.useTeamsStore.mockImplementation((selector: (s: { mine: readonly (null)[] }) => unknown) =>
    selector({ mine: EMPTY_RAIL }),
  )
  mocks.buildSpeedTiers.mockResolvedValue({ rows: BASE_ROWS })
})

describe('SpeedTierPage', () => {
  it('renders heading', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /speed tier sheet/i })).toBeInTheDocument()
  })

  it('shows idle empty state on initial render before data loads', () => {
    mocks.buildSpeedTiers.mockReturnValue(new Promise(() => {})) // never resolves
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no tiers loaded yet/i)).toBeInTheDocument()
  })

  it('displays base and mega rows in a single unified list', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Flutter Mane')).toBeInTheDocument())
    expect(screen.getByText('Incineroar')).toBeInTheDocument()
    expect(screen.getByText('Garchomp')).toBeInTheDocument()
    expect(screen.getByText('Garchomp Mega')).toBeInTheDocument()

    // Only one table (unified list — no separate "Mega Evolutions" section header)
    expect(screen.queryByText(/mega evolutions/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/base forms/i)).not.toBeInTheDocument()
  })

  it('highlights user-team row in cyan', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Incineroar')).toBeInTheDocument())
    expect(screen.getByText('Incineroar')).toHaveClass('text-arena-cyan')
  })

  it('includes mega form in buildSpeedTiers request when Pokémon holds matching mega stone', async () => {
    mocks.useTeamsStore.mockImplementation(
      (selector: (s: { mine: unknown[] }) => unknown) =>
        selector({
          mine: [
            {
              speciesId: 'garchomp',
              speciesName: 'Garchomp',
              sp: { spe: 4 },
              natureId: 'jolly',
              itemId: 'garchompite',
              megaFormId: 'garchomp-mega',
              megaActive: false,
            },
            null,
            null,
            null,
            null,
            null,
          ],
        }),
    )
    mocks.buildSpeedTiers.mockResolvedValue({
      rows: [
        { speciesId: 'garchomp', speciesName: 'Garchomp', finalSpeed: 170, userTeam: true, isMega: false },
        { speciesId: 'garchomp-mega', speciesName: 'Garchomp Mega', finalSpeed: 92, userTeam: true, isMega: true },
      ],
    })

    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mocks.buildSpeedTiers).toHaveBeenCalledWith(
        expect.objectContaining({
          userTeam: expect.arrayContaining([
            expect.objectContaining({ speciesId: 'garchomp' }),
            expect.objectContaining({ speciesId: 'garchomp-mega' }),
          ]),
        }),
      )
    })

    await waitFor(() => expect(screen.getByText('Garchomp')).toBeInTheDocument())
    expect(screen.getByText('Garchomp')).toHaveClass('text-arena-cyan')
    expect(screen.getByText('Garchomp Mega')).toHaveClass('text-arena-cyan')
  })

  it('toggles tailwind modifier', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    const tailwindBtn = screen.getByRole('button', { name: /tailwind/i })
    await user.click(tailwindBtn)
    expect(tailwindBtn).toHaveClass('bg-arena-cyan/15')
  })
})
