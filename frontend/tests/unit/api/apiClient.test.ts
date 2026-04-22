import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requestJson } from '../../../src/lib/api-client'

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('api-client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses VITE_API_BASE_URL when present', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.vgcenter.example/api/v1/')
    fetchMock.mockResolvedValue(okJson({ ok: true }))

    await requestJson('/dataset/moves')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vgcenter.example/api/v1/dataset/moves',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })

  it('falls back to the local relative api path when VITE_API_BASE_URL is unset', async () => {
    fetchMock.mockResolvedValue(okJson({ ok: true }))

    await requestJson('/dataset/moves')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/dataset/moves',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
  })
})
