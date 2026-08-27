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
