import type { LlmsSection } from '@/lib/llmsTxt'
import { SITE_URL } from '@/lib/site'
import type { Person } from './Section'

export function teamSection(people: Person[], title: string, route: string): LlmsSection {
  return {
    title,
    lines: people.map((person) => {
      const role = person.role ? ` — ${person.role}` : ''
      const url = person.slug ? ` (${SITE_URL}${route}/${person.slug})` : ''
      return `- ${person.name}${role}${url}`
    }),
  }
}
