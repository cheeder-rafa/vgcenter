import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
import { useSpeedTierStore } from '../../../src/features/speed/store/useSpeedTierStore'

const EMPTY_RAIL = [null, null, null, null, null, null] as const

const BASE_ROWS = [
  {
    speciesId: 'flutter-mane',
    speciesName: 'Flutter Mane',
    finalSpeed: 186,
    userTeam: false,
    isMega: false,
  },
  {
    speciesId: 'incineroar',
    speciesName: 'Incineroar',
    finalSpeed: 80,
    userTeam: true,
    isMega: false,
  },
  {
    speciesId: 'garchomp',
    speciesName: 'Garchomp',
    finalSpeed: 122,
    userTeam: false,
    isMega: false,
  },
  {
    speciesId: 'garchomp-mega',
    speciesName: 'Garchomp Mega',
    finalSpeed: 92,
    userTeam: false,
    isMega: true,
  },
]

beforeEach(() => {
  useSpeedTierStore.setState({ baseRows: [], status: 'idle', error: null })
  mocks.useTeamsStore.mockImplementation(
    (selector: (s: { mine: readonly null[] }) => unknown) =>
      selector({ mine: EMPTY_RAIL }),
  )
  mocks.buildSpeedTiers.mockResolvedValue({ rows: BASE_ROWS })
})

afterEach(() => {
  useSpeedTierStore.setState({ baseRows: [], status: 'idle', error: null })
})

describe('SpeedTierPage', () => {
  it('renders heading', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /speed tier sheet/i }),
    ).toBeInTheDocument()
  })

  it('shows idle empty state on initial render before data loads', () => {
    mocks.buildSpeedTiers.mockReturnValue(new Promise(() => {})) // never resolves
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByText(/add pokémon to your team rail/i),
    ).toBeInTheDocument()
  })

  it('displays base and mega rows in a single unified list', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Flutter Mane')).toBeInTheDocument(),
    )
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

    await waitFor(() =>
      expect(screen.getByText('Incineroar')).toBeInTheDocument(),
    )
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
        {
          speciesId: 'garchomp',
          speciesName: 'Garchomp',
          finalSpeed: 170,
          userTeam: true,
          isMega: false,
        },
        {
          speciesId: 'garchomp-mega',
          speciesName: 'Garchomp Mega',
          finalSpeed: 92,
          userTeam: true,
          isMega: true,
        },
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

    await waitFor(() =>
      expect(screen.getByText('Garchomp')).toBeInTheDocument(),
    )
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

  it('shows "Paralysis" label without division symbol', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /^paralysis$/i })).toBeInTheDocument()
    expect(screen.queryByText(/paralysis ÷2/i)).not.toBeInTheDocument()
  })

  it('tailwind applies only to userTeam rows, not to non-team rows', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Flutter Mane')).toBeInTheDocument(),
    )

    // Speed values only render in [role="cell"] divs (first row of each group)
    const getSpeedCell = (speed: number) => {
      const matches = screen.queryAllByText(speed.toString())
      return matches.find((el) => el.closest('[role="cell"]') !== null)
    }

    expect(getSpeedCell(80)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /tailwind/i }))

    // Flutter Mane (non-team) should still show 186 in a cell
    expect(getSpeedCell(186)).toBeTruthy()
    // Incineroar (userTeam: true) should now show 160 (80 × 2)
    expect(getSpeedCell(160)).toBeTruthy()
    // 80 should no longer appear in a cell
    expect(getSpeedCell(80)).toBeFalsy()
  })

  it('speed table wrapper has overflow-x-auto for narrow screens', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Flutter Mane')).toBeInTheDocument(),
    )

    const table = screen.getByRole('table', { name: /speed tier table/i })
    expect(table.className).toContain('overflow-x-auto')
  })
})
