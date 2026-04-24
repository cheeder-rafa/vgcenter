import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PatchNotesModal } from '../../src/features/calculator/components/PatchNotesModal'

describe('PatchNotesModal', () => {
  it('renders nothing when closed', () => {
    render(<PatchNotesModal isOpen={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog when open', () => {
    render(<PatchNotesModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('contains a "What\'s New" section', () => {
    render(<PatchNotesModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByText(/what'?s new/i)).toBeInTheDocument()
  })

  it('contains a "Known Issues" section', () => {
    render(<PatchNotesModal isOpen={true} onClose={() => {}} />)
    expect(screen.getAllByText(/known issues/i).length).toBeGreaterThan(0)
  })

  it('mentions Preview Coach in patch notes', () => {
    render(<PatchNotesModal isOpen={true} onClose={() => {}} />)
    expect(screen.getAllByText(/preview coach/i).length).toBeGreaterThan(0)
  })

  it('clicking close button calls onClose', async () => {
    const user = userEvent.setup()
    let closed = false
    render(<PatchNotesModal isOpen={true} onClose={() => { closed = true }} />)

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(closed).toBe(true)
  })

  it('clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup()
    let closed = false
    render(<PatchNotesModal isOpen={true} onClose={() => { closed = true }} />)

    const backdrop = screen.getByRole('dialog').parentElement!
    await user.click(backdrop)
    expect(closed).toBe(true)
  })
})
