import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import { SITE_URL } from '@/lib/site'
import type { Person } from './Section'

export function teamSection(items: Person[], ctx: LlmsContext): LlmsSection {
  return {
    title: ctx.title,
    lines: items.map((person) => {
      const role = person.role ? ` — ${person.role}` : ''
      const url = person.slug ? ` (${SITE_URL}${ctx.route}/${person.slug})` : ''
      return `- ${person.name}${role}${url}`
    }),
  }
}
