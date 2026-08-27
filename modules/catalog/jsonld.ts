import { ORG_ID } from '@/lib/jsonLd'
import { SITE_URL } from '@/lib/site'
import { mediaAbsoluteUrl } from '@sitewright/core'

type Item = {
  id: number | string
  title: string
  slug?: string | null
  summary?: string | null
  body?: { text: string }[] | null
  image?: unknown
  publishedAt?: string | null
}

type Offer = { name: string; price?: number | null; priceKind?: string | null; period?: string | null }

/**
 * Each catalogue item as a `Service` (or whatever the business is selling), with its prices
 * attached **through the relationship**, never matched by name — names diverge, and pairing
 * on them is how a price ends up on the wrong thing.
 *
 * A price that is "a convenir" is left out: a search engine drops an incomplete offer, and
 * writing a number nobody agreed to is worse than writing none.
 */
export function catalogNodes(items: Item[], route: string, offersFor: (item: Item) => Offer[] = () => []) {
  return items.map((item) => {
    const url = item.slug ? `${SITE_URL}${route}/${item.slug}` : undefined
    const image = mediaAbsoluteUrl(item.image, SITE_URL)
    const description =
      item.summary ||
      (item.body ?? [])
        .map((p) => p.text)
        .filter(Boolean)
        .join(' ') ||
      undefined

    const offers = offersFor(item)
      .filter((offer) => offer.priceKind !== 'agreed' && offer.price != null)
      .map((offer) => ({
        '@type': 'Offer',
        name: offer.name,
        price: offer.price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        ...(url ? { url } : {}),
        ...(offer.period
          ? {
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: offer.price,
                priceCurrency: 'EUR',
                unitText: offer.period,
              },
            }
          : {}),
      }))

    return {
      '@type': 'Service',
      name: item.title,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
      ...(url ? { url } : {}),
      provider: { '@id': ORG_ID },
      ...(offers.length ? { offers } : {}),
    }
  })
}
