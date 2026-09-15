import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { site } from '@/site.config'
import { modules, type Content } from '@/site.modules'
import { publishedSections } from '@/lib/modules'
import type { SiteSetting } from '@/payload-types'

/** A failed CMS read must not become a successful, empty ISR page. */
export const loadSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayload({ config: await config })
  return await payload.findGlobal({ slug: 'site-settings' })
})

export const loadSiteContent = cache(async (): Promise<Content> => {
  // El momento en que se genera la página. Viaja con los datos porque un componente no
  // debe mirar el reloj mientras pinta: el mismo render colocaría una fecha como próxima
  // o pasada según cuándo le tocara ejecutarse a React.
  const now = Date.now()

  try {
    const payload = await getPayload({ config: await config })
    const queried = modules.filter((m) => m.query)

    const [settings, ...results] = await Promise.all([
      loadSettings(),
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
    return { settings: settings as SiteSetting, ...content, now } as Content
  } catch (err) {
    console.error('No se pudo cargar el contenido del sitio:', err)
    throw err
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
