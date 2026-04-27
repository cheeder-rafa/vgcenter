import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ImportTeamModal } from '../../../src/features/importer/ImportTeamModal'
import { useImportSessionStore } from '../../../src/features/importer/useImportSessionStore'

function defaultProps() {
  return {
    activeSide: 'attacker' as const,
    accentClassName: 'text-arena-plasma',
    description: 'Import a team.',
    emptyState: 'Nothing loaded.',
    inputLabel: 'Paste',
    inputPlaceholder: 'Paste here',
    submitLabel: 'Import team',
    title: 'Showdown',
    triggerLabel: 'Open import',
    sessionKey: 'test',
    onImport: vi.fn().mockResolvedValue({ team: [] }),
    onImportTeam: vi.fn(),
    onLoadPokemon: vi.fn(),
  }
}

afterEach(() => {
  useImportSessionStore.getState().clearSession('test')
})

describe('ImportTeamModal', () => {
  it('renders the dialog in document.body instead of the trigger container', async () => {
    const user = userEvent.setup()

    render(
      <div data-testid="host">
        <ImportTeamModal {...defaultProps()} />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /open import/i }))

    const dialog = screen.getByRole('dialog')
    const host = screen.getByTestId('host')

    expect(document.body).toContainElement(dialog)
    expect(host).not.toContainElement(dialog)
  })

  it('shows side toggle buttons defaulting to activeSide', async () => {
    const user = userEvent.setup()

    render(<ImportTeamModal {...defaultProps()} activeSide="defender" />)

    await user.click(screen.getByRole('button', { name: /open import/i }))

    const leftBtn = screen.getByRole('button', { name: /left side/i })
    const rightBtn = screen.getByRole('button', { name: /right side/i })

    expect(leftBtn).toHaveAttribute('aria-pressed', 'false')
    expect(rightBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles selected side when clicking the buttons', async () => {
    const user = userEvent.setup()

    render(<ImportTeamModal {...defaultProps()} activeSide="attacker" />)

    await user.click(screen.getByRole('button', { name: /open import/i }))

    const leftBtn = screen.getByRole('button', { name: /left side/i })
    const rightBtn = screen.getByRole('button', { name: /right side/i })

    expect(leftBtn).toHaveAttribute('aria-pressed', 'true')

    await user.click(rightBtn)

    expect(leftBtn).toHaveAttribute('aria-pressed', 'false')
    expect(rightBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onImportTeam with the selected side, not the activeSide prop', async () => {
    const user = userEvent.setup()
    const onImportTeam = vi.fn()
    const mockPokemon = {
      speciesId: 'pikachu',
      speciesName: 'Pikachu',
      nickname: null,
      level: 50,
      gender: null,
      abilityId: 'static',
      itemId: null,
      natureId: null,
      sp: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      stats: { hp: 100, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
      moveIds: [],
    }
    const onImport = vi.fn().mockResolvedValue({ team: [mockPokemon] })

    render(
      <ImportTeamModal
        {...defaultProps()}
        activeSide="attacker"
        onImport={onImport}
        onImportTeam={onImportTeam}
      />,
    )

    await user.click(screen.getByRole('button', { name: /open import/i }))

    // toggle to Right Side
    await user.click(screen.getByRole('button', { name: /right side/i }))

    await user.click(screen.getByRole('button', { name: /import team/i }))

    expect(onImportTeam).toHaveBeenCalledWith('defender', [mockPokemon])
  })

  it('persists imported team across modal close and reopen', async () => {
    const user = userEvent.setup()
    const mockPokemon = {
      speciesId: 'charizard',
      speciesName: 'Charizard',
      nickname: null,
      level: 50,
      gender: null,
      abilityId: 'blaze',
      itemId: null,
      natureId: null,
      sp: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      stats: { hp: 100, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
      moveIds: [],
    }

    // onImport returns a team with 1 entry but team.length > 0 would close modal
    // so simulate the path where team stays visible (team returned empty from onImportTeam path)
    // Instead directly seed the session store to test persistence
    useImportSessionStore.getState().setSession('test', [mockPokemon])

    render(<ImportTeamModal {...defaultProps()} />)

    await user.click(screen.getByRole('button', { name: /open import/i }))

    expect(screen.getByText('1 loaded')).toBeInTheDocument()
    expect(screen.getByText('Charizard')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    await user.click(screen.getByRole('button', { name: /open import/i }))

    expect(screen.getByText('1 loaded')).toBeInTheDocument()
    expect(screen.getByText('Charizard')).toBeInTheDocument()
  })

  it('shows the active import target side in the modal copy', async () => {
    const user = userEvent.setup()

    render(<ImportTeamModal {...defaultProps()} activeSide="defender" />)

    await user.click(screen.getByRole('button', { name: /open import/i }))

    expect(screen.getByText(/import target/i)).toBeInTheDocument()
    const rightBtn = screen.getByRole('button', { name: /right side/i })
    expect(rightBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
