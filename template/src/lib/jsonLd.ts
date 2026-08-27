import type { SiteSetting } from '@/payload-types'
import { mediaAbsoluteUrl } from '@sitewright/core'
import { SITE_URL } from './site'

/**
 * The structured data every site has: who it is, that it is a website, and breadcrumbs.
 *
 * The **type** of the organization is a decision of the business — `MusicGroup` for a
 * collective, `LocalBusiness` for a studio, `Person` for a portfolio — so it comes from the
 * settings rather than being wired in. Each module adds its own nodes to the graph.
 */
export const ORG_ID = `${SITE_URL}/#organization`

export function organizationNode(settings: SiteSetting | null | undefined) {
  const logo = mediaAbsoluteUrl(settings?.logo, SITE_URL)
  const description = settings?.seoDescription || settings?.heroText || undefined
  const sameAs = [settings?.instagram, settings?.facebook, settings?.youtube].filter(
    Boolean,
  ) as string[]

  return {
    '@type': settings?.schemaType || 'Organization',
    '@id': ORG_ID,
    name: settings?.siteName || 'Sitio',
    url: `${SITE_URL}/`,
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

export function websiteNode(settings: SiteSetting | null | undefined) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: settings?.siteName || 'Sitio',
    inLanguage: 'es-ES',
    publisher: { '@id': ORG_ID },
  }
}

/** Breadcrumbs for an inner page hanging off the home page. */
export function breadcrumbNode(title: string, route: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${route}` },
    ],
  }
}

/** The home graph. Modules push their nodes into `extra`. */
export function buildHomeJsonLd(
  settings: SiteSetting | null | undefined,
  extra: object[] = [],
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationNode(settings), websiteNode(settings), ...extra],
  }
}
