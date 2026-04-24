import { describe, expect, it } from 'vitest'

import { validatePokepasteUrl } from '../../../src/features/importer/validatePokepasteUrl'

describe('validatePokepasteUrl', () => {
  it('accepts a well-formed pokepast.es URL', () => {
    expect(validatePokepasteUrl('https://pokepast.es/abcd123')).toBeNull()
  })

  it('accepts a /raw suffix', () => {
    expect(validatePokepasteUrl('https://pokepast.es/abcd123/raw')).toBeNull()
  })

  it('rejects http scheme', () => {
    expect(validatePokepasteUrl('http://pokepast.es/abcd123')).toMatch(/https/)
  })

  it('rejects unknown host', () => {
    expect(validatePokepasteUrl('https://attacker.com/abcd123')).toMatch(
      /pokepast/,
    )
  })

  it('rejects userinfo', () => {
    expect(
      validatePokepasteUrl('https://user:pass@pokepast.es/abcd123'),
    ).toMatch(/credentials/)
  })

  it('rejects custom ports', () => {
    expect(validatePokepasteUrl('https://pokepast.es:8080/abcd123')).toMatch(
      /ports/,
    )
  })

  it('rejects bad path shape', () => {
    expect(validatePokepasteUrl('https://pokepast.es/a')).toMatch(/path/)
  })

  it('rejects multi-segment path', () => {
    expect(validatePokepasteUrl('https://pokepast.es/abc/def')).toMatch(/path/)
  })

  it('rejects query string', () => {
    expect(validatePokepasteUrl('https://pokepast.es/abcd123?x=1')).toMatch(
      /Query/,
    )
  })

  it('rejects empty input', () => {
    expect(validatePokepasteUrl('   ')).toMatch(/Enter/)
  })

  it('rejects garbage input', () => {
    expect(validatePokepasteUrl('not a url')).toMatch(/valid URL/)
  })
})
