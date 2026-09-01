import { describe, it, expect, afterAll, vi } from 'vitest'
import { site } from '@/site.config'

/**
 * `SITE_URL` decides which domain the site declares as its own: canonical, sitemap,
 * `robots`, the JSON-LD `@id`s and the middleware redirect. In Organic Yoga it pointed at
 * the throwaway *.vercel.app subdomain for weeks, telling Google the good version of the
 * site was the disposable one.
 *
 * Here the public address **is** a vercel.app one until the collective buys a domain, so
 * what this pins down is different: whatever it says must be the address that actually
 * answers, and changing it must not need a code change.
 *
 * It is a module constant, so each case has to re-import it with the environment set:
 * hence `resetModules` and the `import()` inside each test.
 */
const original = process.env.NEXT_PUBLIC_SITE_URL

async function loadSiteUrl(value?: string): Promise<string> {
  vi.resetModules()
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = value
  return (await import('@/lib/site')).SITE_URL
}

afterAll(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = original
})

describe('the site domain', () => {
  it('falls back to the address the site is actually served from', async () => {
    // Whatever the blueprint wrote in site.config: it must be an address that answers,
    // never a guess at what Vercel will assign.
    expect(await loadSiteUrl()).toBe(site.url)
  })

  it('obeys what Vercel sets, so buying a domain needs no code change', async () => {
    expect(await loadSiteUrl('https://www.ejemplo.es')).toBe('https://www.ejemplo.es')
  })

  // Everything else concatenates paths (`${SITE_URL}/eventos`): with the slash left in,
  // the result has a double slash, which a search engine reads as a different URL.
  it('strips the trailing slash, whoever wrote it', async () => {
    expect(await loadSiteUrl('https://www.ejemplo.es/')).toBe('https://www.ejemplo.es')
  })
})
