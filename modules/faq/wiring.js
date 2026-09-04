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

  indexPage: (m) => ({
    path: `src/app/(frontend)${m.route}/page.tsx`,
    source: `import React from 'react'
import type { Metadata } from 'next'

import InnerPage from '../components/InnerPage'
import JsonLd from '../components/JsonLd'
import FaqSection from '@/modules/faq/Section'
import { faqNode } from '@/modules/faq/jsonld'
import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'

export const revalidate = 300

export const metadata: Metadata = {
  title: '${m.labels.plural}',
  alternates: { canonical: '${m.route}' },
}

export default async function FaqPage() {
  const { settings, faqs } = await loadSiteContent()

  return (
    <>
      <JsonLd
        data={buildHomeJsonLd(settings, faqs.length ? [faqNode(faqs, '${m.route}#faq')] : [])}
      />
      <InnerPage settings={settings} title="${m.labels.plural}">
        {faqs.length ? (
          <FaqSection items={faqs} title="" context="page" />
        ) : (
          <section className="section">
            <div className="container">
              <p className="empty">Todavía no hay preguntas publicadas.</p>
            </div>
          </section>
        )}
      </InnerPage>
    </>
  )
}
`,
  }),

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
