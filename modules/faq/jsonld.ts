import { SITE_URL } from '@/lib/site'
import type { Question } from './Section'

/**
 * The questions as a `FAQPage`. It is the cheapest structured data there is and the one
 * that most often gets quoted back by an assistant, because it is already an answer.
 */
export function faqNode(faqs: Question[], anchor = '/#faq') {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${anchor}`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}
