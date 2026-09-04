import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import { parseEmbed } from 'sitewright-core'
import type { MediaItem } from './Section'

/** Title, who signs it and where it really lives — the platform link, not the player one. */
export function mediaSection(items: MediaItem[], ctx: LlmsContext): LlmsSection {
  return {
    title: ctx.title,
    lines: items.map((item) =>
      `- ${[item.title, item.author, parseEmbed(item.url)?.canonicalUrl].filter(Boolean).join(' · ')}`,
    ),
  }
}
