import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SITE_URL } from '@/lib/site'
import { loadSiteContent } from '@/lib/data'
import { modules } from '@/site.modules'
import { publishedSections } from '@/lib/modules'

/**
 * Sólo lo que existe y tiene algo dentro.
 *
 * Anunciar una ruta sin página manda a un buscador a un 404; anunciar una que dice
 * «todavía no hay nada publicado» es pedirle que clasifique la web como fina. Se pregunta
 * al mismo cargador que pinta las páginas, así que el sitemap no puede prometer algo
 * distinto de lo que se va a ver.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await loadSiteContent()

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...publishedSections(modules, content as unknown as Record<string, unknown>).map((module) => ({
      url: `${SITE_URL}${module.route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Las páginas legales se indexan a propósito: son lo que demuestra que la web las tiene.
    { url: `${SITE_URL}/aviso-legal`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Las fichas necesitan la base, así que van dentro del try: sin ella tienen que salir
  // igualmente las páginas fijas.
  try {
    const payload = await getPayload({ config: await config })

    for (const module of modules) {
      if (!module.documentPages || !module.query || !module.route) continue

      const { docs } = await payload.find({
        collection: module.query.collection as never,
        limit: 200,
        depth: 0,
      })

      for (const doc of docs as { slug?: string; updatedAt?: string }[]) {
        if (!doc.slug) continue
        entries.push({
          url: `${SITE_URL}${module.route}/${doc.slug}`,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch {
    // Sin base de datos, al menos salen las páginas fijas.
  }

  return entries
}
