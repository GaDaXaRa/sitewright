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
  collectionSlug: 'catalog',
  variable: 'catalog',
  collectionImport: "import { catalogCollection } from './modules/catalog/collection'",
  collectionCall: (m) =>
    `catalogCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${m.dated ? ', dated: true' : ''} })`,
  query: { collection: 'catalog', limit: 100, sort: 'order' },
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
  llmsName: 'catalogSection',
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  pagePath: '@/modules/catalog/Page',
  indexPage: true,
  detailPath: '@/modules/catalog/Detail',
  // De qué es ficha, en la palabra del cliente: «Servicio», «Proyecto», «Sesión». Sale del
  // blueprint, así que viaja como opción y no escrito en el componente.
  options: (m) => ({ singular: m.labels.singular }),

  // Example content: structure, not copy. It exists so the site can be looked at before
  // anybody has written a word, and so the client sees what a filled-in field looks like.
  seed: (m) => `  const catalogCount = await payload.count({ collection: 'catalog' })
  if (catalogCount.totalDocs === 0) {
    for (const [i, title] of ['Primera ${m.labels.singular.toLowerCase()}', 'Segunda ${m.labels.singular.toLowerCase()}', 'Tercera ${m.labels.singular.toLowerCase()}'].entries()) {
      await payload.create({
        collection: 'catalog',
        data: {
          title,
          summary: 'Dos o tres líneas contando de qué va. Esto es un ejemplo: cámbialo.',
          body: [{ text: 'Aquí va la explicación larga, la que se lee en su propia página.' }],
          order: i,${m.dated ? '\n          publishedAt: new Date().toISOString(),' : ''}
        },
      })
    }
    payload.logger.info('3 ${m.labels.plural.toLowerCase()} de ejemplo')
  }`,
}
