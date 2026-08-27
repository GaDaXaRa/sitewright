import { ORG_ID } from '@/lib/jsonLd'
import { SITE_URL } from '@/lib/site'
import type { Price } from './Section'

/**
 * The price list as an `OfferCatalog`.
 *
 * Only closed prices go in: a search engine drops an incomplete offer, so publishing "a
 * convenir" as an Offer adds noise and no answer. It stays visible on the page, where a
 * person can read it.
 */
export function pricingNodes(prices: Price[], route: string, name: string) {
  const offers = prices
    .filter((price) => price.priceKind !== 'agreed' && price.price != null)
    .map((price) => ({
      '@type': 'Offer',
      name: price.name,
      price: price.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${route}`,
      ...(price.period
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: price.price,
              priceCurrency: 'EUR',
              unitText: price.period,
            },
          }
        : {}),
    }))

  if (!offers.length) return []

  return [
    {
      '@type': 'OfferCatalog',
      '@id': `${SITE_URL}${route}#catalogo`,
      name,
      url: `${SITE_URL}${route}`,
      provider: { '@id': ORG_ID },
      itemListElement: offers,
    },
  ]
}
