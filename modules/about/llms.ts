import type { LlmsSection } from '@/lib/llmsTxt'

/**
 * The presentation, whole. It is the paragraph an assistant quotes when someone asks "who
 * are they?", so it goes in as written rather than summarised.
 */
export function aboutSection(text: string | null | undefined, title: string): LlmsSection {
  return {
    title,
    lines: text?.trim() ? text.trim().split(/\n\s*\n/).map((p) => p.trim()) : [],
  }
}
