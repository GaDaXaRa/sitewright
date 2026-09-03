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

  indexPage: (m) => ({
    path: `src/app/(frontend)${m.route}/page.tsx`,
    source: `import React from 'react'
import type { Metadata } from 'next'

import InnerPage from '../components/InnerPage'
import CatalogSection from '@/modules/catalog/Section'
import { loadSiteContent } from '@/lib/data'

export const revalidate = 300

export const metadata: Metadata = {
  title: '${m.labels.plural}',
  alternates: { canonical: '${m.route}' },
}

export default async function CatalogIndexPage() {
  const { settings, catalog } = await loadSiteContent()

  return (
    <InnerPage settings={settings} title="${m.labels.plural}">
      {catalog.length ? (
        <CatalogSection items={catalog} title="" route="${m.route}" />
      ) : (
        <section className="section">
          <div className="container">
            <p className="empty">Todavía no hay nada publicado.</p>
          </div>
        </section>
      )}
    </InnerPage>
  )
}
`,
  }),
  detailPage: (m) => ({
    path: `src/app/(frontend)${m.route}/[slug]/page.tsx`,
    source: `import React from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import InnerPage from '../../components/InnerPage'
import { loadSiteContent } from '@/lib/data'
import { mediaAlt, mediaUrl } from 'sitewright-core'

export const revalidate = 300

async function find(slug: string) {
  const { catalog } = await loadSiteContent()
  return catalog.find((item) => item.slug === slug) ?? null
}

export async function generateStaticParams() {
  const { catalog } = await loadSiteContent()
  return catalog.filter((item) => item.slug).map((item) => ({ slug: item.slug! }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = await find(slug)
  if (!item) return {}

  return {
    title: item.title,
    ...(item.summary ? { description: item.summary } : {}),
    alternates: { canonical: \`${m.route}/\${slug}\` },
  }
}

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await find(slug)
  if (!item) notFound()

  const { settings } = await loadSiteContent()
  const image = mediaUrl(item.image)

  return (
    <InnerPage settings={settings} kicker="${m.labels.singular}" title={item.title} intro={item.summary ?? undefined}>
      <section className="section">
        <div className="container container-narrow">
          {image ? (
            <Image
              src={image}
              alt={mediaAlt(item.image) || ''}
              width={1200}
              height={800}
              sizes="(max-width: 900px) 100vw, 760px"
              priority
            />
          ) : null}

          {(item.body ?? []).map((block, i) => (
            <div key={i}>
              {block.heading ? <h2>{block.heading}</h2> : null}
              <p>{block.text}</p>
            </div>
          ))}

          {item.highlights?.length ? (
            <ul>
              {item.highlights.map((point, i) => (
                <li key={i}>{point.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </InnerPage>
  )
}
`,
  }),

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
