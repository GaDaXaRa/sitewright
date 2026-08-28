/**
 * How this module is wired into a site.
 *
 * It lives with the module, not in the generator, because H3 taught that the moment you
 * separate the collection from its section, its routes and its markup, somebody has to
 * reunite them — and that somebody ends up being the generator, which is exactly where the
 * knowledge should not be.
 */
export const wiring = {
  id: 'catalog',
  variable: 'catalog',
  collectionImport: "import { catalogCollection } from './modules/catalog/collection'",
  collectionCall: (m) =>
    `catalogCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${m.dated ? ', dated: true' : ''} })`,
  dataQuery: (m) =>
    `payload.find({ collection: 'catalog', limit: 100, sort: '${m.dated ? '-publishedAt' : 'order'}' })`,
  sectionImport: "import CatalogSection from '@/modules/catalog/Section'",
  sectionRender: (m) =>
    `<CatalogSection items={catalog} title="${m.title}" route="${m.route}" tone={catalogTone ?? undefined} limit={6} />`,
  renders: 'catalog.length > 0',
  jsonldImport: "import { catalogNodes } from '@/modules/catalog/jsonld'",
  jsonldNodes: (m, bp) =>
    bp.modules.pricing
      ? `...catalogNodes(catalog, '${m.route}', (item) =>\n          pricing.filter((price) => {\n            const owner = price.belongsTo\n            const id = typeof owner === 'object' ? owner?.id : owner\n            return String(id) === String(item.id)\n          }),\n        )`
      : `...catalogNodes(catalog, '${m.route}')`,
  llmsImport: "import { catalogSection } from '@/modules/catalog/llms'",
  llmsSection: (m) => `catalogSection(catalog, '${m.title}', '${m.route}')`,
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),
}
