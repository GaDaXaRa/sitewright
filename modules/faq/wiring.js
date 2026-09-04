export const wiring = {
  id: 'faq',
  collectionSlug: 'faqs',
  variable: 'faqs',
  collectionImport: "import { faqCollection } from './modules/faq/collection'",
  collectionCall: (m) => `faqCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  query: { collection: 'faqs', where: { active: { equals: true } }, limit: 100, sort: 'order' },
  sectionImport: "import FaqSection from '@/modules/faq/Section'",
  sectionRender: (m) => `<FaqSection items={faqs} title="${m.title}" tone={faqTone ?? undefined} />`,
  renders: 'faqs.length > 0',
  jsonldImport: "import { faqNode } from '@/modules/faq/jsonld'",
  jsonldNodes: () => `...(faqs.length ? [faqNode(faqs)] : [])`,
  llmsImport: "import { faqSection } from '@/modules/faq/llms'",
  llmsName: 'faqSection',

  pagePath: '@/modules/faq/Page',
  indexPage: true,

  seed: () => `  const faqsCount = await payload.count({ collection: 'faqs' })
  if (faqsCount.totalDocs === 0) {
    const examples = [
      { question: '¿Cómo se contrata?', answer: 'Escribiendo por el formulario. Contestamos en un par de días.' },
      { question: '¿Cuánto cuesta?', answer: 'Depende de lo que necesites. En Tarifas está lo habitual.' },
      { question: '¿Dónde estáis?', answer: 'Aquí va la respuesta, con las palabras de quien pregunta.' },
    ]
    for (const [i, example] of examples.entries()) {
      await payload.create({ collection: 'faqs', data: { ...example, order: i, active: true } })
    }
    payload.logger.info('3 preguntas de ejemplo')
  }`,
  // It has a page of its own, so it belongs in the menu: a route nothing links to is a
  // page nobody reads, and it took a third site to notice.
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),
}
