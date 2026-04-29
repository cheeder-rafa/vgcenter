import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { PreviewModeToggle } from '../../../src/features/preview/components/PreviewModeToggle'
import { usePreviewModeStore } from '../../../src/features/preview/store/usePreviewModeStore'

describe('PreviewModeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    usePreviewModeStore.setState({ mode: 'beginner' })
  })

  it('renders both options with beginner active by default', () => {
    render(<PreviewModeToggle />)
    const beginner = screen.getByRole('radio', { name: /beginner/i })
    const expert = screen.getByRole('radio', { name: /expert/i })
    expect(beginner).toHaveAttribute('aria-checked', 'true')
    expect(expert).toHaveAttribute('aria-checked', 'false')
  })

  it('switches mode when expert is clicked', async () => {
    const user = userEvent.setup()
    render(<PreviewModeToggle />)
    await user.click(screen.getByRole('radio', { name: /expert/i }))
    expect(usePreviewModeStore.getState().mode).toBe('expert')
  })
})
