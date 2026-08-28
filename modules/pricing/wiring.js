export const wiring = {
  id: 'pricing',
  variable: 'pricing',
  collectionImport: "import { pricingCollection } from './modules/pricing/collection'",
  collectionCall: (m, bp) =>
    `pricingCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${bp.modules.catalog ? ", linkedTo: 'catalog'" : ''} })`,
  dataQuery: () =>
    `payload.find({ collection: 'pricing', where: { active: { equals: true } }, limit: 50, sort: 'order' })`,
  sectionImport: "import PricingSection from '@/modules/pricing/Section'",
  sectionRender: (m, bp) =>
    `<PricingSection prices={pricing} title="${m.title}" tone={pricingTone ?? undefined}${bp.modules.contact ? ' ctaHref="/#contacto"' : ''} />`,
  renders: 'pricing.length > 0',
  jsonldImport: "import { pricingNodes } from '@/modules/pricing/jsonld'",
  jsonldNodes: (m) => `...pricingNodes(pricing, '${m.route}', '${m.title}')`,
  llmsImport: "import { pricingSection } from '@/modules/pricing/llms'",
  llmsSection: (m) => `pricingSection(pricing, '${m.title}')`,
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),
}
