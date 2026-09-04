export const wiring = {
  id: 'pricing',
  collectionSlug: 'pricing',
  variable: 'pricing',
  collectionImport: "import { pricingCollection } from './modules/pricing/collection'",
  collectionCall: (m, bp) =>
    `pricingCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${bp.modules.catalog ? ", linkedTo: 'catalog'" : ''} })`,
  query: { collection: 'pricing', where: { active: { equals: true } }, limit: 50, sort: 'order' },
  sectionImport: "import PricingSection from '@/modules/pricing/Section'",
  sectionRender: (m, bp) =>
    `<PricingSection items={pricing} title="${m.title}" tone={pricingTone ?? undefined}${bp.modules.contact ? ' ctaHref="/#contacto"' : ''} />`,
  renders: 'pricing.length > 0',
  jsonldImport: "import { pricingNodes } from '@/modules/pricing/jsonld'",
  jsonldNodes: (m) => `...pricingNodes(pricing, '${m.route}', '${m.title}')`,
  llmsImport: "import { pricingSection } from '@/modules/pricing/llms'",
  llmsName: 'pricingSection',
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  indexPage: (m, bp) => ({
    path: `src/app/(frontend)${m.route}/page.tsx`,
    source: `import React from 'react'
import type { Metadata } from 'next'

import InnerPage from '../components/InnerPage'
import JsonLd from '../components/JsonLd'
import PricingSection from '@/modules/pricing/Section'
import { pricingNodes } from '@/modules/pricing/jsonld'
import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'

export const revalidate = 300

export const metadata: Metadata = {
  title: '${m.labels.plural}',
  alternates: { canonical: '${m.route}' },
}

export default async function PricingPage() {
  const { settings, pricing } = await loadSiteContent()

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, pricingNodes(pricing, '${m.route}', '${m.title}'))} />
      <InnerPage settings={settings} title="${m.labels.plural}">
        <PricingSection items={pricing} title=""${bp.modules.contact ? ' ctaHref="/#contacto"' : ''} />
      </InnerPage>
    </>
  )
}
`,
  }),

  seed: (m) => `  const pricingCount = await payload.count({ collection: 'pricing' })
  if (pricingCount.totalDocs === 0) {
    const examples = [
      { name: 'Básica', price: 20, period: 'al mes', order: 0 },
      { name: 'Completa', price: 35, period: 'al mes', order: 1, highlighted: true },
      // One "a convenir" on purpose: it is the case that must never be published as an
      // Offer, and having it in the seed means the audit sees it from day one.
      { name: 'A medida', priceKind: 'agreed' as const, order: 2 },
    ]
    for (const example of examples) {
      await payload.create({ collection: 'pricing', data: { ...example, active: true } })
    }
    payload.logger.info('3 ${m.labels.plural.toLowerCase()} de ejemplo')
  }`,
}
