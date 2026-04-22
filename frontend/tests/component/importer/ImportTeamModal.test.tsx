import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ImportTeamModal } from '../../../src/features/importer/ImportTeamModal'

describe('ImportTeamModal', () => {
  it('renders the dialog in document.body instead of the trigger container', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn().mockResolvedValue({ team: [] })

    render(
      <div data-testid="host">
        <ImportTeamModal
          activeSide="attacker"
          accentClassName="text-arena-plasma"
          description="Import a team."
          emptyState="Nothing loaded."
          inputLabel="Paste"
          inputPlaceholder="Paste here"
          submitLabel="Import team"
          title="Showdown"
          triggerLabel="Open import"
          onImport={onImport}
          onImportTeam={vi.fn()}
          onLoadPokemon={vi.fn()}
        />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /open import/i }))

    const dialog = screen.getByRole('dialog')
    const host = screen.getByTestId('host')

    expect(document.body).toContainElement(dialog)
    expect(host).not.toContainElement(dialog)
  })

  it('shows the active import target side in the modal copy', async () => {
    const user = userEvent.setup()

    render(
      <ImportTeamModal
        activeSide="defender"
        accentClassName="text-arena-cyan"
        description="Import a team."
        emptyState="Nothing loaded."
        inputLabel="Paste"
        inputPlaceholder="Paste here"
        submitLabel="Import team"
        title="Showdown"
        triggerLabel="Open import"
        onImport={vi.fn().mockResolvedValue({ team: [] })}
        onImportTeam={vi.fn()}
        onLoadPokemon={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /open import/i }))

    expect(screen.getByText(/import target/i)).toBeInTheDocument()
    expect(screen.getByText(/right side/i)).toBeInTheDocument()
  })
})
