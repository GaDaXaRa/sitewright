import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'

/**
 * The presentation, whole. It is the paragraph an assistant quotes when someone asks "who
 * are they?", so it goes in as written rather than summarised.
 */
export function aboutSection(_items: unknown[], ctx: LlmsContext): LlmsSection {
  // No sale de una colección: la presentación vive en los ajustes del sitio.
  const text = ctx.settings?.about
  return {
    title: ctx.title,
    lines: text?.trim() ? text.trim().split(/\n\s*\n/).map((p) => p.trim()) : [],
  }
}
