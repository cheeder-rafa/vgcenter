import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SpriteBadge } from '../../../src/features/calculator/components/SpriteBadge'
import { resolveSpriteSources } from '../../../src/features/calculator/components/spriteBadgeSources'

describe('SpriteBadge', () => {
  it('resolves mega sprite candidates before falling back to the base species art', () => {
    expect(resolveSpriteSources('charizard', true)).toEqual([
      '/sprites/charizard-mega.png',
      '/sprites/charizard.png',
      '/sprites/_unknown.png',
    ])
    expect(resolveSpriteSources('charizard', false)).toEqual([
      '/sprites/charizard.png',
      '/sprites/_unknown.png',
    ])
    expect(resolveSpriteSources(null, true)).toEqual(['/sprites/_unknown.png'])
  })

  it('resolves floette to the eternal variant art', () => {
    expect(resolveSpriteSources('floette', false)).toEqual([
      '/sprites/floette-eternal.png',
      '/sprites/_unknown.png',
    ])
  })

  it('normalizes known alternate-form aliases for sprite lookup', () => {
    expect(resolveSpriteSources('aegislash', false)).toEqual([
      '/sprites/aegislash-shield.png',
      '/sprites/_unknown.png',
    ])
    expect(resolveSpriteSources('maushold-four', false)).toEqual([
      '/sprites/maushold.png',
      '/sprites/_unknown.png',
    ])
  })

  it('falls back from mega art to base art and then to the unknown sprite', () => {
    render(
      <SpriteBadge
        speciesId="charizard"
        speciesName="Charizard"
        megaActive
        accent="plasma"
        size="lg"
      />,
    )

    const sprite = screen.getByRole('img', { name: /charizard/i })
    expect(sprite).toHaveAttribute('src', '/sprites/charizard-mega.png')

    fireEvent.error(sprite)
    expect(sprite).toHaveAttribute('src', '/sprites/charizard.png')

    fireEvent.error(sprite)
    expect(sprite).toHaveAttribute('src', '/sprites/_unknown.png')
  })
})
