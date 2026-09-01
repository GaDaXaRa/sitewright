import { describe, it, expect, afterEach } from 'vitest'
import { resolveSiteUrl } from '../src/lib/site.js'

/**
 * Every declaration of identity — canonical, sitemap, robots, the JSON-LD `@id`s — reads
 * this. In Organic Yoga it pointed at the throwaway *.vercel.app subdomain for weeks,
 * telling Google the good version of the site was the disposable one.
 */
const original = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = original
})

const withEnv = (vars: Record<string, string | undefined>, run: () => void) => {
  const before = { ...process.env }
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  try {
    run()
  } finally {
    process.env = before
  }
}

describe('cuando todavía no hay dominio', () => {
  it('usa la dirección que Vercel da al proyecto', () => {
    // El estado normal de una web durante la semana en que se construye: sin dominio
    // comprado. Declarar uno que nadie ha comprado es decirle a Google que la versión buena
    // es una dirección que no responde.
    withEnv(
      { NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: 'sandunguera.vercel.app' },
      () => expect(resolveSiteUrl('')).toBe('https://sandunguera.vercel.app'),
    )
  })

  it('quita la barra final también de lo que da la plataforma', () => {
    // Todo lo demás concatena rutas, y una barra de más son direcciones con doble barra:
    // para un buscador, otra página distinta.
    withEnv(
      { NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: 'marta.vercel.app/' },
      () => expect(resolveSiteUrl('')).toBe('https://marta.vercel.app'),
    )
  })

  it('sin fallback ninguno se comporta igual que con uno vacío', () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' }, () =>
      expect(resolveSiteUrl()).toBe('https://x.vercel.app'),
    )
  })

  it('en local, y sin nada, cae en localhost en vez de inventarse un dominio', () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined }, () =>
      expect(resolveSiteUrl('')).toBe('http://localhost:3000'),
    )
  })

  it('lo que se ha decidido gana a lo que da la plataforma', () => {
    withEnv(
      { NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' },
      () => expect(resolveSiteUrl('https://www.ejemplo.es')).toBe('https://www.ejemplo.es'),
    )
    withEnv(
      { NEXT_PUBLIC_SITE_URL: 'https://otro.es', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' },
      () => expect(resolveSiteUrl('https://www.ejemplo.es')).toBe('https://otro.es'),
    )
  })
})

describe('resolveSiteUrl', () => {
  it('uses the site fallback when the environment says nothing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL

    expect(resolveSiteUrl('https://ejemplo.es')).toBe('https://ejemplo.es')
  })

  it('lets the environment win, so a new domain needs no code change', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.otro.es'

    expect(resolveSiteUrl('https://ejemplo.es')).toBe('https://www.otro.es')
  })

  it('ignores an empty variable instead of declaring the site homeless', () => {
    process.env.NEXT_PUBLIC_SITE_URL = ''

    expect(resolveSiteUrl('https://ejemplo.es')).toBe('https://ejemplo.es')
  })

  // Everything else concatenates paths (`${SITE_URL}/eventos`): with the slash left in, the
  // result has a double slash, which a search engine reads as a different URL.
  it('strips the trailing slash, whoever wrote it', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.otro.es/'

    expect(resolveSiteUrl('https://ejemplo.es')).toBe('https://www.otro.es')
    expect(resolveSiteUrl('https://ejemplo.es/')).toBe('https://www.otro.es')
  })
})
