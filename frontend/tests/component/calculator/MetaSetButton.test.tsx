import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MetaSetButton } from '../../../src/features/calculator/components/MetaSetButton'
import type { MetaSet } from '../../../src/features/calculator/data/metaSets'
import { PIKALYTICS_SOURCE } from '../../../src/features/calculator/data/metaSets'

const sneaslerSet: MetaSet = {
  speciesId: 'sneasler',
  abilityId: 'unburden',
  itemId: 'sitrus-berry',
  moveIds: ['poison-jab', 'dire-claw', 'close-combat', 'protect'],
  ...PIKALYTICS_SOURCE,
}

describe('MetaSetButton', () => {
  it('renders nothing when metaSet is null', () => {
    const { container } = render(
      <MetaSetButton metaSet={null} onApply={vi.fn()} accent="plasma" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a button with an accessible label when a meta set is provided', () => {
    render(
      <MetaSetButton metaSet={sneaslerSet} onApply={vi.fn()} accent="plasma" />,
    )
    expect(
      screen.getByRole('button', { name: /use meta set/i }),
    ).toBeInTheDocument()
  })

  it('calls onApply with the meta set when the button is clicked', async () => {
    const onApply = vi.fn()
    render(
      <MetaSetButton metaSet={sneaslerSet} onApply={onApply} accent="plasma" />,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /use meta set/i }))
    expect(onApply).toHaveBeenCalledOnce()
    expect(onApply).toHaveBeenCalledWith(sneaslerSet)
  })

  it('does NOT call onApply before the button is clicked (no silent apply)', () => {
    const onApply = vi.fn()
    render(
      <MetaSetButton metaSet={sneaslerSet} onApply={onApply} accent="plasma" />,
    )
    expect(onApply).not.toHaveBeenCalled()
  })

  it('shows visible source credit with a link to Pikalytics', () => {
    render(
      <MetaSetButton metaSet={sneaslerSet} onApply={vi.fn()} accent="plasma" />,
    )
    const link = screen.getByRole('link', { name: /pikalytics/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', expect.stringContaining('pikalytics.com'))
  })

  it('renders with cyan accent styling when accent is cyan', () => {
    render(
      <MetaSetButton metaSet={sneaslerSet} onApply={vi.fn()} accent="cyan" />,
    )
    const btn = screen.getByRole('button', { name: /use meta set/i })
    expect(btn.className).toMatch(/cyan/)
  })
})
