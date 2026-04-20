import viteConfig from '../../vite.config'

describe('vite config', () => {
  it('proxies API requests to the backend during local development', () => {
    expect(viteConfig.server?.proxy).toMatchObject({
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    })
  })
})
