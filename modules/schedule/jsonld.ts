import { ORG_ID } from '@/lib/jsonLd'
import { SITE_URL } from '@/lib/site'
import { mediaAbsoluteUrl } from '@sitewright/core'
import type { ScheduleItem } from './Row'

/**
 * Each dated item as an `Event`: it is what puts a business in the events box instead of
 * leaving its dates as ordinary paragraphs.
 *
 * A free date is published as `price: 0` on purpose — an answer, not a silence.
 */
export function scheduleNodes(items: (ScheduleItem & { image?: unknown })[], route: string) {
  return items.map((item) => {
    const url = `${SITE_URL}${route}#${item.slug ?? item.id}`
    const image = mediaAbsoluteUrl(item.image, SITE_URL)

    return {
      '@type': 'Event',
      '@id': url,
      name: item.title,
      startDate: item.startsAt,
      ...(item.endsAt ? { endDate: item.endsAt } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: item.venue
        ? 'https://schema.org/OfflineEventAttendanceMode'
        : 'https://schema.org/OnlineEventAttendanceMode',
      url,
      ...(image ? { image } : {}),
      ...(item.description ? { description: item.description } : {}),
      ...(item.venue
        ? {
            location: {
              '@type': 'Place',
              name: item.venue,
              address: {
                '@type': 'PostalAddress',
                ...(item.city ? { addressLocality: item.city } : {}),
                addressCountry: 'ES',
              },
            },
          }
        : {}),
      organizer: { '@id': ORG_ID },
      offers: {
        '@type': 'Offer',
        price: item.free ? 0 : (item.price ?? undefined),
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: item.ticketsUrl || url,
        validFrom: item.startsAt,
      },
    }
  })
}
