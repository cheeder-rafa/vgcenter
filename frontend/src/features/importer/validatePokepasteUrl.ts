const ALLOWED_HOSTS = new Set(['pokepast.es', 'www.pokepast.es'])
const PATH_PATTERN = /^\/[A-Za-z0-9_-]{3,64}(\/raw)?\/?$/

export function validatePokepasteUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) {
    return 'Enter a Pokepaste URL.'
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'That does not look like a valid URL.'
  }
  if (url.protocol !== 'https:') {
    return 'Only https:// Pokepaste URLs are allowed.'
  }
  if (url.username || url.password) {
    return 'URLs with credentials are not allowed.'
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    return 'Only pokepast.es URLs are allowed.'
  }
  if (url.port && url.port !== '443') {
    return 'Custom ports are not allowed.'
  }
  if (!PATH_PATTERN.test(url.pathname)) {
    return 'That Pokepaste path does not look right.'
  }
  if (url.search || url.hash) {
    return 'Query strings and fragments are not allowed.'
  }
  return null
}
