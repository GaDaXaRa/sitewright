export const wiring = {
  id: 'faq',
  variable: 'faqs',
  collectionImport: "import { faqCollection } from './modules/faq/collection'",
  collectionCall: (m) => `faqCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  dataQuery: () =>
    `payload.find({ collection: 'faqs', where: { active: { equals: true } }, limit: 100, sort: 'order' })`,
  sectionImport: "import FaqSection from '@/modules/faq/Section'",
  sectionRender: (m) => `<FaqSection faqs={faqs} title="${m.title}" tone={faqTone ?? undefined} />`,
  renders: 'faqs.length > 0',
  jsonldImport: "import { faqNode } from '@/modules/faq/jsonld'",
  jsonldNodes: () => `...(faqs.length ? [faqNode(faqs)] : [])`,
  llmsImport: "import { faqSection } from '@/modules/faq/llms'",
  llmsSection: (m) => `faqSection(faqs, '${m.title}')`,
}
