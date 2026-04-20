import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../../../src/features/calculator/api/datasetApi'

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('datasetApi', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the pokedex for a regulation', async () => {
    fetchMock.mockResolvedValue(okJson([]))

    await fetchPokedex('M-A')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/dataset/pokedex?regulation=M-A',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('fetches moves, abilities, items, natures with the right query', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(okJson([])))

    await fetchMoves('M-A')
    await fetchAbilities('M-A')
    await fetchItems('M-A')
    await fetchNatures('M-A')

    const urls = fetchMock.mock.calls.map((call) => call[0] as string)
    expect(urls).toEqual([
      '/api/v1/dataset/moves?regulation=M-A',
      '/api/v1/dataset/abilities?regulation=M-A',
      '/api/v1/dataset/items?regulation=M-A',
      '/api/v1/dataset/natures?regulation=M-A',
    ])
  })
})
