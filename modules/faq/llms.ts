import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import type { Question } from './Section'

/** Question and answer in full: this is the section assistants quote verbatim. */
export function faqSection(items: Question[], ctx: LlmsContext): LlmsSection {
  return { title: ctx.title, lines: items.flatMap((faq) => [`### ${faq.question}`, faq.answer, '']) }
}
