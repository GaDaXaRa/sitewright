import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { site } from '@/site.config'
import type { SiteSetting } from '@/payload-types'

/**
 * What the public pages read from the CMS, cached per render.
 *
 * Two things it guarantees. First, `generateMetadata` and the page itself share a single
 * query instead of asking twice. Second, **the site degrades instead of breaking**: if the
 * database is unreachable while a page is generated, the build still produces a page with
 * the defaults rather than failing.
 *
 * Each module the generator adds extends `loadSiteContent` with its own query.
 */
const FALLBACK = { id: 0, siteName: site.name } as SiteSetting

export const loadSettings = cache(async (): Promise<SiteSetting> => {
  try {
    const payload = await getPayload({ config: await config })
    return (await payload.findGlobal({ slug: 'site-settings' })) ?? FALLBACK
  } catch (err) {
    console.error('No se pudieron leer los ajustes del sitio:', err)
    return FALLBACK
  }
})

export const loadSiteContent = cache(async () => {
  const settings = await loadSettings()
  // The moment the page is generated. It travels with the data because a component must
  // not read the clock while rendering: the same render would place a dated item as
  // upcoming or past depending on when React happened to run it.
  return { settings, now: Date.now() }
})

/**
 * El menú, con sólo lo que tiene algo dentro.
 *
 * Un enlace a una página que dice «todavía no hay nada publicado» es peor que no tener
 * enlace: se lo come quien entra y se lo come Google, que clasifica la web como fina y
 * deja de indexarla. El generador escribe aquí una condición por sección; sin secciones,
 * el menú es el que diga la configuración.
 */
export const visibleNav = cache(async (): Promise<{ href: string; label: string }[]> => [
  ...site.nav,
])
