import { ORG_ID } from '@/lib/jsonLd'
import { SITE_URL } from '@/lib/site'
import { mediaAbsoluteUrl } from 'sitewright-core'
import type { Person } from './Section'

export const personId = (route: string, slug: string) => `${SITE_URL}${route}/${slug}#person`

/**
 * Each person once, referenced by `@id` from the organization and from anything they made.
 * Copying the name into every node is how two spellings of the same person end up on one
 * site, and how a search engine reads them as two people.
 */
export function teamNodes(people: Person[], route: string) {
  return people
    .filter((person) => person.slug)
    .map((person) => {
      const image = mediaAbsoluteUrl(person.photo, SITE_URL)
      const description = (person.bio ?? [])
        .map((p) => p.text)
        .filter(Boolean)
        .join(' ')

      return {
        '@type': 'Person',
        '@id': personId(route, person.slug!),
        name: person.name,
        url: `${SITE_URL}${route}/${person.slug}`,
        ...(person.role ? { jobTitle: person.role } : {}),
        ...(image ? { image } : {}),
        ...(description ? { description } : {}),
        memberOf: { '@id': ORG_ID },
      }
    })
}

/** The reference the organization node uses, so the people are declared once. */
export function memberRefs(people: Person[], route: string) {
  return people.filter((p) => p.slug).map((p) => ({ '@id': personId(route, p.slug!) }))
}
