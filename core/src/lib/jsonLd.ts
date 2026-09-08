import { mediaAbsoluteUrl } from './media.js'

/**
 * Los datos estructurados que tiene toda web: quién es, que es un sitio web, y las migas.
 *
 * Viajaba copiado dentro de cada sitio, idéntico, así que una errata aquí era una errata en
 * todas y había que llevarla a mano a cada repositorio. Aquí se prueba una vez —y se muta—
 * y las webs reciben el arreglo actualizando el paquete.
 *
 * Se ata a la dirección del sitio porque **todo lo que declara identidad depende de ella**:
 * el `@id` de la organización es esa URL, y si apunta al subdominio de la plataforma se le
 * está diciendo a un buscador que la versión buena de la web es la desechable. En la web
 * vive en un solo sitio (`lib/site.ts`), y de ahí sale una vez, aquí.
 */

/**
 * Lo que el grafo lee de los ajustes.
 *
 * Declarado, no importado: cada web genera su `payload-types.ts`, y traerlo aquí ataría el
 * núcleo al CMS de un sitio —añadir un campo allí sería un cambio incompatible aquí—.
 */
export type JsonLdSettings = {
  siteName?: string | null
  tagline?: string | null
  seoDescription?: string | null
  heroText?: string | null
  logo?: unknown
  instagram?: string | null
  facebook?: string | null
  youtube?: string | null
  city?: string | null
  email?: string | null
  /**
   * Es una decisión del negocio —`MusicGroup` para un colectivo, `LocalBusiness` para un
   * estudio, `Person` para un portafolio—, así que sale de los ajustes y no está cableado.
   */
  schemaType?: string | null
}

export type SiteGraph = ReturnType<typeof siteGraph>

export function siteGraph(siteUrl: string) {
  const ORG_ID = `${siteUrl}/#organization`

  function organizationNode(settings: JsonLdSettings | null | undefined) {
    const logo = mediaAbsoluteUrl(settings?.logo, siteUrl)
    const description = settings?.seoDescription || settings?.heroText || undefined
    const sameAs = [settings?.instagram, settings?.facebook, settings?.youtube].filter(
      Boolean,
    ) as string[]

    return {
      '@type': settings?.schemaType || 'Organization',
      '@id': ORG_ID,
      name: settings?.siteName || 'Sitio',
      url: `${siteUrl}/`,
      ...(logo ? { logo, image: logo } : {}),
      ...(description ? { description } : {}),
      ...(settings?.tagline ? { slogan: settings.tagline.trim() } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(settings?.city ? { areaServed: { '@type': 'City', name: settings.city } } : {}),
      ...(settings?.email
        ? {
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              email: settings.email,
              areaServed: 'ES',
              availableLanguage: 'Spanish',
            },
          }
        : {}),
    }
  }

  function websiteNode(settings: JsonLdSettings | null | undefined) {
    return {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: settings?.siteName || 'Sitio',
      inLanguage: 'es-ES',
      publisher: { '@id': ORG_ID },
    }
  }

  /** Las migas de una página interior que cuelga de la portada. */
  function breadcrumbNode(title: string, route: string) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: title, item: `${siteUrl}${route}` },
      ],
    }
  }

  /** El grafo de la portada. Cada módulo mete los suyos en `extra`. */
  function buildHomeJsonLd(settings: JsonLdSettings | null | undefined, extra: object[] = []) {
    return {
      '@context': 'https://schema.org',
      '@graph': [organizationNode(settings), websiteNode(settings), ...extra],
    }
  }

  return { ORG_ID, organizationNode, websiteNode, breadcrumbNode, buildHomeJsonLd }
}
