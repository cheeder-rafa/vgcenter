import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CellFlagsLegend } from '../../../src/features/gameplan/components/CellFlagsLegend'

describe('CellFlagsLegend', () => {
  it('renders every turn-1 flag label with a tooltip description', () => {
    render(<CellFlagsLegend />)

    // Badge labels
    expect(screen.getByText('PRO')).toBeInTheDocument()
    expect(screen.getByText('RED')).toBeInTheDocument()
    expect(screen.getByText('FO')).toBeInTheDocument()
    expect(screen.getByText('PRI')).toBeInTheDocument()
    expect(screen.getByText('TW')).toBeInTheDocument()
    expect(screen.getByText('TR')).toBeInTheDocument()

    // Tooltip descriptions via title attribute
    expect(screen.getByTitle(/protect/i)).toBeInTheDocument()
    expect(screen.getByTitle(/redirection/i)).toBeInTheDocument()
    expect(screen.getByTitle(/fake out/i)).toBeInTheDocument()
    expect(screen.getByTitle(/priority/i)).toBeInTheDocument()
    expect(screen.getByTitle(/tailwind/i)).toBeInTheDocument()
    expect(screen.getByTitle(/trick room/i)).toBeInTheDocument()
  })
})
