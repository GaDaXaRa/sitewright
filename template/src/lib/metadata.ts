import type { Metadata } from 'next'
import { mediaUrl, socialCard, socialDescription } from 'sitewright-core'
import type { SiteSetting } from '@/payload-types'
import { site } from '@/site.config'

/**
 * La tarjeta que se ve cuando alguien pega el enlace de una página en un chat.
 *
 * Vive aquí y no en cada ruta porque las dos que sirven contenido —`[seccion]` y
 * `[seccion]/[slug]`— la necesitan igual, y porque escribirla dos veces es como se llega a
 * que una de las dos se quede sin imagen. Que es lo que pasaba: las secciones emitían
 * **sólo un título**, y las fichas título y descripción pero ninguna foto, teniendo cada
 * una la suya delante.
 *
 * Lo de dónde sale cada campo lo decide `socialCard` en el núcleo, probado aparte. Aquí
 * sólo se dice qué fuentes hay y en qué orden.
 */

/** La dirección de la imagen que se anuncia cuando la página no trae ninguna suya. */
export const FALLBACK_SOCIAL_IMAGE = '/tarjeta-social.png'

export function pageMetadata({
  title,
  description,
  image,
  canonical,
  settings,
}: {
  title?: string
  /** Lo que esta página tenga que decir de sí misma. */
  description?: string | null
  /** La foto de esta página: la del documento, la de la sección. */
  image?: string | null
  canonical: string
  settings?: SiteSetting | null
}): Metadata {
  const card = socialCard(
    { description, image },
    // Lo que el sitio tiene para cuando la página no trae nada: primero lo que se escribió
    // para buscadores, luego el texto de la portada; y como imagen, la foto de portada
    // antes que el logotipo, que suele ser un cuadrado con poco que mirar.
    {
      description: settings?.seoDescription || settings?.tagline || settings?.heroText,
      image: mediaUrl(settings?.heroImage) || mediaUrl(settings?.logo),
    },
    // Y si esta web todavía no tiene ni foto ni logotipo, la tarjeta dibujada con su
    // nombre y su color. Sin esto, la puerta de la auditoría pediría algo que en una web
    // recién nacida no se puede dar.
    { image: FALLBACK_SOCIAL_IMAGE },
  )

  const short = socialDescription(card.description)

  return {
    ...(title ? { title } : {}),
    ...(short ? { description: short } : {}),
    alternates: { canonical },
    openGraph: {
      ...(title ? { title } : {}),
      ...(short ? { description: short } : {}),
      url: canonical,
      siteName: site.name,
      ...(card.image ? { images: [{ url: card.image }] } : {}),
    },
  }
}
