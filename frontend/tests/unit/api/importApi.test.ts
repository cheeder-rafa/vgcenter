import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  importPokepaste,
  importShowdown,
} from '../../../src/features/calculator/api/importApi'

describe('importApi', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs a showdown paste and returns the imported team', async () => {
    const team = { team: [] }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(team), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await importShowdown('Gholdengo @ Choice Specs')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/import/showdown',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Gholdengo @ Choice Specs' }),
      }),
    )
    expect(result).toEqual(team)
  })

  it('POSTs a pokepaste URL and returns the imported team', async () => {
    const team = { team: [] }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(team), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await importPokepaste('https://pokepast.es/abcdef')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/import/pokepaste',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://pokepast.es/abcdef' }),
      }),
    )
  })
})
