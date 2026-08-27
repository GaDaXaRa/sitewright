import type { LlmsSection } from '@/lib/llmsTxt'
import { SITE_URL } from '@/lib/site'

type Item = { title: string; slug?: string | null; summary?: string | null }

/** One line each: what it is, in one breath, and where to read more. Nothing invented. */
export function catalogSection(items: Item[], title: string, route: string): LlmsSection {
  return {
    title,
    lines: items.map((item) =>
      `- ${[item.title, item.summary, item.slug ? `${SITE_URL}${route}/${item.slug}` : '']
        .filter(Boolean)
        .join(' · ')}`,
    ),
  }
}
