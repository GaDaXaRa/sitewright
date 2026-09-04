import type { LlmsSection } from '@/lib/llmsTxt'
import type { Partner } from './Section'

/** Con quién cuentan, que es de las primeras cosas que se preguntan de un colectivo. */
export function partnersSection(partners: Partner[], title: string): LlmsSection {
  return {
    title,
    lines: partners.map((partner) =>
      partner.url ? `- ${partner.name} (${partner.url})` : `- ${partner.name}`,
    ),
  }
}
