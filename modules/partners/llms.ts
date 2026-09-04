import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import type { Partner } from './Section'

/** Con quién cuentan, que es de las primeras cosas que se preguntan de un colectivo. */
export function partnersSection(items: Partner[], ctx: LlmsContext): LlmsSection {
  return {
    title: ctx.title,
    lines: items.map((partner) =>
      partner.url ? `- ${partner.name} (${partner.url})` : `- ${partner.name}`,
    ),
  }
}
