import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { site } from '@/site.config'
import { modules, type Content } from '@/site.modules'
import { publishedSections } from '@/lib/modules'
import type { SiteSetting } from '@/payload-types'

/**
 * Lo que las páginas públicas leen del CMS, cacheado por render.
 *
 * Dos cosas que garantiza. La primera, que `generateMetadata` y la página compartan una
 * consulta en vez de preguntar dos veces. La segunda, **que la web se degrade en vez de
 * romperse**: si la base no responde mientras se genera una página, sale igual con los
 * valores por defecto.
 *
 * Recorre el manifiesto, así que añadir un módulo no toca este fichero.
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

/** Lo que cada módulo aporta cuando no hay base de datos: nada, pero de la forma correcta. */
function empty(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const module of modules) {
    if (module.query && module.variable) out[module.variable] = module.pick ? null : []
  }
  return out
}

export const loadSiteContent = cache(async (): Promise<Content> => {
  // El momento en que se genera la página. Viaja con los datos porque un componente no
  // debe mirar el reloj mientras pinta: el mismo render colocaría una fecha como próxima
  // o pasada según cuándo le tocara ejecutarse a React.
  const now = Date.now()

  try {
    const payload = await getPayload({ config: await config })
    const queried = modules.filter((m) => m.query)

    const [settings, ...results] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings' }),
      ...queried.map((m) =>
        payload.find({
          collection: m.query!.collection as never,
          where: m.query!.where,
          limit: m.query!.limit ?? 100,
          sort: m.query!.sort,
          depth: m.query!.depth,
        }),
      ),
    ])

    const content: Record<string, unknown> = {}
    queried.forEach((module, i) => {
      const docs = results[i]!.docs as Record<string, unknown>[]
      if (module.variable) content[module.variable] = module.pick ? module.pick(docs, now) : docs
    })

    // El único sitio donde se afirma la forma: `site.modules.ts` declara el tipo y este
    // bucle lo rellena. Un módulo que declare mal su variable se ve en la portada.
    return { settings: (settings as SiteSetting) ?? FALLBACK, ...content, now } as Content
  } catch (err) {
    console.error('No se pudo cargar el contenido del sitio:', err)
    return { settings: FALLBACK, ...empty(), now: Date.now() } as Content
  }
})

/**
 * El menú, con sólo lo que tiene algo dentro.
 *
 * Un enlace a una página que dice «todavía no hay nada publicado» es peor que no tener
 * enlace: se lo come quien entra y se lo come Google, que clasifica la web como fina y
 * deja de indexarla. La condición es la misma que decide el sitemap.
 */
export const visibleNav = cache(async (): Promise<{ href: string; label: string }[]> => {
  const content = await loadSiteContent()
  const conRuta = new Set(publishedSections(modules, content as Record<string, unknown>).map((m) => m.route))
  return site.nav.filter((link) => conRuta.has(link.href))
})
