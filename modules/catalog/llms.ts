import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import { SITE_URL } from '@/lib/site'

type Item = { title: string; slug?: string | null; summary?: string | null }

/** One line each: what it is, in one breath, and where to read more. Nothing invented. */
export function catalogSection(items: Item[], ctx: LlmsContext): LlmsSection {
  return {
    title: ctx.title,
    lines: items.map((item) =>
      `- ${[item.title, item.summary, item.slug ? `${SITE_URL}${ctx.route}/${item.slug}` : '']
        .filter(Boolean)
        .join(' · ')}`,
    ),
  }
}
