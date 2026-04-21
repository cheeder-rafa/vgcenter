import { describe, expect, it } from 'vitest'

import {
  buildClassicArtworkUrl,
  buildReadableMirrorUrl,
  buildMegaSpriteFilename,
} from '../../../../scripts/download-mega-sprites.mjs'

describe('download-mega-sprites helpers', () => {
  it('builds deterministic source URLs and output filenames', () => {
    expect(buildClassicArtworkUrl('charizard-mega-x')).toBe(
      'https://img.pokemondb.net/artwork/vector/charizard-mega-x.png',
    )
    expect(
      buildReadableMirrorUrl(
        'https://www.pokebeach.com/2026/01/official-artwork-of-all-legends-z-a-mega-evolutions-revealed',
      ),
    ).toBe(
      'https://r.jina.ai/http://www.pokebeach.com/2026/01/official-artwork-of-all-legends-z-a-mega-evolutions-revealed',
    )
    expect(buildMegaSpriteFilename('charizard')).toBe('charizard-mega.png')
    expect(buildMegaSpriteFilename('meowstic-female')).toBe(
      'meowstic-female-mega.png',
    )
  })
})
