import type { LlmsSection } from '@/lib/llmsTxt'
import type { Question } from './Section'

/** Question and answer in full: this is the section assistants quote verbatim. */
export function faqSection(faqs: Question[], title: string): LlmsSection {
  return { title, lines: faqs.flatMap((faq) => [`### ${faq.question}`, faq.answer, '']) }
}
