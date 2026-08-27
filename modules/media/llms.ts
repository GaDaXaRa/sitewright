import type { LlmsSection } from '@/lib/llmsTxt'
import { parseEmbed } from '@sitewright/core'
import type { MediaItem } from './Section'

/** Title, who signs it and where it really lives — the platform link, not the player one. */
export function mediaSection(items: MediaItem[], title: string): LlmsSection {
  return {
    title,
    lines: items.map((item) =>
      `- ${[item.title, item.author, parseEmbed(item.url)?.canonicalUrl].filter(Boolean).join(' · ')}`,
    ),
  }
}
